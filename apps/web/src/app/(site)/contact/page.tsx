import type { Metadata } from 'next';
import { Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import Link from 'next/link';
import { ContactForm } from '@/components/forms/ContactForm';
import { Card, Container, PageHeader } from '@/components/sections/primitives';
import { pageIntros } from '@/content/pages';
import { getSiteContent } from '@/lib/site-content';
import { isRealPhone, isSet, telHref } from '@/lib/placeholders';
import { whatsappLink } from '@/lib/whatsapp';

const intro = pageIntros.contact;

export const metadata: Metadata = {
  title: 'Contact',
  description: intro.description,
  alternates: { canonical: '/contact' },
};

export default async function ContactPage() {
  const { company } = await getSiteContent();
  const wa = whatsappLink(company.whatsapp, `Hi ${company.name}, I have a question.`);
  const items = [
    isSet(company.email) && {
      icon: Mail,
      label: 'Email',
      value: company.email,
      href: `mailto:${company.email}`,
    },
    isRealPhone(company.phone) && {
      icon: Phone,
      label: 'Phone',
      value: company.phone,
      href: telHref(company.phone),
    },
    wa && { icon: MessageCircle, label: 'WhatsApp', value: 'Chat with us', href: wa },
    isSet(company.address) && { icon: MapPin, label: 'Office', value: company.address },
  ].filter(Boolean) as { icon: typeof Mail; label: string; value: string; href?: string }[];

  return (
    <>
      <PageHeader eyebrow={intro.eyebrow} title={intro.title} description={intro.description} />
      <Container className="grid gap-8 pb-24 lg:grid-cols-[1fr_1.6fr]">
        <div className="space-y-5">
          {items.map(({ icon: I, label, value, href }) => (
            <Card key={label} className="flex items-center gap-4">
              <I className="size-6 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <p className="font-heading text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
                  {label}
                </p>
                {href ? (
                  <a
                    href={href}
                    className="text-lg hover:text-primary"
                    {...(href.startsWith('https://') && {
                      target: '_blank',
                      rel: 'noopener noreferrer',
                    })}
                  >
                    {value}
                  </a>
                ) : (
                  <p className="text-lg">{value}</p>
                )}
              </div>
            </Card>
          ))}
          <p className="text-sm text-muted-foreground">
            Already sent a hire request?{' '}
            <Link href="/track" className="text-primary hover:underline">
              Track its status
            </Link>
            .
          </p>
        </div>
        <Card className="p-6 md:p-10">
          <ContactForm />
        </Card>
      </Container>
    </>
  );
}
