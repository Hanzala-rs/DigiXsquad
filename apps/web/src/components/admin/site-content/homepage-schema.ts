import type { SiteContent } from '@digixsquad/api-client';
import { AdminUpdateSiteContentBody } from '@digixsquad/api-client/zod';
import { z } from 'zod';

const B = AdminUpdateSiteContentBody.shape;

/** Which string field of each list item must not be blank (UI rule on top of the contract). */
const requiredFields = {
  what_we_do: ['title', 'description'],
  team: ['name', 'title'],
  projects: ['label'],
  sponsors: ['name'],
} as const;

/**
 * The home-page fields of SiteContent, from the generated contract schema. The contract marks
 * them optional; the editor always holds them (empty lists are fine).
 */
export const HomepageSchema = z
  .object({
    founder: B.founder.unwrap(),
    what_we_do: B.what_we_do.unwrap(),
    team: B.team.unwrap(),
    projects: B.projects.unwrap(),
    sponsors: B.sponsors.unwrap(),
  })
  .superRefine((v, ctx) => {
    const blank = (s?: string) => !s || !s.trim();
    for (const key of ['name', 'title'] as const)
      if (blank(v.founder[key]))
        ctx.addIssue({
          code: 'custom',
          path: ['founder', key],
          message: 'This field is required.',
        });
    for (const [list, keys] of Object.entries(requiredFields) as [
      keyof typeof requiredFields,
      readonly string[],
    ][])
      v[list].forEach((item, i) => {
        for (const key of keys)
          if (blank((item as Record<string, string | undefined>)[key]))
            ctx.addIssue({
              code: 'custom',
              path: [list, i, key],
              message: 'This field is required.',
            });
      });
  });

export type HomepageValues = z.input<typeof HomepageSchema>;
export type HomepageParsed = z.output<typeof HomepageSchema>;

/** Form values from the current site content (missing home fields start empty). */
export const homepageDefaults = (c: SiteContent): HomepageValues => ({
  founder: { name: '', title: '', ...c.founder },
  what_we_do: c.what_we_do ?? [],
  team: c.team ?? [],
  projects: c.projects ?? [],
  sponsors: c.sponsors ?? [],
});

/** The full document for PUT /admin/site-content: everything else is sent back untouched. */
export const mergeHomepage = (c: SiteContent, v: HomepageParsed): SiteContent => ({ ...c, ...v });

/** Blank inputs mean "not set" for optional strings (an empty URL would fail validation). */
export const emptyToUndefined = (v: unknown) =>
  typeof v === 'string' && v.trim() === '' ? undefined : v;

export const toInt = (v: unknown) => (v === '' || v == null ? undefined : Number(v));
