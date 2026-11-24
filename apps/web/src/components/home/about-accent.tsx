'use client';

import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';

/**
 * Decorative orange rule that draws itself from left to right when it scrolls into view,
 * with a soft glow dot travelling along it. Static under prefers-reduced-motion.
 */
export function AboutAccentLine({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  const base = cn('relative block h-px w-full max-w-xs overflow-visible', className);

  if (reduce) {
    return (
      <span aria-hidden="true" className={base}>
        <span className="absolute inset-0 bg-gradient-to-r from-glow via-primary to-transparent" />
      </span>
    );
  }

  return (
    <span aria-hidden="true" className={base}>
      <motion.span
        className="absolute inset-0 origin-left bg-gradient-to-r from-glow via-primary to-transparent"
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, amount: 1 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      />
      <motion.span
        className="absolute top-1/2 left-0 size-1.5 -translate-y-1/2 rounded-full bg-glow shadow-[0_0_12px_3px_rgb(255_154_31/0.7)]"
        initial={{ left: '0%', opacity: 0 }}
        whileInView={{ left: ['0%', '100%'], opacity: [0, 1, 0] }}
        viewport={{ once: true, amount: 1 }}
        transition={{ duration: 1.6, ease: 'easeInOut', delay: 0.2 }}
      />
    </span>
  );
}
