import { introScript, runIntro } from './intro-script';

const state = () => document.documentElement.getAttribute('data-intro');

function setup({ path = '/', reduced = false }: { path?: string; reduced?: boolean } = {}) {
  window.history.replaceState(null, '', path);
  window.matchMedia = vi.fn().mockReturnValue({ matches: reduced }) as never;
}

beforeEach(() => {
  vi.useFakeTimers();
  sessionStorage.clear();
  document.documentElement.removeAttribute('data-intro');
  document.body.innerHTML = '<div data-intro-overlay><span id="inside"></span></div>';
});
afterEach(() => vi.useRealTimers());

describe('runIntro', () => {
  it('follows the prototype timeline: pending → burst 1.9s → reveal 2.1s → settled +2.2s', () => {
    setup();
    runIntro(window);
    expect(state()).toBe('pending');
    vi.advanceTimersByTime(1899);
    expect(state()).toBe('pending');
    vi.advanceTimersByTime(1);
    expect(state()).toBe('burst');
    vi.advanceTimersByTime(200);
    expect(state()).toBe('reveal');
    vi.advanceTimersByTime(2200);
    expect(state()).toBe('settled');
  });

  it('plays once per session', () => {
    setup();
    runIntro(window);
    expect(sessionStorage.getItem('ds_intro_seen')).toBe('1');
    document.documentElement.removeAttribute('data-intro');
    runIntro(window);
    expect(state()).toBeNull();
  });

  it('does nothing with prefers-reduced-motion or off the home page', () => {
    setup({ reduced: true });
    runIntro(window);
    expect(state()).toBeNull();

    setup({ path: '/about' });
    runIntro(window);
    expect(state()).toBeNull();
  });

  it('Esc skips straight to reveal, then settles', () => {
    setup();
    runIntro(window);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(state()).toBe('reveal');
    vi.advanceTimersByTime(5000);
    expect(state()).toBe('settled');
  });

  it('clicking the overlay skips; clicks elsewhere do not', () => {
    setup();
    runIntro(window);
    document.body.click();
    expect(state()).toBe('pending');
    document.getElementById('inside')!.click();
    expect(state()).toBe('reveal');
  });

  it('still plays when sessionStorage throws', () => {
    setup();
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    runIntro(window);
    expect(state()).toBe('pending');
    vi.restoreAllMocks();
  });

  it('serializes to a self-contained inline script', () => {
    setup();
    new Function(introScript)();
    expect(state()).toBe('pending');
  });
});
