'use client';

import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'motion/react';
import { Fragment, useRef, useSyncExternalStore } from 'react';
import { Container } from '@/components/sections/primitives';
import { cn } from '@/lib/utils';

type Props = {
  /** 1-based position, shown as the large outlined number. */
  index: number;
  title: string;
  statement: string;
  headingId: string;
};

const DIM = '#4d4d4d';
const WAVE = '#ff9a1f';
const LIT = '#ffffff';

const noopSubscribe = () => () => {};
/** false during SSR and hydration, true afterwards: the server HTML is the static, fully lit version. */
function useIsClient() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

const numberClass =
  'block font-heading text-[clamp(4.5rem,3rem+6vw,9rem)] leading-none font-bold text-transparent [-webkit-text-stroke:1.5px_var(--primary)] select-none';
const titleClass =
  'mt-4 inline-flex items-center gap-3 font-heading text-sm font-semibold tracking-[0.3em] text-primary uppercase before:h-px before:w-8 before:bg-current before:content-[""] md:text-base';
const statementClass =
  'font-heading text-[clamp(1.6rem,1.05rem+2.4vw,3.25rem)] leading-[1.18] font-semibold text-balance';

/**
 * One vision/mission statement. With JS (and motion allowed) the block is pinned for a while
 * and its words light up grey → orange → white as you scroll; otherwise it renders fully lit.
 */
export function VisionStatement(props: Props) {
  const isClient = useIsClient();
  const reduce = useReducedMotion();
  return isClient && !reduce ? <AnimatedStatement {...props} /> : <StaticStatement {...props} />;
}

function Label({ index, title, headingId }: Omit<Props, 'statement'>) {
  return (
    <>
      <span aria-hidden="true" className={numberClass}>
        {String(index).padStart(2, '0')}
      </span>
      <h2 id={headingId} className={titleClass}>
        {title}
      </h2>
    </>
  );
}

function StaticStatement({ index, title, statement, headingId }: Props) {
  return (
    <article aria-labelledby={headingId} className="py-14 md:py-20">
      <Container className="grid gap-8 min-[820px]:grid-cols-12 min-[820px]:gap-12">
        <div className="min-[820px]:sticky min-[820px]:top-28 min-[820px]:col-span-4 min-[820px]:self-start">
          <Label index={index} title={title} headingId={headingId} />
        </div>
        <p className={cn(statementClass, 'text-foreground min-[820px]:col-span-8')}>{statement}</p>
      </Container>
    </article>
  );
}

function AnimatedStatement({ index, title, statement, headingId }: Props) {
  const ref = useRef<HTMLElement>(null);
  // 0 when the block's top reaches the viewport top (pin starts), 1 when its bottom does (pin ends).
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const words = statement.split(/\s+/).filter(Boolean);
  // Light words over the first 85% of the pin so the full statement rests lit before it scrolls away.
  const span = 0.85 / words.length;
  const rule = useTransform(scrollYProgress, [0, 0.85], [0, 1]);

  return (
    <article ref={ref} aria-labelledby={headingId} className="relative h-[220svh]">
      <div className="sticky top-0 flex h-svh items-center">
        <Container className="grid gap-8 min-[820px]:grid-cols-12 min-[820px]:gap-12">
          <div className="min-[820px]:col-span-4">
            <Label index={index} title={title} headingId={headingId} />
            <span aria-hidden="true" className="mt-8 hidden h-40 w-px bg-border min-[820px]:block">
              <motion.span
                className="block h-full w-full origin-top bg-gradient-to-b from-glow to-deep"
                style={{ scaleY: rule }}
              />
            </span>
          </div>
          <p className={cn(statementClass, 'min-[820px]:col-span-8')}>
            {words.map((word, i) => (
              <Fragment key={i}>
                <Word progress={scrollYProgress} start={i * span} end={(i + 1) * span}>
                  {word}
                </Word>
                {i < words.length - 1 ? ' ' : null}
              </Fragment>
            ))}
          </p>
        </Container>
      </div>
    </article>
  );
}

function Word({
  progress,
  start,
  end,
  children,
}: {
  progress: MotionValue<number>;
  start: number;
  end: number;
  children: string;
}) {
  // The word being "read" turns orange, then settles white a few words later (a trailing wave).
  const settle = Math.min(end + (end - start) * 3, 0.95);
  const color = useTransform(progress, [start, end, settle], [DIM, WAVE, LIT]);
  return <motion.span style={{ color }}>{children}</motion.span>;
}
