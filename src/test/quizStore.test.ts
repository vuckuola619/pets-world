import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useQuizStore, loadQuizStats, saveQuizStats, emptyQuizStats, type QuizStats } from '../store/useQuizStore'
import { generateQuiz } from '../lib/quizQuestions'

function statsWith(partial: Partial<QuizStats>): QuizStats {
  return { ...emptyQuizStats(), ...partial }
}

describe('quiz stats persistence', () => {
  beforeEach(() => {
    localStorage.clear()
    useQuizStore.getState().resetStats()
  })

  it('round-trips stats through localStorage', () => {
    const stats = statsWith({ gamesPlayed: 4, bestScore: 9, bestStreak: 6, totalCorrect: 23, totalQuestions: 40 })
    saveQuizStats(stats)
    expect(loadQuizStats()).toEqual(stats)
  })

  it('falls back to empty stats when nothing is stored or JSON is corrupt', () => {
    expect(loadQuizStats()).toEqual(emptyQuizStats())
    localStorage.setItem('wildlife-quiz-stats', '{not json')
    expect(loadQuizStats()).toEqual(emptyQuizStats())
  })
})

describe('useQuizStore', () => {
  beforeEach(() => {
    localStorage.clear()
    useQuizStore.getState().resetStats()
    useQuizStore.getState().resetRound()
  })

  it('starts a round, records answers, and advances', () => {
    const questions = generateQuiz({ mode: 'wildlife', locale: 'en', seed: 7 })
    const store = useQuizStore.getState()
    store.startRound(questions, 'wildlife')

    let s = useQuizStore.getState()
    expect(s.roundActive).toBe(true)
    expect(s.index).toBe(0)
    expect(s.answers).toEqual([null])

    s.answerCurrent(questions[0].answerId)
    s.next()
    s = useQuizStore.getState()
    expect(s.answers[0]).toBe(questions[0].answerId)
    expect(s.index).toBe(1)
  })

  it('finishes the round and persists updated stats', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
    const questions = generateQuiz({ mode: 'wildlife', locale: 'en', seed: 7 })
      .map((q) => ({ ...q, options: q.options, answerId: q.answerId }))
    const store = useQuizStore.getState()
    store.startRound(questions, 'wildlife')

    // Answer every question correctly
    for (let i = 0; i < questions.length; i += 1) {
      useQuizStore.getState().answerCurrent(questions[i].answerId)
      useQuizStore.getState().next()
    }
    useQuizStore.getState().finishRound()

    const stats = useQuizStore.getState().stats
    expect(stats.gamesPlayed).toBe(1)
    expect(stats.bestScore).toBe(questions.length)
    expect(stats.bestStreak).toBe(questions.length)
    expect(stats.perfectRounds).toBe(1)
    expect(setItemSpy).toHaveBeenCalledWith('wildlife-quiz-stats', expect.any(String))
    setItemSpy.mockRestore()
  })

  it('tracks games per atlas mode', () => {
    const questions = generateQuiz({ mode: 'prehistoric', locale: 'en', seed: 3 })
    const store = useQuizStore.getState()
    store.startRound(questions, 'prehistoric')
    while (useQuizStore.getState().roundActive) {
      const s = useQuizStore.getState()
      s.answerCurrent(s.questions[s.index].options[0].id)
      s.next()
    }
    useQuizStore.getState().finishRound()
    expect(useQuizStore.getState().stats.gamesByMode.prehistoric).toBe(1)
    expect(useQuizStore.getState().stats.gamesByMode.wildlife).toBe(0)
  })

  it('resetStats clears persistence', () => {
    saveQuizStats(statsWith({ gamesPlayed: 2 }))
    useQuizStore.getState().resetStats()
    expect(loadQuizStats()).toEqual(emptyQuizStats())
    expect(useQuizStore.getState().stats).toEqual(emptyQuizStats())
  })
})
