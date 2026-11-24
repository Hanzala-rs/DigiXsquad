'use client';

import type { SiteContentProjectsItem } from '@digixsquad/api-client';
import { motion, useReducedMotion, type Variants } from 'motion/react';
import { CountUp } from '@/components/motion/CountUp';

const ease = [0.16, 1, 0.3, 1] as const;
const pop = [0.34, 1.56, 0.64, 1] as const; // slight overshoot

const LINE = 0.9; // seconds for the connector to draw
const STAGGER = 0.18;

const lineX: Variants = {
  hidden: { scaleX: 0 },
  show: { scaleX: 1, transition: { duration: LINE, ease } },
};
const lineY: Variants = {
  hidden: { scaleY: 0 },
  show: { scaleY: 1, transition: { duration: LINE, ease } },
};
const badge: Variants = {
  hidden: { opacity: 0, scale: 0.55 },
  show: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: pop, delay: LINE * 0.6 + i * STAGGER },
  }),
};
const stem: Variants = {
  hidden: { scaleY: 0, scaleX: 0 },
  show: (i: number) => ({
    scaleY: 1,
    scaleX: 1,
    transition: { duration: 0.4, ease, delay: LINE * 0.6 + i * STAGGER + 0.35 },
  }),
};
const label: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease, delay: LINE * 0.6 + i * STAGGER + 0.5 },
  }),
};

const HEX = 'polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)';

/**
 * Counter badges on a thin orange line (client sketch: circles on a line, stems + labels
 * underneath). Desktop: horizontal row. Mobile: vertical stack, labels to the right.
 * On scroll the line draws in, badges pop in one by one, numbers count up.
 * Final values are always in the markup; reduced motion renders the finished state.
 */
export function ProjectsCounters({ items }: { items: SiteContentProjectsItem[] }) {
  const reduce = useReducedMotion();
  // Reduced motion: plain elements in their final state (no variants, no initial).
  // `data-reveal` lets the root layout's <noscript> rule show these without JS.
  const anim = (variants: Variants) => (reduce ? {} : { variants, 'data-reveal': '' });

  return (
    <motion.div
      className="relative mx-auto max-w-5xl [--b:7.5rem] [--g:2.5rem] md:[--b:11rem] md:[--g:1.5rem]"
      {...(reduce
        ? {}
        : { initial: 'hidden', whileInView: 'show', viewport: { once: true, amount: 0.35 } })}
    >
      {/* connector: vertical on mobile, horizontal from first to last badge center on md+ */}
      <motion.div
        aria-hidden="true"
        className="absolute top-[calc(var(--b)/2)] bottom-[calc(var(--b)/2)] left-[calc(var(--b)/2)] w-px origin-top bg-[linear-gradient(180deg,var(--glow),var(--primary)_50%,var(--deep))] shadow-[0_0_10px_rgb(255_106_0/0.6)] md:hidden"
        {...anim(lineY)}
      />
      <motion.div
        aria-hidden="true"
        className="absolute top-[calc(var(--b)/2)] right-[calc((100%-2*var(--g))/6)] left-[calc((100%-2*var(--g))/6)] hidden h-px origin-left bg-[linear-gradient(90deg,var(--deep),var(--primary)_30%,var(--glow)_50%,var(--primary)_70%,var(--deep))] shadow-[0_0_10px_rgb(255_106_0/0.6)] md:block"
        {...anim(lineX)}
      />

      <ol className="relative grid gap-[var(--g)] md:grid-cols-3">
        {items.map((item, i) => (
          <li
            key={`${i}-${item.label}`}
            className="group flex items-center gap-4 md:flex-col md:gap-0 md:text-center"
          >
            <motion.div
              className="relative grid size-[var(--b)] shrink-0 place-items-center"
              custom={i}
              {...anim(badge)}
            >
              {/* ring: opaque so the line stops at its edge */}
              <span
                aria-hidden="true"
                className="absolute inset-0 rounded-full bg-background shadow-[inset_0_0_0_1px_rgb(255_106_0/0.35),0_0_0_6px_var(--background)] transition-shadow duration-300 group-hover:shadow-[inset_0_0_0_1px_var(--glow),inset_0_0_28px_rgb(255_106_0/0.25),0_0_0_6px_var(--background)]"
              />
              <span
                aria-hidden="true"
                className="absolute inset-[5%] animate-[ds-spin_40s_linear_infinite] rounded-full border border-dashed border-primary/30"
              />
              {/* hexagon (echoes the hero frame) with a gradient 1.5px edge */}
              <span
                aria-hidden="true"
                className="absolute top-[13%] bottom-[13%] left-1/2 aspect-[0.866] -translate-x-1/2 bg-[linear-gradient(160deg,var(--glow),var(--deep)_55%,rgb(232_68_15/0.25))] transition-[filter] duration-300 group-hover:brightness-125"
                style={{ clipPath: HEX }}
              >
                <span
                  className="absolute inset-[1.5px] bg-[radial-gradient(ellipse_at_50%_30%,#2a1606,var(--card)_70%)]"
                  style={{ clipPath: HEX }}
                />
              </span>
              <CountUp
                value={item.value}
                suffix={item.suffix ?? ''}
                className="text-brand-gradient relative font-heading text-3xl leading-none font-bold tabular-nums md:text-[2.75rem]"
              />
            </motion.div>

            {/* stem: horizontal tick on mobile, vertical drop on md+ */}
            <motion.span
              aria-hidden="true"
              className="h-px w-6 shrink-0 origin-left bg-primary/60 md:h-8 md:w-px md:origin-top"
              custom={i}
              {...anim(stem)}
            />

            <motion.p
              className="font-heading text-sm font-semibold tracking-[0.2em] text-foreground uppercase md:mt-3 md:max-w-[14rem]"
              custom={i}
              {...anim(label)}
            >
              {item.label}
            </motion.p>
          </li>
        ))}
      </ol>
    </motion.div>
  );
}
