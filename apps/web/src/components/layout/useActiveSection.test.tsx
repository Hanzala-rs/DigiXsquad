import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { nav } from '../../../test/nav-mock';
import { Navbar } from './Navbar';

vi.mock('next/navigation', async () => (await import('../../../test/nav-mock')).navigationMock());

/** Minimal IntersectionObserver double: tests decide which targets intersect. */
class FakeIO {
  static instances: FakeIO[] = [];
  targets: Element[] = [];
  constructor(private cb: IntersectionObserverCallback) {
    FakeIO.instances.push(this);
  }
  observe(el: Element) {
    this.targets.push(el);
  }
  disconnect() {
    this.targets = [];
  }
  unobserve() {}
  takeRecords() {
    return [];
  }
  fire(id: string, isIntersecting: boolean) {
    const target = this.targets.find((t) => t.id === id)!;
    this.cb(
      [{ target, isIntersecting } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
}

beforeEach(() => {
  FakeIO.instances = [];
  vi.stubGlobal('IntersectionObserver', FakeIO);
});
afterEach(() => vi.unstubAllGlobals());

const page = () => (
  <>
    <Navbar ctaLabel="Hire a Squad" />
    {['about', 'squads', 'projects', 'contact'].map((id) => (
      <section key={id} id={id} />
    ))}
  </>
);

describe('Navbar on the home page', () => {
  beforeEach(() => {
    nav.pathname = '/';
  });

  it('uses same-page anchors and highlights the section in view', () => {
    render(page());
    const main = screen.getByRole('navigation', { name: 'Main' });
    const squads = within(main).getByRole('link', { name: 'Squads' });
    expect(squads).toHaveAttribute('href', '#squads');
    expect(squads).not.toHaveAttribute('aria-current');

    const io = FakeIO.instances.at(-1)!;
    act(() => io.fire('squads', true));
    expect(squads).toHaveAttribute('aria-current', 'location');

    act(() => {
      io.fire('squads', false);
      io.fire('projects', true);
    });
    expect(squads).not.toHaveAttribute('aria-current');
    expect(within(main).getByRole('link', { name: 'Projects' })).toHaveAttribute(
      'aria-current',
      'location',
    );
  });

  it('is transparent at the top and solid after scrolling', () => {
    render(page());
    const header = screen.getByRole('banner');
    expect(header).toHaveClass('ds-intro-nav', 'bg-transparent');
    act(() => {
      Object.defineProperty(window, 'scrollY', { value: 120, configurable: true });
      fireEvent.scroll(window);
    });
    expect(header).toHaveClass('backdrop-blur-md');
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });
  });

  it('mobile menu lists anchors and pages, and closes on link click', () => {
    render(page());
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    const menu = screen.getByRole('list', { name: 'On this page' });
    expect(within(menu).getByRole('link', { name: 'Contact' })).toHaveAttribute('href', '#contact');
    expect(screen.getByRole('list', { name: 'Pages' })).toBeInTheDocument();
    fireEvent.click(within(menu).getByRole('link', { name: 'About us' }));
    expect(screen.queryByRole('list', { name: 'On this page' })).not.toBeInTheDocument();
  });
});

describe('Navbar on other pages', () => {
  it('links back to home anchors and marks the matching page', () => {
    nav.pathname = '/squads/development-squad';
    render(<Navbar ctaLabel="Hire a Squad" />);
    const main = screen.getByRole('navigation', { name: 'Main' });
    const squads = within(main).getByRole('link', { name: 'Squads' });
    expect(squads).toHaveAttribute('href', '/#squads');
    expect(squads).toHaveAttribute('aria-current', 'page');
    expect(within(main).getByRole('link', { name: 'About us' })).toHaveAttribute('href', '/#about');
  });
});
