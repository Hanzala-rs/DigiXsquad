'use client';

import { motion, useReducedMotion, type Variants } from 'motion/react';
import type { ReactNode } from 'react';

type From = 'up' | 'down' | 'left' | 'right' | 'none';

const offset = (from: From, distance: number) => {
  switch (from) {
    case 'up':
      return { y: distance };
    case 'down':
      return { y: -distance };
    case 'left':
      return { x: -distance };
    case 'right':
      return { x: distance };
    default:
      return {};
  }
};

const ease = [0.16, 1, 0.3, 1] as const; // --ease-out

/**
 * Fades + slides its children in the first time they scroll into view.
 * Under prefers-reduced-motion it renders a plain element (content visible, no motion).
 */
export function Reveal({
  children,
  from = 'up',
  distance = 32,
  delay = 0,
  duration = 0.8,
  amount = 0.25,
  className,
  as = 'div',
}: {
  children: ReactNode;
  from?: From;
  distance?: number;
  delay?: number;
  duration?: number;
  /** Share of the element that must be visible before it animates (0–1). */
  amount?: number;
  className?: string;
  as?: 'div' | 'li' | 'section' | 'article' | 'header';
}) {
  const reduce = useReducedMotion();
  const Tag = as;
  if (reduce) return <Tag className={className}>{children}</Tag>;
  const M = motion[as];
  return (
    <M
      data-reveal=""
      className={className}
      initial={{ opacity: 0, ...offset(from, distance) }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, amount }}
      transition={{ duration, delay, ease }}
    >
      {children}
    </M>
  );
}

const groupVariants = (stagger: number, delay: number): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren: delay } },
});

/** Parent for staggered children: wrap each child in <RevealItem>. */
export function RevealGroup({
  children,
  stagger = 0.1,
  delay = 0,
  amount = 0.2,
  className,
  as = 'div',
}: {
  children: ReactNode;
  stagger?: number;
  delay?: number;
  amount?: number;
  className?: string;
  as?: 'div' | 'ul' | 'ol' | 'dl';
}) {
  const reduce = useReducedMotion();
  const Tag = as;
  if (reduce) return <Tag className={className}>{children}</Tag>;
  const M = motion[as];
  return (
    <M
      data-reveal=""
      className={className}
      variants={groupVariants(stagger, delay)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount }}
    >
      {children}
    </M>
  );
}

export function RevealItem({
  children,
  from = 'up',
  distance = 28,
  className,
  as = 'div',
}: {
  children: ReactNode;
  from?: From;
  distance?: number;
  className?: string;
  as?: 'div' | 'li' | 'article';
}) {
  const reduce = useReducedMotion();
  const Tag = as;
  if (reduce) return <Tag className={className}>{children}</Tag>;
  const M = motion[as];
  return (
    <M
      data-reveal=""
      className={className}
      variants={{
        hidden: { opacity: 0, ...offset(from, distance) },
        show: { opacity: 1, x: 0, y: 0, transition: { duration: 0.7, ease } },
      }}
    >
      {children}
    </M>
  );
}
