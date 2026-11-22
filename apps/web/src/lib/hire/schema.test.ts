// @vitest-environment node
import { CreateHireRequestBody } from '@digixsquad/api-client/zod';
import { squads } from '@/lib/seed-data';
import {
  clean,
  defaultHireValues,
  friendlyError,
  prefillFromQuery,
  stepSchemas,
  toRequestBody,
  todayISO,
  type HireFormValues,
} from './schema';

const msgs = (step: number, v: unknown) => {
  const r = stepSchemas[step as 0]!.safeParse(clean(v), { error: friendlyError });
  return r.success
    ? {}
    : Object.fromEntries(r.error.issues.map((i) => [i.path.join('.'), i.message]));
};

const tomorrow = todayISO(new Date(Date.now() + 86_400_000));

const valid: HireFormValues = {
  ...defaultHireValues(),
  org_type: 'GOVT',
  request_type: 'SINGLE_ROLE',
  items: [{ role_slug: 'qa-tester', quantity: 1, seniority: 'MID' }],
  duration_months: 2,
  start_date: tomorrow,
  engagement_mode: 'ONSITE',
  city: 'Islamabad',
  procurement_mode: 'RFQ',
  organization: {
    name: 'Example Department',
    department_or_industry: '',
    ntn: '',
    city: '',
    website: '',
  },
  contact: {
    name: 'Ali Khan',
    designation: '',
    email: 'ali@example.gov.pk',
    phone: '+92 300 1234567',
    whatsapp: '',
  },
  description: 'Need one QA tester for our e-services portal UAT phase.',
  turnstile_token: 'tok',
  consent: true,
};

describe('hire step validation', () => {
  it('step 1 requires an org type', () => {
    expect(msgs(0, { org_type: undefined })).toEqual({ org_type: 'Please choose an option.' });
  });

  it('step 2: a squad request needs a squad', () => {
    expect(msgs(1, { request_type: 'SQUAD' })).toEqual({ squad_slug: 'Choose a squad.' });
    expect(msgs(1, { request_type: 'CUSTOM_TEAM' })).toEqual({});
  });

  it('step 3: single role = exactly one item, no duplicates, role chosen', () => {
    const item = { role_slug: 'qa-tester', quantity: 1, seniority: 'MID' };
    expect(
      msgs(2, {
        request_type: 'SINGLE_ROLE',
        items: [item, { ...item, role_slug: 'video-editor' }],
      }),
    ).toHaveProperty('items');
    expect(msgs(2, { request_type: 'CUSTOM_TEAM', items: [item, item] })).toHaveProperty(
      'items.1.role_slug',
    );
    expect(
      msgs(2, { request_type: 'CUSTOM_TEAM', items: [{ ...item, role_slug: '' }] }),
    ).toHaveProperty('items.0.role_slug');
    expect(msgs(2, { request_type: 'CUSTOM_TEAM', items: [] })).toEqual({
      items: 'Add at least 1.',
    });
  });

  it('step 4: start date not in the past, NaN duration is "required"', () => {
    const base = {
      duration_months: 3,
      start_date: '2020-01-01',
      engagement_mode: 'REMOTE',
      contract_type: 'MONTHLY',
    };
    expect(msgs(3, base)).toEqual({ start_date: 'Start date can’t be in the past.' });
    expect(msgs(3, { ...base, start_date: tomorrow, duration_months: NaN })).toEqual({
      duration_months: 'This field is required.',
    });
  });

  it('step 5: GOVT needs a procurement mode; phone format checked', () => {
    const r = msgs(4, {
      ...valid,
      procurement_mode: undefined,
      contact: { ...valid.contact, phone: 'abc' },
    });
    expect(r).toMatchObject({
      procurement_mode: expect.stringMatching(/procurement/),
      'contact.phone': expect.stringMatching(/valid phone/),
    });
    expect(msgs(4, { ...valid, org_type: 'PRIVATE', procurement_mode: undefined })).toEqual({});
  });

  it('final step accepts a complete request', () => {
    expect(msgs(6, valid)).toEqual({});
    expect(msgs(6, { ...valid, consent: false })).toEqual({
      consent: 'Please confirm to continue.',
    });
  });
});

describe('toRequestBody', () => {
  it('produces a contract-valid body without empty optional fields', () => {
    const body = toRequestBody({ ...valid, org_type: 'PRIVATE', squad_slug: 'x' }, []);
    expect(CreateHireRequestBody.safeParse(body).success).toBe(true);
    expect(body).not.toHaveProperty('procurement_mode');
    expect(body).not.toHaveProperty('squad_slug');
    expect(body).not.toHaveProperty('attachment_keys');
    expect(body.contact).not.toHaveProperty('whatsapp');
  });
});

describe('prefillFromQuery', () => {
  const roles = new Set(['qa-tester']);
  it('squad link sets SQUAD and its default line-up', () => {
    const p = prefillFromQuery(
      new URLSearchParams('squad=development-squad&org=GOVT'),
      squads,
      roles,
    );
    expect(p).toMatchObject({
      org_type: 'GOVT',
      request_type: 'SQUAD',
      squad_slug: 'development-squad',
    });
    expect(p.items!.length).toBe(squads.find((s) => s.slug === 'development-squad')!.roles.length);
  });
  it('role link sets SINGLE_ROLE; unknown values are ignored', () => {
    expect(prefillFromQuery(new URLSearchParams('role=qa-tester'), squads, roles)).toMatchObject({
      request_type: 'SINGLE_ROLE',
      items: [{ role_slug: 'qa-tester', quantity: 1, seniority: 'MID' }],
    });
    expect(prefillFromQuery(new URLSearchParams('role=nope&org=X&squad=y'), squads, roles)).toEqual(
      {},
    );
  });
});
