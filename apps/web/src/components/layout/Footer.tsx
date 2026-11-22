import type { SiteContentCompany } from '@digixsquad/api-client';
import { Mail, MapPin, Phone } from 'lucide-react';
import Link from 'next/link';
import { Logo } from './Logo';
import { footerNav } from './nav-links';

const isSet = (v?: string) => !!v && !/^TBD\b/i.test(v.trim());

export function Footer({ company }: { company: SiteContentCompany }) {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto grid max-w-7xl gap-10 px-[clamp(16px,4vw,48px)] py-14 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-xs text-sm text-muted-foreground">{company.tagline}</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {isSet(company.email) && (
              <li className="flex items-center gap-2">
                <Mail className="size-4 text-primary" aria-hidden="true" />
                <a href={`mailto:${company.email}`} className="hover:text-foreground">
                  {company.email}
                </a>
              </li>
            )}
            {isSet(company.phone) && (
              <li className="flex items-center gap-2">
                <Phone className="size-4 text-primary" aria-hidden="true" />
                <a href={`tel:${company.phone.replace(/\s/g, '')}`} className="hover:text-foreground">
                  {company.phone}
                </a>
              </li>
            )}
            {isSet(company.address) && (
              <li className="flex items-center gap-2">
                <MapPin className="size-4 text-primary" aria-hidden="true" />
                {company.address}
              </li>
            )}
          </ul>
        </div>
        {footerNav.map((group) => (
          <div key={group.title}>
            <h2 className="mb-4 font-heading text-sm font-semibold tracking-[0.16em] text-foreground uppercase">
              {group.title}
            </h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border px-[clamp(16px,4vw,48px)] py-5 text-xs text-muted-foreground">
        <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-2">
          <span>
            © {year} {company.name}. All rights reserved.
          </span>
          {isSet(company.ntn) && <span>NTN {company.ntn}</span>}
        </div>
      </div>
    </footer>
  );
}
