import { getAtlasRecords, getAtlasRegions } from '../hooks/useAtlasAnimals'
import { STATUS_CODE } from './iucn'
import { t, type Locale } from './i18n'
import { getEntryFunFacts } from './profileText'
import type { AnimalEntry } from '../data/countries'
import type { AtlasMode } from '../store/useMapStore'

/** Questions per round */
export const QUIZ_ROUNDS = 10

export type QuizQuestionKind = 'blur' | 'fact' | 'iucn' | 'region'

export interface QuizOption {
  /** Stable identifier (record id, IUCN code, region string, or true/false) */
  id: string
  /** Locale-resolved display text */
  label: string
}

export interface QuizQuestion {
  /** Unique within a round */
  id: string
  kind: QuizQuestionKind
  /** The species the question is about — also the "learn more" link target */
  record: AnimalEntry
  /** Fact text for 'fact' questions; unused by other kinds */
  statement?: string
  /** Whether the statement is correctly attributed (fact questions only) */
  isTrue?: boolean
  options: QuizOption[]
  answerId: string
}

/** mulberry32 — tiny seeded PRNG so rounds are reproducible in tests */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffled<T>(items: T[], rng: () => number): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function pickDistractors(pool: QuizOption[], answerId: string, count: number, rng: () => number): QuizOption[] {
  const candidates = pool.filter((o) => o.id !== answerId)
  return shuffled(candidates, rng).slice(0, count)
}

function withOptions(question: Omit<QuizQuestion, 'options' | 'answerId'>, options: QuizOption[], answerId: string): QuizQuestion {
  return { ...question, options, answerId }
}

/** IUCN status options offered for wildlife conservation questions */
const IUCN_POOL = ['LC', 'NT', 'VU', 'EN', 'CR', 'DD']

interface GenerateArgs {
  mode: AtlasMode
  locale: Locale
  /** Questions to attempt (clamped by what the pool supports) */
  length?: number
  /** Seed for deterministic rounds; omit for a random round */
  seed?: number
}

/**
 * Builds a quiz round from the active atlas data. Question kinds are cycled
 * for variety; kinds the pool can't support are skipped (prehistoric records
 * share one conservation status, so no IUCN questions there).
 */
