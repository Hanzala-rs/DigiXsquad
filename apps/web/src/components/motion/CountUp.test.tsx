import { render, waitFor } from '@testing-library/react';
import { CountUp, formatCount } from './CountUp';

// motion needs IntersectionObserver + matchMedia, which jsdom lacks. Every observed element
// reports itself as visible right away; `reduce` drives prefers-reduced-motion.
let reduce = false;
const mqListeners = new Set<() => void>();

beforeAll(() => {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(private cb: IntersectionObserverCallback) {}
      observe(target: Element) {
        this.cb(
          [{ target, isIntersecting: true, intersectionRatio: 1 } as IntersectionObserverEntry],
          this as unknown as IntersectionObserver,
        );
      }
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    },
  );
  vi.stubGlobal('matchMedia', (query: string) => ({
    media: query,
    get matches() {
      return query.includes('reduced-motion') && reduce;
    },
    addEventListener: (_: string, fn: () => void) => mqListeners.add(fn),
    removeEventListener: (_: string, fn: () => void) => mqListeners.delete(fn),
    addListener: (fn: () => void) => mqListeners.add(fn),
    removeListener: (fn: () => void) => mqListeners.delete(fn),
    onchange: null,
    dispatchEvent: () => false,
  }));
});
afterAll(() => vi.unstubAllGlobals());

const setReducedMotion = (on: boolean) => {
  reduce = on;
  mqListeners.forEach((fn) => fn());
};

const visible = (container: HTMLElement) =>
  container.querySelector('[aria-hidden="true"]')?.textContent;

describe('formatCount', () => {
  it('rounds and adds thousands separators', () => {
    expect(formatCount(1234.4)).toBe('1,234');
    expect(formatCount(0)).toBe('0');
  });
});

describe('CountUp', () => {
  afterEach(() => setReducedMotion(false));

  it('renders the formatted final value for screen readers and in the markup', () => {
    const { container } = render(<CountUp value={1234} suffix="+" />);
    expect(container.querySelector('.sr-only')).toHaveTextContent('1,234+');
    expect(container).toHaveTextContent('1,234+');
  });

  it('counts up to the final value when scrolled into view', async () => {
    const { container } = render(<CountUp value={250} suffix="+" duration={0.05} />);
    await waitFor(() => expect(visible(container)).toBe('250+'));
    expect(container.querySelector('.sr-only')).toHaveTextContent('250+');
  });

  it('shows the final value straight away under reduced motion', async () => {
    setReducedMotion(true);
    // a long count would still be near 0 after 120ms if it ran
    const { container } = render(<CountUp value={980} duration={5} />);
    expect(visible(container)).toBe('980');
    await new Promise((r) => setTimeout(r, 120));
    expect(visible(container)).toBe('980');
  });

  it('handles a zero placeholder', () => {
    const { container } = render(<CountUp value={0} suffix="+" />);
    expect(visible(container)).toBe('0+');
  });
});
