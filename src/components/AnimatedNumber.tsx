"use client"
import React from 'react';

import { useEffect, useRef } from "react";
import { animate, useReducedMotion } from "motion/react";
import { EASE_OUT_EXPO } from "../lib/motion";

interface AnimatedNumberProps {
  value: number;
  className?: string;
}

/**
 * Odometer-style count-up for small counters (species totals, scores).
 * Spring-free tween with tabular-nums so digits don't jitter; jumps
 * instantly when reduced motion is requested.
 */
export default function AnimatedNumber({ value, className = "" }: AnimatedNumberProps): React.JSX.Element {
  const ref = useRef<HTMLSpanElement>(null);
  const previous = useRef(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (reduceMotion || previous.current === value) {
      node.textContent = String(value);
      previous.current = value;
      return;
    }

    const controls = animate(previous.current, value, {
      duration: 0.45,
      ease: EASE_OUT_EXPO,
      onUpdate(latest) {
        if (node) node.textContent = String(Math.round(latest));
      },
      onComplete() {
        previous.current = value;
      },
    });
    return () => controls.stop();
  }, [value, reduceMotion]);

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {value}
    </span>
  );
}
