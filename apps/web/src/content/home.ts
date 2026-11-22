/**
 * Home hero copy that the contract's `SiteContent` doesn't cover yet.
 *
 * TODO(contract PR): add `hero.accent_left`, `hero.accent_right`, `hero.founder_name`,
 * `hero.founder_title` to `SiteContentHero` in packages/contract/openapi.yaml (Codex reviews),
 * then read these from getSiteContent() and delete this file.
 * Founder name + designation: waiting on the client (PLAN.md §11).
 */
export const homeHeroExtras = {
  wordLeft: 'Digital',
  wordRight: 'Squad',
  accentLeft: 'IT talent · on demand',
  accentRight: 'Monthly · Managed · Ready',
  introLoading: 'Assembling your squad',
  founderAlt: 'DigixSquad founder',
} as const;
