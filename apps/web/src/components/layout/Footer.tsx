import type { SiteContentCompany, Sponsor } from '@digixsquad/api-client';
import { Mail, MapPin, Phone } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { homeAnchors } from '@/content/home';
import { isRealPhone, isSet, telHref } from '@/lib/placeholders';
import { Logo } from './Logo';
import { footerCopy, footerNav } from './nav-links';
import { SocialLinks } from './SocialLinks';

const headingClass =
  'mb-4 font-heading text-sm font-semibold tracking-[0.16em] text-foreground uppercase';

function SponsorItem({ sponsor }: { sponsor: Sponsor }) {
  const logo = isSet(sponsor.logo_url) ? sponsor.logo_url : null;
  const body = logo ? (
    <Image
      src={logo}
      alt={sponsor.name}
      width={120}
      height={32}
      // Remote logos (CMS URLs) skip the optimizer so no remotePatterns config is needed.
      unoptimized={!logo.startsWith('/')}
      className="h-8 w-auto max-w-[140px] object-contain opacity-80 transition-opacity group-hover:opacity-100"
    />
  ) : (
    <span>{sponsor.name}</span>
  );
  if (!sponsor.url || !/^https?:\/\//i.test(sponsor.url)) return body;
  return (
    <a
      href={sponsor.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex hover:text-foreground"
    >
      {body}
    </a>
  );
}

/** Site footer; doubles as the home page's `#contact` section. */
export function Footer({
  company,
  sponsors = [],
}: {
  company: SiteContentCompany;
  sponsors?: Sponsor[];
}) {
  const year = new Date().getFullYear();
  const shownSponsors = sponsors.filter((s) => isSet(s.name));
  return (
    <footer id={homeAnchors.contact} className="border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-[clamp(16px,4vw,48px)]">
        {/* Top band: brand + contact details */}
        <div className="flex flex-col gap-6 border-b border-border py-10 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <Logo />
            <p className="max-w-sm text-sm text-muted-foreground">{company.tagline}</p>
          </div>
          <address className="not-italic">
            <ul className="space-y-2 text-sm text-muted-foreground">
              {isSet(company.email) && (
                <li className="flex items-center gap-2">
                  <Mail className="size-4 text-primary" aria-hidden="true" />
                  <a href={`mailto:${company.email}`} className="hover:text-foreground">
                    {company.email}
                  </a>
                </li>
              )}
              {isRealPhone(company.phone) && (
                <li className="flex items-center gap-2">
                  <Phone className="size-4 text-primary" aria-hidden="true" />
                  <a href={telHref(company.phone)} className="hover:text-foreground">
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
          </address>
        </div>

        {/* Columns: About · Company · Sponsors */}
        <div className="grid gap-10 py-12 sm:grid-cols-2 md:grid-cols-3">
          {footerNav.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h2 className={headingClass}>{group.title}</h2>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="hover:text-foreground">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
          {shownSponsors.length > 0 && (
            <div>
              <h2 className={headingClass}>{footerCopy.sponsors}</h2>
              <ul className="flex flex-col items-start gap-3 text-sm text-muted-foreground">
                {shownSponsors.map((s) => (
                  <li key={s.name}>
                    <SponsorItem sponsor={s} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Bottom row: social links · copyright · NTN */}
      <div className="border-t border-border px-[clamp(16px,4vw,48px)] py-5 text-xs text-muted-foreground">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <SocialLinks company={company} label={footerCopy.links} />
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <span>
              © {year} {company.name}. {footerCopy.rights}
            </span>
            {isSet(company.ntn) && <span>NTN {company.ntn}</span>}
          </div>
        </div>
      </div>
    </footer>
  );
}
