import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';
import { WhatsAppButton } from '@/components/layout/WhatsAppButton';
import { getSiteContent } from '@/lib/site-content';

/** Public site chrome: navbar, footer, floating WhatsApp button. */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const { company, hero } = await getSiteContent();
  return (
    <>
      <Navbar ctaLabel={hero.primary_cta} />
      <main id="main">{children}</main>
      <Footer company={company} />
      <WhatsAppButton
        number={company.whatsapp}
        message={`Hi ${company.name}, I'd like to discuss hiring.`}
      />
    </>
  );
}
