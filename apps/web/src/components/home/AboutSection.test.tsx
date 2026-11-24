import type { SiteContent } from '@digixsquad/api-client';
import { render, screen, within } from '@testing-library/react';
import { homeSections } from '@/content/home';
import { siteContentFallback as seed } from '@/lib/site-content';
import { AboutSection } from './AboutSection';

// jsdom has no IntersectionObserver / ResizeObserver, which motion's in-view and scroll hooks use.
class NoopObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
beforeAll(() => {
  vi.stubGlobal('IntersectionObserver', NoopObserver);
  vi.stubGlobal('ResizeObserver', NoopObserver);
});
afterAll(() => {
  vi.unstubAllGlobals();
});

describe('AboutSection', () => {
  it('renders the story and the what-we-do cards from site content', () => {
    const { container } = render(<AboutSection content={seed} />);
    expect(container.querySelector('section#about')).not.toBeNull();
    expect(
      screen.getByRole('heading', { level: 2, name: homeSections.about.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(homeSections.about.eyebrow)).toBeInTheDocument();
    expect(screen.getByText(seed.about.story)).toBeInTheDocument();

    const items = within(screen.getByRole('list')).getAllByRole('listitem');
    expect(items).toHaveLength(seed.what_we_do!.length);
    for (const item of seed.what_we_do!) {
      expect(screen.getByRole('heading', { level: 3, name: item.title })).toBeInTheDocument();
      expect(screen.getByText(item.description)).toBeInTheDocument();
    }
  });

  it('falls back to why_us cards when what_we_do is empty', () => {
    const content: SiteContent = { ...seed, what_we_do: [] };
    render(<AboutSection content={content} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(seed.why_us.length);
    expect(
      screen.getByRole('heading', { level: 3, name: seed.why_us[0]!.title }),
    ).toBeInTheDocument();
  });
});
