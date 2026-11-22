import Image from 'next/image';

/**
 * Intro popup overlay. Server-rendered and hidden by default; shown only while
 * <html data-intro> is pending/burst/reveal (see intro-script.ts and globals.css).
 * Click or Esc skips (handled by the inline script, so it works before hydration).
 */
export function IntroSplash({ loadingLabel }: { loadingLabel: string }) {
  return (
    <div className="ds-intro" data-intro-overlay aria-hidden="true">
      <div className="ds-popup">
        <div className="ds-popup-glow" />
        <Image
          className="ds-popup-logo"
          src="/brand/logo.webp"
          alt=""
          width={520}
          height={451}
          priority
        />
        <div className="ds-scan" />
        <div className="ds-boot">
          {loadingLabel}
          <div className="ds-bar">
            <i />
          </div>
        </div>
      </div>
      <div className="ds-flash" />
    </div>
  );
}
