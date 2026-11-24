import type { SiteContent } from '@digixsquad/api-client';
import { ArrowDown } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { homeAnchors, homeHeroExtras as extras } from '@/content/home';
import { HeroStage } from './HeroStage';
import { ParticlePortrait } from './ParticlePortrait';

/**
 * Hero: chrome "DIGITAL" · founder as an orange particle portrait · "SQUAD".
 * Final state is server-rendered (good LCP): the static cut-out is the base layer and the
 * particle canvas (client) fades in over it. The reveal animation is driven by
 * <html data-intro> + CSS in globals.css; HeroStage adds the scroll-linked exit.
 */
export function HomeHero({ content }: { content: SiteContent }) {
  const { hero, company, founder } = content;
  const alt = founder?.portrait_alt ?? extras.founderAlt;
  return (
    <HeroStage className="ds-hero" aria-labelledby="hero-title">
      <div className="bg-grid pointer-events-none absolute inset-0" aria-hidden="true" />

      <h1 id="hero-title" className="ds-word ds-word-left">
        <span className="ds-word-text" aria-hidden="true">
          {extras.wordLeft}
        </span>
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
        <div className="ds-portrait-base">
          <Image
            className="ds-portrait"
            src="/brand/founder-portrait.webp"
            alt={alt}
            width={613}
            height={1100}
            sizes="(max-width: 819px) min(44vh, 400px), min(55vh, 547px)"
            quality={90}
            priority
          />
        </div>
        <ParticlePortrait src="/brand/founder-portrait-particles.png" />
        <div className="ds-rim" />
      </div>

      <div className="ds-word ds-word-right" aria-hidden="true">
        <span className="ds-word-text">{extras.wordRight}</span>
        <small className="ds-word-sub">{extras.accentRight}</small>
      </div>

      <div className="ds-shade" />

      <div className="ds-cta">
        {founder && (
          <p className="ds-founder">
            <span className="ds-founder-dot" aria-hidden="true" />
            <span>{founder.name}</span>
            <span aria-hidden="true">·</span>
            <span>{founder.title}</span>
          </p>
        )}
        <p className="text-[clamp(14px,1.2vw,17px)] text-[#e5e5e5] [text-shadow:0_2px_12px_#000]">
          <strong className="font-semibold text-foreground">{hero.headline}</strong>{' '}
          <span className="max-sm:hidden">{hero.subheadline}</span>
        </p>
        <div className="ds-cta-actions">
          <Button
            asChild
            className="hover:[&_svg:last-child]:translate-x-0 hover:[&_svg:last-child]:translate-y-0.5"
          >
            <a href={`#${homeAnchors.about}`}>
              {extras.enter}
              <ArrowDown aria-hidden="true" />
            </a>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/hire">{hero.primary_cta}</Link>
          </Button>
        </div>
      </div>
    </HeroStage>
  );
}
