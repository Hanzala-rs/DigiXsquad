import type { HireRequestCreate, Squad } from '@digixsquad/api-client';
import { CreateHireRequestBody } from '@digixsquad/api-client/zod';
import { z } from 'zod';

/**
 * Hire form: 7 steps, each validated with a slice of the contract's Zod schema plus the
 * business rules from the contract description (CLAUDE.md "Contract rules").
 */
export const HIRE_STEPS = [
  { id: 'org', title: 'Organization type' },
  { id: 'need', title: 'What you need' },
  { id: 'roles', title: 'Roles' },
  { id: 'engagement', title: 'Duration & work mode' },
  { id: 'details', title: 'Your details' },
  { id: 'project', title: 'Project' },
  { id: 'review', title: 'Review & submit' },
] as const;
export type StepIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export const LAST_STEP = (HIRE_STEPS.length - 1) as StepIndex;

type Body = z.input<typeof CreateHireRequestBody>;
/** Form state: the request body, with `consent` as a plain checkbox boolean. */
export type HireFormValues = Omit<Body, 'consent'> & { consent: boolean };
export type HireItem = Body['items'][number];

const B = CreateHireRequestBody;
const ctx = (c: z.core.$RefinementCtx, path: (string | number)[], message: string) =>
  c.addIssue({ code: 'custom', path, message });

/** YYYY-MM-DD for today in the visitor's timezone (date inputs are local). */
export const todayISO = (now = new Date()) =>
  new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);

function needRules(v: { request_type: string; squad_slug?: string }, c: z.core.$RefinementCtx) {
  if (v.request_type === 'SQUAD' && !v.squad_slug) ctx(c, ['squad_slug'], 'Choose a squad.');
}

function itemRules(
  v: { request_type: string; items: { role_slug: string }[] },
  c: z.core.$RefinementCtx,
) {
  if (v.request_type === 'SINGLE_ROLE' && v.items.length !== 1)
    ctx(c, ['items'], 'A single-role request has exactly one role.');
  const seen = new Set<string>();
  v.items.forEach((item, i) => {
    if (!item.role_slug) ctx(c, ['items', i, 'role_slug'], 'Choose a role.');
    else if (seen.has(item.role_slug))
      ctx(
        c,
        ['items', i, 'role_slug'],
        'This role is already listed. Change its quantity instead.',
      );
    seen.add(item.role_slug);
  });
}

function engagementRules(v: { start_date: string }, c: z.core.$RefinementCtx) {
  if (v.start_date < todayISO()) ctx(c, ['start_date'], 'Start date can’t be in the past.');
}

function detailRules(v: { org_type: string; procurement_mode?: string }, c: z.core.$RefinementCtx) {
  if (v.org_type === 'GOVT' && !v.procurement_mode)
    ctx(c, ['procurement_mode'], 'Choose a procurement mode (or “Not sure yet”).');
}

export const stepSchemas = [
  B.pick({ org_type: true }),
  B.pick({ request_type: true, squad_slug: true }).superRefine(needRules),
  B.pick({ request_type: true, items: true }).superRefine(itemRules),
  B.pick({
    duration_months: true,
    start_date: true,
    engagement_mode: true,
    city: true,
    contract_type: true,
  }).superRefine(engagementRules),
  B.pick({
    org_type: true,
    organization: true,
    contact: true,
    procurement_mode: true,
    tender_ref: true,
  }).superRefine(detailRules),
  B.pick({ budget_range: true, description: true, attachment_keys: true }),
  // Final step validates everything, with every rule.
  B.superRefine((v, c) => {
    needRules(v, c);
    itemRules(v, c);
    engagementRules(v, c);
    detailRules(v, c);
    if (!v.turnstile_token) ctx(c, ['turnstile_token'], 'Please complete the security check.');
  }),
] as const;

/**
 * Form inputs give '' for empty optional fields and NaN for empty number inputs; the contract
 * wants those keys absent. Drops them recursively (arrays keep their length).
 */
export function clean<T>(value: T): T {
  if (Array.isArray(value)) return value.map(clean) as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      if (v === '' || v === null || v === undefined || (typeof v === 'number' && Number.isNaN(v)))
        continue;
      out[k] = clean(v);
    }
    return out as T;
  }
  return value;
}

