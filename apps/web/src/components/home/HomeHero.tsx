import type { SiteContent } from '@digixsquad/api-client';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { homeHeroExtras as extras } from '@/content/home';
import { HeroOrbits } from './HeroOrbits';

/**
 * Hero, final state server-rendered (good LCP). The reveal animation is driven by
 * <html data-intro> + CSS in globals.css; nothing here needs client JS.
 */
export function HomeHero({ content }: { content: SiteContent }) {
  const { hero, company } = content;
  return (
    <section className="ds-hero" aria-labelledby="hero-title">
      <div className="bg-grid pointer-events-none absolute inset-0" aria-hidden="true" />
      <HeroOrbits />

      <h1 id="hero-title" className="ds-word ds-word-left">
        <span aria-hidden="true">{extras.wordLeft}</span>
        <span className="sr-only">
          {company.name}: {hero.headline}
        </span>
        <small className="ds-word-sub" aria-hidden="true">
          {extras.accentLeft}
        </small>
      </h1>

      <div className="ds-center">
        <div className="ds-halo" />
        <div className="ds-frame" />
        <Image
          className="ds-portrait"
          src="/brand/founder.webp"
          alt={extras.founderAlt}
          width={1024}
          height={1536}
          sizes="(max-width: 819px) min(44vh, 400px), min(55vh, 547px)"
          quality={90}
          priority
        />
        <div className="ds-rim" />
      </div>

      <div className="ds-word ds-word-right" aria-hidden="true">
        <span className="ds-word-text">{extras.wordRight}</span>
        <small className="ds-word-sub">{extras.accentRight}</small>
      </div>

      <div className="ds-shade" />

      <div className="ds-cta">
        <p className="text-[clamp(14px,1.2vw,17px)] text-[#e5e5e5] [text-shadow:0_2px_12px_#000]">
          <strong className="font-semibold text-foreground">{hero.headline}</strong>{' '}
          <span className="max-sm:hidden">{hero.subheadline}</span>
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/hire">{hero.primary_cta}</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/roles">{hero.secondary_cta}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
