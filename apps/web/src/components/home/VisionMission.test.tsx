import { render, screen } from '@testing-library/react';
import { homeSections } from '@/content/home';
import { siteContentFallback as seed } from '@/lib/site-content';
import { VisionMission } from './VisionMission';

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

/** Statements are split into one span per word, so match on the paragraph's full text. */
const paragraphWithText = (text: string) =>
  screen.getByText((_, el) => el?.tagName === 'P' && el.textContent === text);

describe('VisionMission', () => {
  it('renders the vision and mission statements as readable paragraphs', () => {
    const { container } = render(<VisionMission content={seed} />);
    expect(container.querySelector('section#vision')).not.toBeNull();
    expect(screen.getByText(homeSections.vision.eyebrow)).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: homeSections.vision.visionTitle }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: homeSections.vision.missionTitle }),
    ).toBeInTheDocument();

    const vision = paragraphWithText(seed.about.vision);
    const mission = paragraphWithText(seed.about.mission);
    // vision comes first
    expect(vision.compareDocumentPosition(mission) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // one span per word once the scroll effect is active
    expect(vision.querySelectorAll('span')).toHaveLength(seed.about.vision.split(/\s+/).length);
  });

  it('skips an empty statement', () => {
    render(<VisionMission content={{ ...seed, about: { ...seed.about, mission: '' } }} />);
    expect(screen.queryByRole('heading', { name: homeSections.vision.missionTitle })).toBeNull();
    expect(paragraphWithText(seed.about.vision)).toBeInTheDocument();
  });
});
