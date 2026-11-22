'use client';

import type { ServiceRole, Squad } from '@digixsquad/api-client';
import { Pencil } from 'lucide-react';
import type { ReactNode } from 'react';
import {
  budgetRangeOptions,
  contractTypeOptions,
  engagementModeOptions,
  labelOf,
  orgTypeOptions,
  procurementModeOptions,
  requestTypeOptions,
  seniorityOptions,
} from '@/content/labels';
import type { UploadedFile } from '@/lib/hire/draft';
import type { HireFormValues, StepIndex } from '@/lib/hire/schema';

function Block({
  title,
  step,
  onEdit,
  children,
}: {
  title: string;
  step: StepIndex;
  onEdit: (s: StepIndex) => void;
  children: ReactNode;
}) {
  return (
    <section className="chamfer bg-surface p-5 shadow-[inset_0_0_0_1px_var(--border)]">
      <div className="mb-3 flex items-center justify-between gap-4">
        <h3 className="font-heading text-sm font-semibold tracking-[0.2em] text-primary uppercase">
          {title}
        </h3>
        <button
          type="button"
          onClick={() => onEdit(step)}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <Pencil className="size-3.5" aria-hidden="true" /> Edit
          <span className="sr-only"> {title}</span>
        </button>
      </div>
      <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[max-content_1fr]">{children}</dl>
    </section>
  );
}

function Row({ k, v }: { k: string; v?: ReactNode }) {
  if (v === undefined || v === null || v === '') return null;
  return (
    <>
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="break-words">{v}</dd>
    </>
  );
}

export function Review({
  values: v,
  files,
  roles,
  squads,
  onEdit,
}: {
  values: HireFormValues;
  files: UploadedFile[];
  roles: ServiceRole[];
  squads: Squad[];
  onEdit: (s: StepIndex) => void;
}) {
  const roleTitle = (slug: string) => roles.find((r) => r.slug === slug)?.title ?? slug;
  const govt = v.org_type === 'GOVT';
  const d = v.start_date ? new Date(`${v.start_date}T00:00:00`) : null;

  return (
    <div className="space-y-4">
      <Block title="Request" step={1} onEdit={onEdit}>
        <Row k="For" v={labelOf(orgTypeOptions, v.org_type)} />
        <Row k="Type" v={labelOf(requestTypeOptions, v.request_type)} />
        <Row k="Squad" v={squads.find((s) => s.slug === v.squad_slug)?.name} />
      </Block>
      <Block title="Roles" step={2} onEdit={onEdit}>
        {v.items.map((item, i) => (
          <Row
            key={i}
            k={`${item.quantity}× ${roleTitle(item.role_slug)}`}
            v={[labelOf(seniorityOptions, item.seniority), item.skills_note]
              .filter(Boolean)
              .join(' · ')}
          />
        ))}
      </Block>
      <Block title="Engagement" step={3} onEdit={onEdit}>
        <Row k="Duration" v={`${v.duration_months} month${v.duration_months === 1 ? '' : 's'}`} />
        <Row k="Start" v={d?.toLocaleDateString('en-GB', { dateStyle: 'medium' })} />
        <Row k="Work mode" v={labelOf(engagementModeOptions, v.engagement_mode)} />
        <Row k="City" v={v.city} />
        <Row k="Contract" v={labelOf(contractTypeOptions, v.contract_type)} />
      </Block>
      <Block title="Details" step={4} onEdit={onEdit}>
        <Row k={govt ? 'Department' : 'Company'} v={v.organization.name} />
        <Row k={govt ? 'Wing / ministry' : 'Industry'} v={v.organization.department_or_industry} />
        <Row k="City" v={v.organization.city} />
        <Row k="NTN" v={govt ? v.organization.ntn : undefined} />
        <Row k="Website" v={govt ? undefined : v.organization.website} />
        {govt && <Row k="Procurement" v={labelOf(procurementModeOptions, v.procurement_mode)} />}
        {govt && <Row k="Tender ref" v={v.tender_ref} />}
        <Row k="Contact" v={[v.contact.name, v.contact.designation].filter(Boolean).join(', ')} />
        <Row k="Email" v={v.contact.email} />
        <Row k="Phone" v={v.contact.phone} />
        <Row k="WhatsApp" v={v.contact.whatsapp} />
      </Block>
      <Block title="Project" step={5} onEdit={onEdit}>
        <Row
          k="Budget"
          v={v.budget_range ? labelOf(budgetRangeOptions, v.budget_range) : 'Not specified'}
        />
        <Row k="Description" v={<span className="whitespace-pre-line">{v.description}</span>} />
        <Row k="Files" v={files.length ? files.map((f) => f.name).join(', ') : undefined} />
      </Block>
    </div>
  );
}
