import type { SiteContentCompany } from '@digixsquad/api-client';
import { isRealPhone, isSet } from '@/lib/placeholders';
import { siteUrl } from '@/lib/site-url';

/** schema.org Organization for search engines. Placeholder fields are left out. */
export function OrganizationJsonLd({ company }: { company: SiteContentCompany }) {
  const socials = Object.values(company.socials ?? {}).filter((u): u is string => !!u);
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: company.name,
    slogan: company.tagline,
    url: siteUrl,
    logo: `${siteUrl}/icon.png`,
    ...(isSet(company.email) && { email: company.email }),
    ...(isRealPhone(company.phone) && { telephone: company.phone }),
    ...(isSet(company.address) && { address: company.address }),
    ...(isSet(company.ntn) && { taxID: company.ntn }),
    ...(socials.length > 0 && { sameAs: socials }),
  };
  return (
    <script
      type="application/ld+json"
      // JSON.stringify output with "<" escaped cannot break out of the script tag.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}
