'use client';

import { animate, useInView, useReducedMotion } from 'motion/react';
import { useEffect, useRef } from 'react';

export const formatCount = (n: number) => Math.round(n).toLocaleString('en-US');

/**
 * Renders the final number on the server (correct without JS and for crawlers), then counts
 * up from 0 the first time it scrolls into view. Screen readers always get the final value.
 */
export function CountUp({
  value,
  suffix = '',
  duration = 1.8,
  className,
}: {
  value: number;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || !inView || reduce || value === 0) return;
    const controls = animate(0, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        el.textContent = formatCount(v) + suffix;
      },
    });
    return () => controls.stop();
  }, [inView, reduce, value, suffix, duration]);

  return (
    <span className={className}>
      <span ref={ref} aria-hidden="true">
        {formatCount(value) + suffix}
      </span>
      <span className="sr-only">{formatCount(value) + suffix}</span>
    </span>
  );
}
