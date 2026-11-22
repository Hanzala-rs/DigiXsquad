import { HomeHero } from '@/components/home/HomeHero';
import { IntroSplash } from '@/components/home/IntroSplash';
import { homeHeroExtras } from '@/content/home';
import { getSiteContent } from '@/lib/site-content';

export default async function HomePage() {
  const content = await getSiteContent();
  return (
    <>
      <IntroSplash loadingLabel={homeHeroExtras.introLoading} />
      <HomeHero content={content} />
      {/* Phase 2: how it works, squads preview, Govt vs Private, why us, stats, FAQs, CTA */}
    </>
  );
}
