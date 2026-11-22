import type { Metadata, Viewport } from 'next';
import { Chakra_Petch, Inter } from 'next/font/google';
import { introScript } from '@/components/home/intro-script';
import { OrganizationJsonLd } from '@/components/seo/OrganizationJsonLd';
import { getSiteContent } from '@/lib/site-content';
import { siteUrl } from '@/lib/site-url';
import { Providers } from './providers';
import './globals.css';

// next/font downloads at build time and self-hosts the files (no font CDN at runtime).
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const chakra = Chakra_Petch({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-chakra',
  display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
  const { company, hero } = await getSiteContent();
  return {
    metadataBase: new URL(siteUrl),
    title: { default: `${company.name} | ${company.tagline}`, template: `%s | ${company.name}` },
    description: hero.subheadline,
    openGraph: { siteName: company.name, type: 'website', locale: 'en_US' },
    twitter: { card: 'summary_large_image' },
  };
}

export const viewport: Viewport = { themeColor: '#0a0a0a', colorScheme: 'dark' };

/** Shared by the public site `(site)` and the admin `admin/`; each adds its own chrome. */
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { company } = await getSiteContent();
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${chakra.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Sets html[data-intro] before first paint; see components/home/intro-script.ts */}
        <script dangerouslySetInnerHTML={{ __html: introScript }} />
        <OrganizationJsonLd company={company} />
      </head>
      <body className="min-h-svh">
        <a
          href="#main"
          className="sr-only z-50 bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
        >
          Skip to content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