export function generateQuiz({ mode, locale, length = QUIZ_ROUNDS, seed = Math.floor(Math.random() * 2 ** 31) }: GenerateArgs): QuizQuestion[] {
  if (length <= 0) return []
  const rng = mulberry32(seed)
  const records = getAtlasRecords(mode)
  if (records.length < 4) return []

  const tr = t(locale)
  const allRegions = getAtlasRegions(mode)
  const regionOptions: QuizOption[] = allRegions
    .filter((r) => r !== 'All')
    .map((r) => ({ id: r, label: tr.regions[r as keyof typeof tr.regions] ?? r }))
  const iucnOptions: QuizOption[] = IUCN_POOL.map((code) => ({
    id: code,
    label: code === 'DD' ? tr.iucn.DD : tr.conservation[
      (Object.keys(STATUS_CODE) as string[]).find((k) => STATUS_CODE[k] === code) as keyof typeof tr.conservation
    ] ?? tr.iucn[code as keyof typeof tr.iucn],
  }))
  const trueFalseOptions: QuizOption[] = [
    { id: 'true', label: locale === 'id' ? 'Benar' : 'True' },
    { id: 'false', label: locale === 'id' ? 'Salah' : 'False' },
  ]

  const usableIucn = mode === 'wildlife'
  const usableBlur = records.filter((r) => Boolean(r.imageUrl))
  const usableFacts = records.filter((r) => getEntryFunFacts(r, locale).length > 0)

  // Interleave kinds so a round mixes blur, fact, status, and geography
  const kindCycle: QuizQuestionKind[] = usableIucn
    ? ['blur', 'fact', 'iucn', 'region']
    : ['blur', 'fact', 'region']

  const questions: QuizQuestion[] = []
  const usedRecords = new Set<string>()
  const shuffledRecords = shuffled(records, rng)
  const pickRecord = (pool: AnimalEntry[]): AnimalEntry | null => {
    // Prefer records not yet used this round to avoid repeats
    const fresh = pool.filter((r) => !usedRecords.has(r.id))
    const source = fresh.length > 0 ? fresh : pool
    const picked = source[Math.floor(rng() * source.length)]
    return picked ?? null
  }

  for (let i = 0; i < length; i += 1) {
    // Try the cycled kind first; fall back to any kind the pool supports
    const ordered: QuizQuestionKind[] = [
      kindCycle[i % kindCycle.length],
      ...kindCycle.filter((k) => k !== kindCycle[i % kindCycle.length]),
    ]
    let built: QuizQuestion | null = null

    for (const kind of ordered) {
      if (built) break
      if (kind === 'blur' && usableBlur.length >= 4) {
        const record = pickRecord(usableBlur)
        if (!record) continue
        const nameOf = (r: AnimalEntry): QuizOption => ({ id: r.id, label: r.animal })
        const options = shuffled([nameOf(record), ...pickDistractors(usableBlur.map(nameOf), record.id, 3, rng)], rng)
        built = withOptions({ id: `${record.id}-blur-${i}`, kind, record }, options, record.id)
        usedRecords.add(record.id)
      } else if (kind === 'region' && regionOptions.length >= 4) {
        const record = pickRecord(records)
        if (!record) continue
        const options = shuffled([{ id: record.region, label: tr.regions[record.region as keyof typeof tr.regions] ?? record.region }, ...pickDistractors(regionOptions, record.region, 3, rng)], rng)
        built = withOptions({ id: `${record.id}-region-${i}`, kind, record }, options, record.region)
        usedRecords.add(record.id)
      } else if (kind === 'iucn' && usableIucn) {
        const record = pickRecord(records)
        if (!record) continue
        const answerCode = STATUS_CODE[record.conservationStatus]
        if (!answerCode || !iucnOptions.some((o) => o.id === answerCode)) continue
        const options = shuffled([{ id: answerCode, label: iucnOptions.find((o) => o.id === answerCode)!.label }, ...pickDistractors(iucnOptions, answerCode, 3, rng)], rng)
        built = withOptions({ id: `${record.id}-iucn-${i}`, kind, record }, options, answerCode)
        usedRecords.add(record.id)
      } else if (kind === 'fact' && usableFacts.length >= 2) {
        const record = pickRecord(usableFacts)
        if (!record) continue
        const facts = getEntryFunFacts(record, locale)
        const statement = facts[Math.floor(rng() * facts.length)]
        const isTrue = rng() < 0.5
        // A false statement is a real fact stolen from a different species
        const impostor = shuffled(usableFacts.filter((r) => r.id !== record.id), rng)[0]
        if (isTrue && !statement) continue
        if (!isTrue && !impostor) continue
        const finalStatement = isTrue ? statement : getEntryFunFacts(impostor, locale)[0]
        built = withOptions(
          { id: `${record.id}-fact-${i}`, kind, record, statement: finalStatement, isTrue },
          trueFalseOptions,
          isTrue ? 'true' : 'false',
        )
        usedRecords.add(record.id)
      }
    }

    if (built) questions.push(built)
  }

  return questions
}

/** Correct answers so far in the round (nulls skipped) */
export function scoreFromAnswers(questions: QuizQuestion[], answers: (string | null)[]): number {
  return questions.reduce((score, q, i) => (answers[i] === q.answerId ? score + 1 : score), 0)
}

/** Length of the consecutive correct streak ending at the latest answer */
export function streakFromAnswers(questions: QuizQuestion[], answers: (string | null)[]): number {
  let streak = 0
  for (let i = answers.length - 1; i >= 0; i -= 1) {
    if (answers[i] === null || answers[i] === undefined) break
    if (answers[i] === questions[i]?.answerId) streak += 1
    else break
  }
  return streak
}

/** Best consecutive-correct run anywhere in the round */
export function bestStreakFromAnswers(questions: QuizQuestion[], answers: (string | null)[]): number {
  let best = 0
  let current = 0
  for (let i = 0; i < answers.length; i += 1) {
    if (answers[i] !== null && answers[i] !== undefined && answers[i] === questions[i]?.answerId) {
      current += 1
      best = Math.max(best, current)
    } else if (answers[i] !== null && answers[i] !== undefined) {
      current = 0
    }
  }
  return best
}
