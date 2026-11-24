'use client';

import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react';
import { useEffect, useRef, useState, type ReactNode } from 'react';

/** Desktop only: below this the cards are a swipeable line instead of a pinned runway. */
const RUNWAY_MIN_WIDTH = '(min-width: 1024px)';
/**
 * The line runs edge to edge, but its first card lines up with the page content: same side
 * padding as <Container> (max-w-7xl = 80rem, px-4 / sm:px-6 / lg:px-12).
 */
const GUTTER = 'px-4 sm:px-6 lg:px-[max(3rem,calc((100vw-80rem)/2+3rem))]';
const GUTTER_SCROLL = 'scroll-px-4 sm:scroll-px-6 lg:scroll-px-12';

/**
 * Squad cards on one line, like a runway. On desktop the section pins while you scroll down
 * and the line slides left, with an orange progress track underneath.
 *
 * Server HTML / phones / reduced motion: a plain horizontal scroll-snap line, so the cards
 * stay reachable without JS and nothing moves for people who asked for less motion.
 */
export function SquadsRunway({
  header,
  children,
  label,
}: {
  header: ReactNode;
  children: ReactNode;
  /** Accessible name of the card list. */
  label: string;
}) {
  const outerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLUListElement>(null);
  const reduce = useReducedMotion();
  // How far the line has to slide; 0 = not pinned (phone, reduced motion, or it already fits).
  const [distance, setDistance] = useState(0);

  useEffect(() => {
    const track = trackRef.current;
    const viewport = viewportRef.current;
    if (!track || !viewport) return;
    const mq = window.matchMedia(RUNWAY_MIN_WIDTH);
    const measure = () => {
      if (reduce || !mq.matches) return setDistance(0);
      setDistance(Math.max(0, Math.round(track.scrollWidth - viewport.clientWidth)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(track);
    ro.observe(viewport);
    mq.addEventListener('change', measure);
    return () => {
      ro.disconnect();
      mq.removeEventListener('change', measure);
    };
  }, [reduce]);

  const { scrollYProgress } = useScroll({ target: outerRef, offset: ['start start', 'end end'] });
  const smooth = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 });
  const x = useTransform(smooth, [0, 1], [0, -distance]);
  const pinned = distance > 0;

  return (
    <div
      ref={outerRef}
      // Extra height = how far the line slides, so one px of scroll moves the cards one px.
      style={pinned ? { height: `calc(100svh + ${distance}px)` } : undefined}
    >
      <div
        className={
          pinned
            ? 'sticky top-0 flex h-svh flex-col justify-center overflow-hidden pt-16'
            : undefined
        }
      >
        {header}
        <div
          ref={viewportRef}
          className={
            pinned
              ? 'w-full'
              : `snap-x snap-mandatory overflow-x-auto pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${GUTTER_SCROLL}`
          }
        >
          <motion.ul
            ref={trackRef}
            aria-label={label}
            style={pinned ? { x } : undefined}
            className={`flex w-max gap-5 py-2 ${GUTTER}`}
          >
            {children}
          </motion.ul>
        </div>

        {pinned && (
          <div aria-hidden="true" className="mt-8 h-px w-full bg-border">
            <motion.div
              className="h-px origin-left bg-gradient-to-r from-deep via-primary to-glow shadow-[0_0_10px_rgb(255_106_0/0.7)]"
              style={{ scaleX: smooth }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
