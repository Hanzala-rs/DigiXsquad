import { AboutSection } from '@/components/home/AboutSection';
import { HomeHero } from '@/components/home/HomeHero';
import { IntroSplash } from '@/components/home/IntroSplash';
import { ProjectsSection } from '@/components/home/ProjectsSection';
import { SquadsSection } from '@/components/home/SquadsSection';
import { SwirlBackground } from '@/components/home/SwirlBackground';
import { TeamSection } from '@/components/home/TeamSection';
import { VisionMission } from '@/components/home/VisionMission';
import { ScrollProgress } from '@/components/motion/ScrollProgress';
import { homeHeroExtras } from '@/content/home';
import { getSquads } from '@/lib/catalog';
import { getSiteContent } from '@/lib/site-content';

/**
 * One scrolling story (client sketch, Nov 2026):
 * Hero → What we do → Team → Squads → Vision/Mission → Projects → Footer (#contact).
 * Anchor ids live in content/home.ts (`homeAnchors`) so the navbar can link to them.
 */
export default async function HomePage() {
  const [content, squads] = await Promise.all([getSiteContent(), getSquads()]);
  return (
    <>
      <SwirlBackground />
      <ScrollProgress />
      <IntroSplash loadingLabel={homeHeroExtras.introLoading} />
      <HomeHero content={content} />
      <AboutSection content={content} />
      <TeamSection content={content} />
      <SquadsSection squads={squads} content={content} />
      <VisionMission content={content} />
      <ProjectsSection content={content} />
    </>
  );
}
