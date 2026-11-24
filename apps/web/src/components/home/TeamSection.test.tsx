import type { SiteContent } from '@digixsquad/api-client';
import { render, screen, within } from '@testing-library/react';
import { homeSections } from '@/content/home';
import { siteContentFallback as seed } from '@/lib/site-content';
import { TeamSection } from './TeamSection';
import { teamInitials } from './team-portrait';

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

describe('TeamSection', () => {
  it('renders one list item per member with name, title, bio and photo alt', () => {
    const team = seed.team!;
    const { container } = render(<TeamSection content={seed} />);
    expect(container.querySelector('section#team')).not.toBeNull();
    expect(
      screen.getByRole('heading', { level: 2, name: homeSections.team.title }),
    ).toBeInTheDocument();

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(team.length);
    team.forEach((member, i) => {
      const item = within(items[i]!);
      expect(item.getByRole('heading', { level: 3, name: member.name })).toBeInTheDocument();
      expect(item.getByText(member.title)).toBeInTheDocument();
      if (member.bio) expect(item.getByText(member.bio)).toBeInTheDocument();
      expect(
        item.getByRole('img', { name: `${member.name}, ${member.title}` }),
      ).toBeInTheDocument();
    });
  });

  it('renders a placeholder with initials when a member has no photo', () => {
    const content: SiteContent = {
      ...seed,
      team: [{ name: 'Ayesha Khan', title: 'Director', bio: 'Runs delivery.' }],
    };
    render(<TeamSection content={content} />);
    const placeholder = screen.getByRole('img', { name: 'Ayesha Khan, Director' });
    expect(placeholder.tagName).not.toBe('IMG');
    expect(within(placeholder).getByText('AK')).toBeInTheDocument();
  });

  it('is hidden when there are no team members', () => {
    const { container } = render(<TeamSection content={{ ...seed, team: [] }} />);
    expect(container).toBeEmptyDOMElement();
    const { container: missing } = render(<TeamSection content={{ ...seed, team: undefined }} />);
    expect(missing).toBeEmptyDOMElement();
  });

  it('builds initials from the first two words', () => {
    expect(teamInitials('  director   name extra ')).toBe('DN');
    expect(teamInitials('Cher')).toBe('C');
  });
});
