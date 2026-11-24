'use client';

import { useMotionValueEvent, useReducedMotion, useScroll, type MotionValue } from 'motion/react';
import { createContext, useEffect, useRef, type ComponentProps } from 'react';

/** Hero scroll-exit progress (0 at the top, 1 once the hero has scrolled away). */
export const HeroExitContext = createContext<MotionValue<number> | null>(null);

/**
 * The hero <section>. Its children stay server-rendered; this only tracks how far the hero has
 * scrolled away and writes it to `--hero-exit` (CSS in globals.css drifts the words apart, lifts
 * the portrait, fades the CTA) and shares it with the particle sim (scatter) via context.
 * Under prefers-reduced-motion nothing moves.
 */
export function HeroStage({ children, ...props }: ComponentProps<'section'>) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });

  const write = (v: number) => ref.current?.style.setProperty('--hero-exit', v.toFixed(4));

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    if (!reduce) write(v);
  });

  useEffect(() => {
    if (reduce) ref.current?.style.removeProperty('--hero-exit');
    else write(scrollYProgress.get());
  }, [reduce, scrollYProgress]);

  return (
    <HeroExitContext.Provider value={reduce ? null : scrollYProgress}>
      <section ref={ref} {...props}>
        {children}
      </section>
    </HeroExitContext.Provider>
  );
}
