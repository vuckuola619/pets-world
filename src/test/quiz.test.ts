import { describe, it, expect } from 'vitest'
import {
  generateQuiz,
  streakFromAnswers,
  scoreFromAnswers,
  QUIZ_ROUNDS,
} from '../lib/quizQuestions'
import type { QuizQuestion } from '../lib/quizQuestions'
import { t } from '../lib/i18n'

/** Deterministic seed so every test runs against the same round */
const SEED = 42

describe('generateQuiz', () => {
  it('returns the default round length for the wildlife atlas', () => {
    const quiz = generateQuiz({ mode: 'wildlife', locale: 'en', seed: SEED })
    expect(quiz).toHaveLength(QUIZ_ROUNDS)
  })

  it('is deterministic for a given seed', () => {
    const a = generateQuiz({ mode: 'wildlife', locale: 'en', seed: SEED })
    const b = generateQuiz({ mode: 'wildlife', locale: 'en', seed: SEED })
    expect(a).toEqual(b)
  })

  it('always includes the correct answer among the options, with unique ids', () => {
    const quiz = generateQuiz({ mode: 'wildlife', locale: 'en', seed: SEED })
    for (const q of quiz) {
      const ids = q.options.map((o) => o.id)
      expect(new Set(ids).size).toBe(ids.length)
      expect(ids).toContain(q.answerId)
      expect(q.options.length).toBeGreaterThanOrEqual(2)
    }
  })

  it('asks all four question kinds across a wildlife round', () => {
    const quiz = generateQuiz({ mode: 'wildlife', locale: 'en', seed: SEED })
    const kinds = new Set(quiz.map((q) => q.kind))
    for (const kind of ['blur', 'fact', 'iucn', 'region'] as const) {
      expect(kinds.has(kind)).toBe(true)
    }
  })

  it('never asks IUCN questions in prehistoric mode (statuses are all Extinct)', () => {
    const quiz = generateQuiz({ mode: 'prehistoric', locale: 'en', seed: SEED })
    expect(quiz.length).toBeGreaterThan(0)
    expect(quiz.some((q) => q.kind === 'iucn')).toBe(false)
    const kinds = new Set(quiz.map((q) => q.kind))
    for (const kind of kinds) {
      expect(['blur', 'fact', 'region']).toContain(kind)
    }
  })

  it('localizes region options for the Indonesian locale', () => {
    const quiz = generateQuiz({ mode: 'wildlife', locale: 'id', seed: SEED, length: 40 })
    const regionQs = quiz.filter((q) => q.kind === 'region')
    expect(regionQs.length).toBeGreaterThan(0)
    const translatedValues: string[] = Object.values(t('id').regions)
    for (const q of regionQs) {
      for (const o of q.options) {
        // Regions with an ID translation must never leak their raw English name
        if (translatedValues.includes(o.label)) continue
        expect(['North America', 'South America', 'Europe', 'Africa', 'Asia', 'Middle East', 'Arctic', 'Antarctic', 'Oceania']).not.toContain(o.label)
      }
    }
    // Some Indonesian labels differ from the raw names — prove they're used
    const translatedForms = new Set(['Eropa', 'Afrika', 'Timur Tengah', 'Arktik', 'Antarktika', 'Amerika Selatan'])
    const allLabels = regionQs.flatMap((q) => q.options.map((o) => o.label))
    expect(allLabels.some((l) => translatedForms.has(l))).toBe(true)
  })

  it('localizes IUCN option labels', () => {
    const quiz = generateQuiz({ mode: 'wildlife', locale: 'id', seed: SEED })
    const iucnQ = quiz.find((q) => q.kind === 'iucn')
    expect(iucnQ).toBeDefined()
    for (const o of iucnQ!.options) {
      expect(o.label).not.toMatch(/^(LC|NT|VU|EN|CR|DD)$/)
    }
  })

  it('uses Indonesian fun facts for fact questions in the ID locale', () => {
    const quiz = generateQuiz({ mode: 'wildlife', locale: 'id', seed: SEED })
    const factQs = quiz.filter((q): q is QuizQuestion & { kind: 'fact' } => q.kind === 'fact')
    expect(factQs.length).toBeGreaterThan(0)
    for (const q of factQs) {
      expect(q.statement).toBeTruthy()
      expect(typeof q.isTrue).toBe('boolean')
      // A true statement is one of the subject's own fun facts
      if (q.isTrue) {
        expect(q.record.funFacts_id ?? q.record.funFacts).toContain(q.statement)
      }
    }
  })

  it('only builds blur questions from records that have an image', () => {
    const quiz = generateQuiz({ mode: 'wildlife', locale: 'en', seed: SEED })
    for (const q of quiz) {
      if (q.kind === 'blur') {
        expect(q.record.imageUrl).toBeTruthy()
      }
    }
  })

  it('clamps the round length to what the pool can generate', () => {
    const quiz = generateQuiz({ mode: 'prehistoric', locale: 'en', seed: SEED, length: 100 })
    expect(quiz.length).toBeLessThanOrEqual(100)
    expect(quiz.length).toBeGreaterThan(0)
  })

  it('returns an empty round for a degenerate pool', () => {
    expect(generateQuiz({ mode: 'wildlife', locale: 'en', seed: SEED, length: 0 })).toEqual([])
  })
})

describe('streakFromAnswers', () => {
  it('counts the current consecutive correct tail', () => {
    const answers = ['a', 'b', null, 'a', 'a', 'a']
    const key = (q: QuizQuestion, picked: string) => (picked === 'a' ? q.answerId : 'wrong')
    const questions = [
      { answerId: 'a' }, { answerId: 'b' }, { answerId: 'c' }, { answerId: 'a' }, { answerId: 'a' }, { answerId: 'a' },
    ] as unknown as QuizQuestion[]
    const picked = answers.map((pickedId, i) => (pickedId === null ? null : key(questions[i], pickedId)))
    expect(streakFromAnswers(questions, picked)).toBe(3)
  })
})

describe('scoreFromAnswers', () => {
  it('counts correct answers and skips unanswered questions', () => {
    const questions = [{ answerId: 'x' }, { answerId: 'y' }, { answerId: 'z' }] as QuizQuestion[]
    expect(scoreFromAnswers(questions, ['x', 'y', null])).toBe(2)
    expect(scoreFromAnswers(questions, [null, null, null])).toBe(0)
  })
})
