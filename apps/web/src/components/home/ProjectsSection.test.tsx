import { render, screen } from '@testing-library/react';
import { homeAnchors, homeSections } from '@/content/home';
import { siteContent } from '@/lib/seed-data';
import { ProjectsSection } from './ProjectsSection';

// motion needs IntersectionObserver + matchMedia, which jsdom lacks.
beforeAll(() => {
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

const projects = [
  { label: 'Projects delivered', value: 1250, suffix: '+' },
  { label: 'In progress', value: 7 },
  { label: 'Open requests', value: 0 },
];

describe('ProjectsSection', () => {
  it('renders the heading, every counter label and its final value', () => {
    const { container } = render(<ProjectsSection content={{ ...siteContent, projects }} />);
    expect(container.querySelector(`section#${homeAnchors.projects}`)).not.toBeNull();
    expect(
      screen.getByRole('heading', { level: 2, name: homeSections.projects.title }),
    ).toBeInTheDocument();

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(projects.length);
    projects.forEach((p, i) => {
      expect(items[i]).toHaveTextContent(p.label);
      // final value is in the markup (sr-only copy is always the finished number)
      expect(items[i]!.querySelector('.sr-only')).toHaveTextContent(
        `${p.value.toLocaleString('en-US')}${p.suffix ?? ''}`,
      );
    });
  });

  it('renders the seeded zero placeholders', () => {
    render(<ProjectsSection content={siteContent} />);
    const seeded = siteContent.projects ?? [];
    expect(screen.getAllByRole('listitem')).toHaveLength(seeded.length);
    for (const p of seeded) expect(screen.getByText(p.label)).toBeInTheDocument();
  });

  it('links to the hire form and the tracker', () => {
    render(<ProjectsSection content={{ ...siteContent, projects }} />);
    expect(screen.getByRole('link', { name: homeSections.projects.cta })).toHaveAttribute(
      'href',
      '/hire',
    );
    expect(screen.getByRole('link', { name: homeSections.projects.track })).toHaveAttribute(
      'href',
      '/track',
    );
  });

  it('renders nothing without counters', () => {
    const { container: empty } = render(
      <ProjectsSection content={{ ...siteContent, projects: [] }} />,
    );
    expect(empty).toBeEmptyDOMElement();
    const { container: missing } = render(
      <ProjectsSection content={{ ...siteContent, projects: undefined }} />,
    );
    expect(missing).toBeEmptyDOMElement();
  });
});