/** Plain-English messages for Zod issues shown under fields. */
export const friendlyError: z.core.$ZodErrorMap = (iss) => {
  switch (iss.code) {
    case 'invalid_type':
      return iss.input === undefined || Number.isNaN(iss.input)
        ? 'This field is required.'
        : 'Please check this value.';
    case 'invalid_value':
      return iss.values.length === 1 && iss.values[0] === true
        ? 'Please confirm to continue.'
        : 'Please choose an option.';
    case 'too_small':
      if (iss.origin === 'string')
        return Number(iss.minimum) <= 1
          ? 'This field is required.'
          : `Please enter at least ${iss.minimum} characters.`;
      if (iss.origin === 'array') return `Add at least ${iss.minimum}.`;
      return `Minimum is ${iss.minimum}.`;
    case 'too_big':
      if (iss.origin === 'string') return `Keep it under ${iss.maximum} characters.`;
      if (iss.origin === 'array') return `You can add up to ${iss.maximum}.`;
      return `Maximum is ${iss.maximum}.`;
    case 'invalid_format':
      if (iss.format === 'email') return 'Enter a valid email address.';
      if (iss.format === 'date') return 'Choose a date.';
      // Contract phone/whatsapp pattern: ^\+?[0-9 \-]{7,20}$
      if (iss.format === 'regex' && iss.pattern?.includes('0-9 '))
        return 'Enter a valid phone number, e.g. +92 300 1234567.';
      return 'Please check the format.';
    default:
      return undefined;
  }
};

export function defaultHireValues(): HireFormValues {
  return {
    org_type: undefined as unknown as HireFormValues['org_type'],
    request_type: undefined as unknown as HireFormValues['request_type'],
    squad_slug: undefined,
    items: [],
    duration_months: 3,
    start_date: '',
    engagement_mode: undefined as unknown as HireFormValues['engagement_mode'],
    city: '',
    contract_type: 'MONTHLY',
    procurement_mode: undefined,
    tender_ref: '',
    budget_range: undefined,
    organization: { name: '', department_or_industry: '', ntn: '', city: '', website: '' },
    contact: { name: '', designation: '', email: '', phone: '', whatsapp: '' },
    description: '',
    attachment_keys: [],
    turnstile_token: '',
    consent: false,
  };
}

/** A squad's default line-up as request items. */
export const squadItems = (squad: Squad): HireItem[] =>
  squad.roles.map(({ role, default_qty }) => ({
    role_slug: role.slug,
    quantity: default_qty,
    seniority: 'MID',
  }));

/** Values implied by a CTA link: /hire?squad=…, ?role=…, ?org=GOVT|PRIVATE. */
export function prefillFromQuery(
  params: URLSearchParams,
  squads: Squad[],
  roleSlugs: Set<string>,
): Partial<HireFormValues> {
  const out: Partial<HireFormValues> = {};
  const org = params.get('org');
  if (org === 'GOVT' || org === 'PRIVATE') out.org_type = org;
  const squad = squads.find((s) => s.slug === params.get('squad'));
  const role = params.get('role');
  if (squad) {
    out.request_type = 'SQUAD';
    out.squad_slug = squad.slug;
    out.items = squadItems(squad);
  } else if (role && roleSlugs.has(role)) {
    out.request_type = 'SINGLE_ROLE';
    out.squad_slug = undefined;
    out.items = [{ role_slug: role, quantity: 1, seniority: 'MID' }];
  }
  return out;
}

/** Final body for the API (form state → contract). */
export function toRequestBody(values: HireFormValues, attachmentKeys: string[]): HireRequestCreate {
  const body = clean({ ...values, attachment_keys: attachmentKeys }) as HireRequestCreate;
  if (body.request_type !== 'SQUAD') delete body.squad_slug;
  if (body.org_type !== 'GOVT') {
    delete body.procurement_mode;
    delete body.tender_ref;
  }
  if (!attachmentKeys.length) delete body.attachment_keys;
  return { ...body, consent: true };
}
