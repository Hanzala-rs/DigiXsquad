import type { SiteContentCompany } from '@digixsquad/api-client';
import { MessageCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { isSet } from '@/lib/placeholders';
import { whatsappLink } from '@/lib/whatsapp';

export type SocialKey = 'x' | 'linkedin' | 'whatsapp';
export type SocialLink = { key: SocialKey; label: string; href: string };

/** Only real http(s) profile URLs: skips "", "TBD" and anything that isn't a web link. */
const webUrl = (v?: string | null): string | null => {
  if (!isSet(v)) return null;
  const s = v.trim();
  return /^https?:\/\/[^\s]+\.[^\s]+/i.test(s) ? s : null;
};

/** Social buttons to show for this company, in display order (placeholders are dropped). */
export function socialLinks(company: SiteContentCompany): SocialLink[] {
  const s = company.socials ?? {};
  const candidates: [SocialKey, string, string | null][] = [
    ['x', 'X (Twitter)', webUrl(s.x) ?? webUrl(s.twitter)],
    ['linkedin', 'LinkedIn', webUrl(s.linkedin)],
    ['whatsapp', 'WhatsApp', whatsappLink(company.whatsapp)],
  ];
  return candidates.flatMap(([key, label, href]) => (href ? [{ key, label, href }] : []));
}

const XIcon = () => (
  <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.451-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644Z" />
  </svg>
);
const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286ZM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125ZM7.119 20.452H3.555V9h3.564v11.452ZM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003Z" />
  </svg>
);

const icons: Record<SocialKey, () => ReactNode> = {
  x: XIcon,
  linkedin: LinkedInIcon,
  whatsapp: () => <MessageCircle className="size-4" aria-hidden="true" />,
};

/** Chamfered icon buttons (X, LinkedIn, WhatsApp). Renders nothing when none are set. */
export function SocialLinks({
  company,
  label,
  className,
}: {
  company: SiteContentCompany;
  /** Visible lead-in, e.g. "Links". */
  label?: string;
  className?: string;
}) {
  const links = socialLinks(company);
  if (!links.length) return null;
  return (
    <div className={className}>
      <div className="flex items-center gap-3">
        {label && (
          <span className="font-heading text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
            {label}
          </span>
        )}
        <ul className="flex items-center gap-2">
          {links.map((l) => {
            const Icon = icons[l.key];
            return (
              <li key={l.key}>
                <a
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${company.name} on ${l.label}`}
                  className="chamfer-sm grid size-9 place-items-center bg-card text-muted-foreground shadow-[inset_0_0_0_1px_var(--border)] transition-[color,box-shadow] hover:text-primary hover:shadow-[inset_0_0_0_1px_var(--primary),0_0_18px_rgb(255_106_0/0.35)] focus-visible:text-primary"
                >
                  <Icon />
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
