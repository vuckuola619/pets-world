"use client"
import React from 'react';

import { useCallback, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import confetti from "canvas-confetti";
import { ArrowLeft, Gamepad2, Flame, Sparkles, Trophy, Check, X, BadgeCheck, BookOpen, RotateCcw } from "lucide-react";
import { useMapStore } from "../../store/useMapStore";
import { useQuizStore } from "../../store/useQuizStore";
import { generateQuiz, type QuizQuestion } from "../../lib/quizQuestions";
import { t } from "../../lib/i18n";
import { audioService } from "../../components/AudioService";
import AnimatedNumber from "../../components/AnimatedNumber";
import { IUCN_CONFIG } from "../../lib/iucn";
import { localDinoThumb } from "../../lib/wikiImages";

/** Replaces {placeholder} tokens in i18n template strings */
function fill(template: string, vars: Record<string, string | number>): string {
  return Object.entries(vars).reduce(
    (acc, [key, value]) => acc.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

/** Center-stage celebration for personal bests and perfect rounds */
function celebrate(reduceMotion: boolean): void {
  if (reduceMotion) return;
  const colors = ['--natura-emerald', '--natura-ocean', '--natura-amber', '--natura-coral', '--natura-sage']
    .map((name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim())
    .filter(Boolean);
  confetti({
    particleCount: 140,
    spread: 100,
    startVelocity: 42,
    scalar: 1,
    ticks: 220,
    origin: { x: 0.5, y: 0.4 },
    colors: colors.length > 0 ? colors : undefined,
    disableForReducedMotion: true,
  });
}

function badgeState(stats: ReturnType<typeof useQuizStore.getState>['stats']) {
  return [
    { key: 'firstRound', earned: stats.gamesPlayed >= 1 },
    { key: 'perfect', earned: stats.perfectRounds >= 1 },
    { key: 'streak', earned: stats.bestStreak >= 5 },
    { key: 'dino', earned: stats.gamesByMode.prehistoric >= 1 },
  ] as const;
}

/** Blurred-photo reveal; the blur eases off once the answer is locked in */
function MysteryImage({ question, revealed }: { question: QuizQuestion; revealed: boolean }): React.JSX.Element {
  const reduceMotion = useReducedMotion();
  const isPrehistoric = useMapStore((s) => s.atlasMode) === 'prehistoric';
  const src = isPrehistoric && question.record.imageKind === 'photo'
    ? localDinoThumb(question.record.slug, 480)
    : question.record.imageUrl ?? '';
  return (
    <motion.div
      className="relative mx-auto w-full max-w-sm overflow-hidden rounded-2xl"
      style={{ aspectRatio: '4/3', background: 'var(--accent)' }}
      animate={revealed && !reduceMotion ? { filter: 'blur(0px)', scale: 1 } : { filter: 'blur(26px)', scale: 1.04 }}
      transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
    >
      <Image
        src={src}
        alt={revealed ? question.record.animal : 'Mystery species'}
        fill
        sizes="(max-width: 640px) 90vw, 384px"
        className="object-cover"
        unoptimized
      />
    </motion.div>
  );
}

/** Animated donut showing the final score */
function ScoreRing({ correct, total }: { correct: number; total: number }): React.JSX.Element {
  const ratio = total > 0 ? correct / total : 0;
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="relative mx-auto h-36 w-36">
      <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90" role="img" aria-label={`${correct} of ${total} correct`}>
        <circle cx="70" cy="70" r={radius} fill="none" stroke="var(--accent)" strokeWidth="12" />
        <motion.circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="var(--natura-emerald)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - ratio) }}
          transition={{ duration: 1.1, ease: [0.23, 1, 0.32, 1], delay: 0.2 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-heading text-3xl font-bold text-foreground">
          <AnimatedNumber value={correct} />
        </span>
        <span className="text-xs text-muted-foreground">/ {total}</span>
      </div>
    </div>
  );
}

export default function QuizView(): React.JSX.Element {
  const { atlasMode, locale } = useMapStore();
  const tr = t(locale);
  const reduceMotion = useReducedMotion();
  const { questions, index, answers, roundActive, stats, result, startRound, answerCurrent, next, finishRound } = useQuizStore();

  // Result screen once the round is folded into stats; after the last
  // question next() clears roundActive, so "awaiting-finish" must not
  // depend on it.
  const phase = result
    ? 'results'
    : roundActive && index < questions.length
      ? 'playing'
      : questions.length > 0 && index >= questions.length
        ? 'awaiting-finish'
        : 'intro';

  // Fold stats once the last question is passed; celebrate bests immediately
  useEffect(() => {
    if (phase !== 'awaiting-finish') return;
    const roundResult = finishRound();
    if (roundResult && (roundResult.isNewBest || roundResult.isPerfect)) {
      celebrate(reduceMotion ?? false);
    }
  }, [phase, finishRound, reduceMotion]);

  const question = phase === 'playing' ? questions[index] : null;
  const picked = question ? answers[index] ?? null : null;
  const answeredCount = answers.filter((a): a is string => a !== null && a !== undefined).length;
  const liveStreak = useMemo(() => {
    let streak = 0;
    for (let i = answers.length - 1; i >= 0; i -= 1) {
      if (answers[i] === null || answers[i] === undefined) break;
      if (answers[i] === questions[i]?.answerId) streak += 1;
      else break;
    }
    return streak;
  }, [answers, questions]);

  const start = useCallback(() => {
    const quiz = generateQuiz({ mode: atlasMode, locale });
    if (quiz.length === 0) return;
    startRound(quiz, atlasMode);
    audioService.playClickSound();
  }, [atlasMode, locale, startRound]);

  const handleAnswer = useCallback((optionId: string) => {
    if (picked !== null || !question) return;
    answerCurrent(optionId);
    if (optionId === question.answerId) audioService.playDingSound();
    else audioService.playBuzzSound();
  }, [picked, question, answerCurrent]);

  const handleAdvance = useCallback(() => {
    next();
    audioService.playClickSound();
  }, [next]);

  // Keyboard: 1-4 to answer, Enter to advance
  useEffect(() => {
    if (phase !== 'playing') return;
    const handler = (e: KeyboardEvent) => {
      const num = Number.parseInt(e.key, 10);
      if (question && picked === null && num >= 1 && num <= question.options.length) {
        handleAnswer(question.options[num - 1].id);
      } else if (picked !== null && e.key === 'Enter') {
        handleAdvance();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [phase, question, picked, handleAnswer, handleAdvance]);

  const questionPrompt = (q: QuizQuestion): string => {
    switch (q.kind) {
      case 'blur':
        return tr.quiz.blurPrompt;
      case 'region':
        return fill(tr.quiz.regionPrompt, { name: q.record.animal });
      case 'iucn':
        return fill(tr.quiz.iucnPrompt, { name: q.record.animal });
      case 'fact':
        return fill(tr.quiz.factPrompt, { name: q.record.animal });
    }
  };

  return (
    <div className="h-screen overflow-y-auto bg-natura-gradient scrollbar-thin">
      <div className="min-h-full w-full px-4 pb-16 pt-5 sm:px-6">
      <div className="mx-auto flex min-h-full w-full max-w-xl flex-col">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
            <Link
              href="/"
              className="press flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur transition-colors hover:bg-white/20"
            >
              <ArrowLeft size={14} />
              {tr.quiz.backToAtlas}
            </Link>
            <h1 className="flex items-center gap-2 font-heading text-lg font-bold text-white drop-shadow-sm">
              <Gamepad2 size={18} aria-hidden />
              {tr.quiz.title}
            </h1>
            <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90 backdrop-blur" title={tr.quiz.streak}>
              <Flame size={13} aria-hidden style={{ color: liveStreak >= 3 ? 'var(--natura-amber)' : 'currentColor' }} />
              {liveStreak}
            </div>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            {/* ─── Intro ─── */}
            {phase === 'intro' && (
              <motion.section
                key="intro"
                className="my-auto mt-8 rounded-3xl border border-white/25 bg-white/10 p-8 text-center shadow-xl backdrop-blur-md"
                initial={reduceMotion ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15">
                  <Sparkles size={30} className="text-white" aria-hidden />
                </div>
                <h2 className="mt-4 font-heading text-2xl font-bold text-white">{atlasMode === 'prehistoric' ? `${tr.quiz.title} — ${tr.atlasModes.prehistoric}` : tr.quiz.title}</h2>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-white/85">{tr.quiz.tagline}</p>
                <button
                  onClick={start}
                  className="press mt-6 inline-flex items-center gap-2 rounded-full px-8 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition-all duration-200 hover:shadow-xl hover:brightness-110 active:scale-95"
                  style={{ background: 'linear-gradient(135deg, var(--natura-forest), var(--natura-emerald))' }}
                >
                  <Gamepad2 size={16} aria-hidden />
                  {tr.quiz.start}
                </button>
                <div className="mt-3 text-[11px] text-white/70">{tr.quiz.roundsInfo}</div>
              </motion.section>
            )}

            {/* ─── Playing ─── */}
            {phase === 'playing' && question && (
              <motion.section
                key="playing"
                className="mt-6"
                initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              >
                {/* Progress */}
                <div className="flex items-center justify-between text-[11px] font-medium text-white/80">
                  <span>{fill(tr.quiz.questionOf, { current: index + 1, total: questions.length })}</span>
                  <span>{Math.round((answeredCount / questions.length) * 100)}%</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/20" role="progressbar" aria-valuenow={answeredCount} aria-valuemin={0} aria-valuemax={questions.length}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: 'linear-gradient(90deg, var(--natura-sage), var(--primary-foreground))' }}
                    animate={{ width: `${(answeredCount / questions.length) * 100}%` }}
                    transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
                  />
                </div>

                {/* Question card */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={question.id}
                    className="glass-card mt-4 rounded-3xl p-6 shadow-xl"
                    initial={reduceMotion ? false : { opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -40 }}
                    transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
                  >
                    {question.kind === 'blur' && <MysteryImage question={question} revealed={picked !== null} />}
                    {question.kind === 'fact' && (
                      <blockquote className="rounded-2xl bg-accent/60 px-4 py-3.5 text-sm italic leading-relaxed text-foreground">
                        “{question.statement}”
                      </blockquote>
                    )}
                    <h2 className="mt-4 font-heading text-lg font-semibold leading-snug text-foreground">{questionPrompt(question)}</h2>

                    {/* Options */}
                    <div className={`mt-5 grid gap-2.5 ${question.options.length === 2 ? 'grid-cols-2' : ''}`} role="group" aria-label={tr.quiz.title}>
                      {question.options.map((option, i) => {
                        const isAnswer = option.id === question.answerId;
                        const isPicked = option.id === picked;
                        const revealed = picked !== null;
                        const showCorrect = revealed && isAnswer;
                        const showWrong = revealed && isPicked && !isAnswer;
                        const iucnDot = question.kind === 'iucn' ? IUCN_CONFIG[option.id]?.bg : undefined;
                        return (
                          <motion.button
                            key={option.id}
                            onClick={() => handleAnswer(option.id)}
                            disabled={revealed}
                            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1], delay: reduceMotion ? 0 : Math.min(i * 0.04, 0.2) }}
                            whileTap={revealed || reduceMotion ? undefined : { scale: 0.97 }}
                            className={`flex items-center gap-2.5 rounded-2xl border-2 px-4 py-3 text-left text-sm font-medium outline-none transition-colors duration-200 ${
                              showCorrect
                                ? 'border-[var(--natura-emerald)] bg-[color-mix(in_oklch,var(--natura-emerald)_18%,transparent)] text-foreground'
                                : showWrong
                                ? 'animate-shake border-[var(--natura-coral)] bg-[color-mix(in_oklch,var(--natura-coral)_16%,transparent)] text-foreground'
                                : revealed
                                ? 'border-border bg-card/60 text-muted-foreground'
                                : 'border-border bg-card text-foreground hover:border-primary/40 hover:bg-accent/70'
                            }`}
                          >
                            <kbd className="hidden h-5 w-5 shrink-0 items-center justify-center rounded border border-border bg-accent text-[10px] font-bold text-muted-foreground sm:flex" aria-hidden>
                              {i + 1}
                            </kbd>
                            {iucnDot && <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: iucnDot }} aria-hidden />}
                            <span className="flex-1">{option.label}</span>
                            {showCorrect && <Check size={16} className="shrink-0 text-[var(--natura-emerald)]" aria-hidden />}
                            {showWrong && <X size={16} className="shrink-0 text-[var(--natura-coral)]" aria-hidden />}
                          </motion.button>
                        );
                      })}
                    </div>

                    {/* Feedback + advance */}
                    <AnimatePresence>
                      {picked !== null && (
                        <motion.div
                          className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.25 }}
                          aria-live="polite"
                        >
                          <div className="text-sm font-semibold" style={{ color: picked === question.answerId ? 'var(--natura-emerald)' : 'var(--natura-coral)' }}>
                            {picked === question.answerId ? tr.quiz.correct : tr.quiz.incorrect}
                            {picked !== question.answerId && (
                              <span className="ml-2 font-medium text-muted-foreground">
                                {fill(tr.quiz.answerWas, {
                                  answer: question.kind === 'fact'
                                    ? (question.answerId === 'true' ? tr.quiz.trueLabel : tr.quiz.falseLabel)
                                    : question.options.find((o) => o.id === question.answerId)?.label ?? '',
                                })}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/animal/${question.record.slug}`}
                              prefetch={false}
                              className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent/70"
                            >
                              <BookOpen size={12} aria-hidden />
                              {tr.quiz.learnMore}
                            </Link>
                            <button
                              onClick={handleAdvance}
                              className="press rounded-full px-5 py-2 text-xs font-semibold text-primary-foreground shadow transition-all duration-200 hover:shadow-lg active:scale-95"
                              style={{ background: 'linear-gradient(135deg, var(--natura-forest), var(--natura-emerald))' }}
                            >
                              {index === questions.length - 1 ? tr.quiz.seeResults : tr.quiz.next}
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </AnimatePresence>
              </motion.section>
            )}

            {/* ─── Results ─── */}
            {phase === 'results' && result && (
              <motion.section
                key="results"
                className="mt-8 rounded-3xl border border-white/25 bg-white/10 p-8 text-center shadow-xl backdrop-blur-md"
                initial={reduceMotion ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
              >
                {(result.isPerfect || result.isNewBest) && (
                  <motion.div
                    className="mx-auto mb-2 flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, var(--natura-amber), var(--natura-coral))' }}
                    initial={reduceMotion ? false : { scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 16, delay: 0.3 }}
                  >
                    <Trophy size={13} aria-hidden />
                    {result.isPerfect ? tr.quiz.perfect : tr.quiz.newBest}
                  </motion.div>
                )}
                <h2 className="font-heading text-xl font-bold text-white">{tr.quiz.resultsTitle}</h2>
                <div className="mt-4">
                  <ScoreRing correct={result.correct} total={result.total} />
                </div>
                <div className="mx-auto mt-4 grid max-w-xs grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white/10 px-3 py-2.5">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-white/70">{tr.quiz.bestStreak}</div>
                    <div className="font-heading text-lg font-bold text-white">{result.streak}</div>
                  </div>
                  <div className="rounded-2xl bg-white/10 px-3 py-2.5">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-white/70">{tr.quiz.accuracy}</div>
                    <div className="font-heading text-lg font-bold text-white">{Math.round((result.correct / result.total) * 100)}%</div>
                  </div>
                </div>

                {/* Badges */}
                <div className="mt-6">
                  <div className="text-[11px] font-semibold uppercase tracking-widest text-white/70">{tr.quiz.badgesTitle}</div>
                  <div className="mt-3 flex flex-wrap justify-center gap-2.5">
                    {badgeState(stats).map((badge, i) => {
                      const label = tr.quiz[`badge${badge.key === 'firstRound' ? 'FirstRound' : badge.key === 'perfect' ? 'Perfect' : badge.key === 'streak' ? 'Streak' : 'Dino'}` as keyof typeof tr.quiz] as string;
                      const desc = tr.quiz[`badge${badge.key === 'firstRound' ? 'FirstRound' : badge.key === 'perfect' ? 'Perfect' : badge.key === 'streak' ? 'Streak' : 'Dino'}Desc` as keyof typeof tr.quiz] as string;
                      return (
                        <motion.div
                          key={badge.key}
                          className={`flex w-36 flex-col items-center gap-1 rounded-2xl px-3 py-3 ${badge.earned ? 'bg-white/15' : 'bg-white/5 opacity-55'}`}
                          title={badge.earned ? label : desc}
                          initial={reduceMotion ? false : { scale: 0.6, opacity: 0 }}
                          animate={{ scale: 1, opacity: badge.earned ? 1 : 0.55 }}
                          transition={{ type: 'spring', stiffness: 350, damping: 18, delay: 0.4 + i * 0.08 }}
                        >
                          <BadgeCheck size={22} className={badge.earned ? 'text-white' : 'text-white/50'} aria-hidden />
                          <span className="text-xs font-semibold text-white">{label}</span>
                          <span className="text-[10px] leading-tight text-white/70">{badge.earned ? desc : tr.quiz.lockedBadge}</span>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-7 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
                  <button
                    onClick={start}
                    className="press inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg transition-all duration-200 hover:shadow-xl active:scale-95"
                    style={{ background: 'linear-gradient(135deg, var(--natura-forest), var(--natura-emerald))' }}
                  >
                    <RotateCcw size={14} aria-hidden />
                    {tr.quiz.playAgain}
                  </button>
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 rounded-full bg-white/10 px-6 py-2.5 text-sm font-medium text-white/90 backdrop-blur transition-colors hover:bg-white/20"
                  >
                    <ArrowLeft size={14} aria-hidden />
                    {tr.quiz.backToAtlas}
                  </Link>
                </div>
                <div className="mt-4 text-[11px] text-white/70">
                  {tr.quiz.gamesPlayed}: {stats.gamesPlayed}
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
