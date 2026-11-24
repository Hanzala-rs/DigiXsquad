'use client';

import { motion, useReducedMotion, useScroll, useSpring } from 'motion/react';

/** Thin orange bar at the very top that fills as the page scrolls. Hidden for reduced motion. */
export function ScrollProgress() {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 28, mass: 0.3 });
  if (reduce) return null;
  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5 origin-left bg-gradient-to-r from-deep via-primary to-glow shadow-[0_0_12px_rgb(255_106_0/0.7)]"
      style={{ scaleX }}
    />
  );
}
