import { render, screen, within } from '@testing-library/react';
import { homeAnchors, homeSections } from '@/content/home';
import { siteContent, squads } from '@/lib/seed-data';
import { SquadsSection } from './SquadsSection';

// motion needs IntersectionObserver + matchMedia, the runway needs ResizeObserver; jsdom lacks them.
beforeAll(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    },
  );
  vi.stubGlobal('matchMedia', (query: string) => ({
    media: query,
    matches: false,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    onchange: null,
    dispatchEvent: () => false,
  }));
});
afterAll(() => vi.unstubAllGlobals());

describe('SquadsSection', () => {
  it('renders the heading from home copy under the squads anchor', () => {
    const { container } = render(<SquadsSection squads={squads} content={siteContent} />);
    const section = container.querySelector(`section#${homeAnchors.squads}`);
    expect(section).not.toBeNull();
    expect(
      screen.getByRole('heading', { level: 2, name: homeSections.squads.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(homeSections.squads.description)).toBeInTheDocument();
  });

  it('renders every squad with a link to its page', () => {
    render(<SquadsSection squads={squads} />);
    expect(squads.length).toBeGreaterThan(0);
    for (const squad of squads) {
      const card = screen.getByRole('heading', { level: 3, name: squad.name }).closest('article');
      expect(card).not.toBeNull();
      const link = within(card as HTMLElement).getByRole('link', {
        name: new RegExp(`${homeSections.squads.viewSquad}.*${squad.name}`),
      });
      expect(link).toHaveAttribute('href', `/squads/${squad.slug}`);
      expect(within(card as HTMLElement).getByText(squad.tagline)).toBeInTheDocument();
    }
  });

  it('shows at most three role chips and a count of the rest', () => {
    const squad = squads.find((s) => s.roles.length > 3) ?? squads[0]!;
    render(<SquadsSection squads={[squad]} />);
    const chips = within(screen.getByRole('list', { name: /roles/i })).getAllByRole('listitem');
    const shown = Math.min(3, squad.roles.length);
    const more = squad.roles.length - shown;
    expect(chips).toHaveLength(shown + (more > 0 ? 1 : 0));
    expect(chips[0]).toHaveTextContent(squad.roles[0]!.role.title);
    if (more > 0) expect(chips.at(-1)).toHaveTextContent(`+${more}`);
  });

  it('links to all squads', () => {
    render(<SquadsSection squads={squads} />);
    expect(screen.getByRole('link', { name: homeSections.squads.allSquads })).toHaveAttribute(
      'href',
      '/squads',
    );
  });

  it('closes the grid with a custom-squad card that links to the hire form', () => {
    const { custom } = homeSections.squads;
    render(<SquadsSection squads={squads} />);
    expect(screen.getAllByRole('listitem', { name: undefined }).length).toBeGreaterThan(
      squads.length,
    );
    const card = screen.getByRole('heading', { level: 3, name: custom.title }).closest('article');
    expect(card).not.toBeNull();
    expect(within(card as HTMLElement).getByRole('link', { name: custom.cta })).toHaveAttribute(
      'href',
      custom.href,
    );
  });
});
