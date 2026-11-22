import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ImageResponse } from 'next/og';
import { getSiteContent } from '@/lib/site-content';

export const alt = 'DigixSquad';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** Default social card for every page (logo + tagline on the brand background). */
export default async function OpengraphImage() {
  const [{ company, hero }, logo] = await Promise.all([
    getSiteContent(),
    readFile(path.join(process.cwd(), 'src/app/icon.png')),
  ]);
  const logoSrc = `data:image/png;base64,${logo.toString('base64')}`;

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 56,
        padding: 80,
        background: 'radial-gradient(circle at 78% 40%, rgba(255,106,0,0.35), #0a0a0a 60%)',
        color: '#fff',
        fontFamily: 'sans-serif',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logoSrc} width={220} height={220} alt="" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 760 }}>
        <div style={{ display: 'flex', fontSize: 76, fontWeight: 700, letterSpacing: 2 }}>
          Digix<span style={{ color: '#ff6a00' }}>Squad</span>
        </div>
        <div style={{ fontSize: 40, lineHeight: 1.25 }}>{hero.headline}</div>
        <div style={{ fontSize: 26, color: '#a3a3a3' }}>{company.tagline}</div>
      </div>
    </div>,
    size,
  );
}
