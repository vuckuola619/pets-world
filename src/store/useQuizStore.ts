import { create } from 'zustand'
import {
  scoreFromAnswers,
  streakFromAnswers,
  bestStreakFromAnswers,
  type QuizQuestion,
} from '../lib/quizQuestions'
import type { AtlasMode } from './useMapStore'

const STORAGE_KEY = 'wildlife-quiz-stats'

export interface QuizStats {
  gamesPlayed: number
  /** Best correct-count within a single round */
  bestScore: number
  /** Best consecutive-correct run across all rounds */
  bestStreak: number
  totalCorrect: number
  totalQuestions: number
  perfectRounds: number
  gamesByMode: { wildlife: number; prehistoric: number }
}

export function emptyQuizStats(): QuizStats {
  return {
    gamesPlayed: 0,
    bestScore: 0,
    bestStreak: 0,
    totalCorrect: 0,
    totalQuestions: 0,
    perfectRounds: 0,
    gamesByMode: { wildlife: 0, prehistoric: 0 },
  }
}

/** SSR-safe read; corrupt or partial data falls back to empty stats */
export function loadQuizStats(): QuizStats {
  if (typeof window === 'undefined') return emptyQuizStats()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyQuizStats()
    const parsed = JSON.parse(raw) as Partial<QuizStats>
    const empty = emptyQuizStats()
    return {
      ...empty,
      ...parsed,
      gamesByMode: { ...empty.gamesByMode, ...(parsed.gamesByMode ?? {}) },
    }
  } catch {
    return emptyQuizStats()
  }
}

export function saveQuizStats(stats: QuizStats): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats))
  } catch {
    // Storage full/unavailable — quiz still works, stats just won't persist
  }
}

export interface QuizRoundResult {
  correct: number
  total: number
  streak: number
  isPerfect: boolean
  isNewBest: boolean
}

interface QuizState {
  questions: QuizQuestion[]
  index: number
  /** Chosen option id per answered question; null = not yet answered */
  answers: (string | null)[]
  roundActive: boolean
  finished: boolean
  mode: AtlasMode
  stats: QuizStats
  result: QuizRoundResult | null
  startRound: (questions: QuizQuestion[], mode: AtlasMode) => void
  answerCurrent: (optionId: string) => void
  next: () => void
  /** Fold the finished round into persistent stats; safe to call once */
  finishRound: () => QuizRoundResult | null
  resetRound: () => void
  resetStats: () => void
}

export const useQuizStore = create<QuizState>()((set, get) => ({
  questions: [],
  index: 0,
  answers: [],
  roundActive: false,
  finished: false,
  mode: 'wildlife',
  stats: loadQuizStats(),
  result: null,

  startRound: (questions, mode) =>
    set({
      questions,
      mode,
      index: 0,
      answers: [null],
      roundActive: true,
      finished: false,
      result: null,
    }),

  answerCurrent: (optionId) => {
    const { roundActive, finished, index, answers } = get()
    if (!roundActive || finished || answers[index] !== null && answers[index] !== undefined) return
    const nextAnswers = [...answers]
    nextAnswers[index] = optionId
    set({ answers: nextAnswers })
  },

  next: () => {
    const { roundActive, index, questions, answers } = get()
    if (!roundActive) return
    if (index < questions.length - 1) {
      set({ index: index + 1, answers: [...answers, null] })
    } else {
      // Last question answered — move to the results view
      set({ index: questions.length, roundActive: false })
    }
  },

  finishRound: () => {
    const { questions, answers, stats, mode, finished } = get()
    if (finished || questions.length === 0) return null

    const correct = scoreFromAnswers(questions, answers)
    const streak = bestStreakFromAnswers(questions, answers)
    const isPerfect = correct === questions.length
    const isNewBest = correct > stats.bestScore

    const nextStats: QuizStats = {
      gamesPlayed: stats.gamesPlayed + 1,
      bestScore: Math.max(stats.bestScore, correct),
      bestStreak: Math.max(stats.bestStreak, streak),
      totalCorrect: stats.totalCorrect + correct,
      totalQuestions: stats.totalQuestions + questions.length,
      perfectRounds: stats.perfectRounds + (isPerfect ? 1 : 0),
      gamesByMode: {
        ...stats.gamesByMode,
        [mode]: stats.gamesByMode[mode] + 1,
      },
    }
    saveQuizStats(nextStats)

    const result: QuizRoundResult = { correct, total: questions.length, streak, isPerfect, isNewBest }
    set({ stats: nextStats, result, finished: true })
    return result
  },

  resetRound: () =>
    set({ questions: [], index: 0, answers: [], roundActive: false, finished: false, result: null }),

  resetStats: () => {
    saveQuizStats(emptyQuizStats())
    set({ stats: emptyQuizStats() })
  },
}))

/** Live consecutive-correct streak for the current round (for the streak chip) */
export function currentStreak(questions: QuizQuestion[], answers: (string | null)[]): number {
  return streakFromAnswers(questions, answers)
}
