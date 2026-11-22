import { describe, expect, it } from 'vitest';
import siteContent from '@digixsquad/contract/seed/site-content.json';
import squads from '@digixsquad/contract/seed/squads.json';
import roles from '@digixsquad/contract/seed/roles.json';
import {
  AdminCreateRoleBody,
  AdminCreateSquadBody,
  CreateHireRequestBody,
  GetSiteContentResponse,
} from '../src/zod';

const govtRequest = {
  org_type: 'GOVT',
  request_type: 'SINGLE_ROLE',
  items: [{ role_slug: 'qa-tester', quantity: 1, seniority: 'MID' }],
  duration_months: 2,
  start_date: '2026-12-01',
  engagement_mode: 'ONSITE',
  city: 'Islamabad',
  contract_type: 'MONTHLY',
  procurement_mode: 'RFQ',
  organization: { name: 'Example Department', department_or_industry: 'IT Wing' },
  contact: { name: 'Ali Khan', email: 'ali@example.gov.pk', phone: '+92 300 1234567' },
  description: 'Need one QA tester for our e-services portal UAT phase.',
  turnstile_token: 'test-token',
  consent: true,
};

describe('seed data matches generated Zod schemas', () => {
  it('site content (about, mission, vision, values ...)', () => {
    expect(GetSiteContentResponse.safeParse(siteContent).success).toBe(true);
    expect(siteContent.about.mission.length).toBeGreaterThan(20);
    expect(siteContent.about.vision.length).toBeGreaterThan(20);
  });

  it('roles', () => {
    for (const r of roles) expect(AdminCreateRoleBody.safeParse(r).success, r.slug).toBe(true);
  });

  it('squads', () => {
    for (const s of squads) expect(AdminCreateSquadBody.safeParse(s).success, s.slug).toBe(true);
  });
});

describe('CreateHireRequestBody', () => {
  it('accepts a valid government single-role request', () => {
    expect(CreateHireRequestBody.safeParse(govtRequest).success).toBe(true);
  });

  it('rejects missing consent, bad email and zero quantity', () => {
    expect(CreateHireRequestBody.safeParse({ ...govtRequest, consent: false }).success).toBe(false);
    expect(
      CreateHireRequestBody.safeParse({
        ...govtRequest,
        contact: { ...govtRequest.contact, email: 'not-an-email' },
      }).success,
    ).toBe(false);
    expect(
      CreateHireRequestBody.safeParse({
        ...govtRequest,
        items: [{ role_slug: 'qa-tester', quantity: 0, seniority: 'MID' }],
      }).success,
    ).toBe(false);
  });

  it('rejects duration over 36 months', () => {
    expect(CreateHireRequestBody.safeParse({ ...govtRequest, duration_months: 48 }).success).toBe(
      false,
    );
  });
});
