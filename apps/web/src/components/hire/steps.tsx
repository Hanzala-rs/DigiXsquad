'use client';

import type { ServiceRole, Squad } from '@digixsquad/api-client';
import { createHireRequestBodyItemsMax } from '@digixsquad/api-client/zod';
import { Plus, Trash2 } from 'lucide-react';
import { useEffect } from 'react';
import {
  Controller,
  useFieldArray,
  useWatch,
  type FieldErrors,
  type UseFormReturn,
} from 'react-hook-form';
import {
  ChoiceCards,
  describedBy,
  Field,
  FieldError,
  Input,
  Select,
  Textarea,
} from '@/components/forms/fields';
import { Button } from '@/components/ui/button';
import {
  budgetRangeOptions,
  contractTypeOptions,
  engagementModeOptions,
  orgTypeOptions,
  procurementModeOptions,
  requestTypeOptions,
  roleCategoryLabels,
  roleCategoryOrder,
  seniorityOptions,
} from '@/content/labels';
import { squadItems, todayISO, type HireFormValues } from '@/lib/hire/schema';

export type Form = UseFormReturn<HireFormValues>;

/** errors["contact.email"] style lookup into RHF's nested errors. */
export function errorAt(errors: FieldErrors<HireFormValues>, path: string): string | undefined {
  let cur: unknown = errors;
  for (const k of path.split('.')) {
    if (!cur || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[k];
  }
  const msg = (cur as { message?: unknown } | undefined)?.message;
  return typeof msg === 'string' ? msg : undefined;
}

function useErr(form: Form) {
  const { errors } = form.formState;
  return (path: string) => errorAt(errors, path);
}

/* ───────── 1. Organization type ───────── */
export function OrgStep({ form }: { form: Form }) {
  const err = useErr(form);
  return (
    <Controller
      control={form.control}
      name="org_type"
      render={({ field }) => (
        <ChoiceCards
          name="org_type"
          legend="Who is the team for?"
          options={orgTypeOptions}
          value={field.value}
          onChange={field.onChange}
          error={err('org_type')}
        />
      )}
    />
  );
}

/* ───────── 2. What you need ───────── */
export function NeedStep({ form, squads }: { form: Form; squads: Squad[] }) {
  const err = useErr(form);
  const requestType = useWatch({ control: form.control, name: 'request_type' });

  return (
    <div className="space-y-8">
      <Controller
        control={form.control}
        name="request_type"
        render={({ field }) => (
          <ChoiceCards
            name="request_type"
            legend="What do you need?"
            options={requestTypeOptions}
            columns={3}
            value={field.value}
            onChange={(v) => {
              field.onChange(v);
              const items = form.getValues('items');
              if (v === 'SINGLE_ROLE' && items.length > 1)
                form.setValue('items', items.slice(0, 1));
              if (v !== 'SQUAD') form.setValue('squad_slug', undefined);
            }}
            error={err('request_type')}
          />
        )}
      />
      {requestType === 'SQUAD' && (
        <Controller
          control={form.control}
          name="squad_slug"
          render={({ field }) => (
            <ChoiceCards
              name="squad_slug"
              legend="Choose a squad"
              options={squads.map((s) => ({ value: s.slug, label: s.name, hint: s.tagline }))}
              value={field.value}
              onChange={(slug) => {
                field.onChange(slug);
                const squad = squads.find((s) => s.slug === slug);
                if (squad) form.setValue('items', squadItems(squad));
              }}
              error={err('squad_slug')}
            />
          )}
        />
      )}
    </div>
  );
}

/* ───────── 3. Roles ───────── */
export function RolesStep({
  form,
  roles,
  squads,
}: {
  form: Form;
  roles: ServiceRole[];
  squads: Squad[];
}) {
  const err = useErr(form);
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'items' });
  const [requestType, squadSlug] = useWatch({
    control: form.control,
    name: ['request_type', 'squad_slug'],
  });
  const single = requestType === 'SINGLE_ROLE';
  const squad = squads.find((s) => s.slug === squadSlug);
  const empty = { role_slug: '', quantity: 1, seniority: 'MID' as const };

  useEffect(() => {
    if (fields.length === 0) append(empty, { shouldFocus: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const grouped = roleCategoryOrder
    .map((c) => ({ c, roles: roles.filter((r) => r.category === c) }))
    .filter((g) => g.roles.length > 0);

  return (
    <div className="space-y-5">
      {squad && (
        <p className="text-sm text-muted-foreground">
          Default line-up for the <strong className="text-foreground">{squad.name}</strong>. Change
          quantities or seniority, add roles, or remove the ones you don’t need.
        </p>
      )}
      <ul className="space-y-4">
        {fields.map((f, i) => (
          <li
            key={f.id}
            className="chamfer bg-surface p-4 shadow-[inset_0_0_0_1px_var(--border)] md:p-5"
          >
            <div className="grid gap-4 md:grid-cols-[2fr_0.7fr_1fr_auto] md:items-start">
              <Field id={`items.${i}.role_slug`} label="Role" error={err(`items.${i}.role_slug`)}>
                <Select
                  id={`items.${i}.role_slug`}
                  {...form.register(`items.${i}.role_slug`)}
                  {...describedBy(`items.${i}.role_slug`, err(`items.${i}.role_slug`))}
                >
                  <option value="">Select a role…</option>
                  {grouped.map((g) => (
                    <optgroup key={g.c} label={roleCategoryLabels[g.c]}>
                      {g.roles.map((r) => (
                        <option key={r.slug} value={r.slug}>
                          {r.title}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </Select>
              </Field>
              <Field id={`items.${i}.quantity`} label="People" error={err(`items.${i}.quantity`)}>
                <Input
                  id={`items.${i}.quantity`}
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={20}
                  {...form.register(`items.${i}.quantity`, { valueAsNumber: true })}
                  {...describedBy(`items.${i}.quantity`, err(`items.${i}.quantity`))}
                />
              </Field>
              <Field
                id={`items.${i}.seniority`}
                label="Seniority"
                error={err(`items.${i}.seniority`)}
              >
                <Select id={`items.${i}.seniority`} {...form.register(`items.${i}.seniority`)}>
                  {seniorityOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </Field>
              {!single && (
                <button
                  type="button"
                  onClick={() => remove(i)}
                  disabled={fields.length === 1}
                  className="chamfer-sm grid size-12 place-items-center self-end text-muted-foreground shadow-[inset_0_0_0_1px_var(--border)] hover:text-foreground disabled:opacity-30"
                  aria-label={`Remove role ${i + 1}`}
                >
                  <Trash2 className="size-4" />
                </button>
              )}
            </div>
            <div className="mt-4">
              <Field
                id={`items.${i}.skills_note`}
                label="Specific skills or tools"
                optional
                error={err(`items.${i}.skills_note`)}
              >
                <Input
                  id={`items.${i}.skills_note`}
                  placeholder="e.g. Selenium, API testing, Urdu content"
                  {...form.register(`items.${i}.skills_note`)}
                />
              </Field>
            </div>
          </li>
        ))}
      </ul>
      <FieldError id="items-error">{err('items')}</FieldError>
      {!single && fields.length < createHireRequestBodyItemsMax && (
        <Button type="button" variant="ghost" size="sm" onClick={() => append(empty)}>
          <Plus /> Add a role
        </Button>
      )}
    </div>
  );
}

/* ───────── 4. Duration & work mode ───────── */
export function EngagementStep({ form }: { form: Form }) {
  const err = useErr(form);
  const mode = useWatch({ control: form.control, name: 'engagement_mode' });
  return (
    <div className="space-y-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          id="duration_months"
          label="Duration (months)"
          hint="1 to 36 months"
          error={err('duration_months')}
        >
          <Input
            id="duration_months"
            type="number"
            inputMode="numeric"
            min={1}
            max={36}
            {...form.register('duration_months', { valueAsNumber: true })}
            {...describedBy('duration_months', err('duration_months'), true)}
          />
        </Field>
        <Field id="start_date" label="Preferred start date" error={err('start_date')}>
          <Input
            id="start_date"
            type="date"
            min={todayISO()}
            {...form.register('start_date')}
            {...describedBy('start_date', err('start_date'))}
          />
        </Field>
      </div>
      <Controller
        control={form.control}
        name="engagement_mode"
        render={({ field }) => (
          <ChoiceCards
            name="engagement_mode"
            legend="Where will the team work?"
            options={engagementModeOptions}
            columns={3}
            value={field.value}
            onChange={field.onChange}
            error={err('engagement_mode')}
          />
        )}
      />
      <Field
        id="city"
        label="City"
        optional={mode === 'REMOTE'}
        hint={mode === 'REMOTE' ? undefined : 'Where on-site work happens'}
        error={err('city')}
      >
        <Input
          id="city"
          autoComplete="address-level2"
          {...form.register('city')}
          {...describedBy('city', err('city'), mode !== 'REMOTE')}
        />
      </Field>
      <Controller
        control={form.control}
        name="contract_type"
        render={({ field }) => (
          <ChoiceCards
            name="contract_type"
            legend="Contract type"
            options={contractTypeOptions}
            value={field.value}
            onChange={field.onChange}
            error={err('contract_type')}
          />
        )}
      />
    </div>
  );
}

/* ───────── 5. Your details ───────── */
export function DetailsStep({ form }: { form: Form }) {
  const err = useErr(form);
  const govt = useWatch({ control: form.control, name: 'org_type' }) === 'GOVT';
  const input = (
    name: Parameters<Form['register']>[0],
    label: string,
    opts: { optional?: boolean; type?: string; autoComplete?: string; hint?: string } = {},
  ) => (
    <Field id={name} label={label} optional={opts.optional} hint={opts.hint} error={err(name)}>
      <Input
        id={name}
        type={opts.type ?? 'text'}
        autoComplete={opts.autoComplete}
        {...form.register(name)}
        {...describedBy(name, err(name), !!opts.hint)}
      />
    </Field>
  );

  return (
    <div className="space-y-10">
      <fieldset className="space-y-5">
        <legend className="mb-1 font-heading text-sm font-semibold tracking-[0.2em] text-primary uppercase">
          {govt ? 'Department' : 'Organization'}
        </legend>
        <div className="grid gap-5 sm:grid-cols-2">
          {input('organization.name', govt ? 'Department / organization name' : 'Company name', {
            autoComplete: 'organization',
          })}
          {input(
            'organization.department_or_industry',
            govt ? 'Wing, directorate or ministry' : 'Industry',
            { optional: true },
          )}
          {input('organization.city', 'City', { optional: true, autoComplete: 'address-level2' })}
          {govt
            ? input('organization.ntn', 'NTN', { optional: true })
            : input('organization.website', 'Website', {
                optional: true,
                type: 'url',
                autoComplete: 'url',
              })}
        </div>
      </fieldset>

      {govt && (
        <fieldset className="space-y-5">
          <legend className="mb-1 font-heading text-sm font-semibold tracking-[0.2em] text-primary uppercase">
            Procurement
          </legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="procurement_mode" label="Procurement mode" error={err('procurement_mode')}>
              <Select
                id="procurement_mode"
                {...form.register('procurement_mode')}
                {...describedBy('procurement_mode', err('procurement_mode'))}
              >
                <option value="">Select…</option>
                {procurementModeOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </Field>
            {input('tender_ref', 'Tender / RFQ reference', { optional: true })}
          </div>
        </fieldset>
      )}

      <fieldset className="space-y-5">
        <legend className="mb-1 font-heading text-sm font-semibold tracking-[0.2em] text-primary uppercase">
          Contact person
        </legend>
        <div className="grid gap-5 sm:grid-cols-2">
          {input('contact.name', 'Full name', { autoComplete: 'name' })}
          {input('contact.designation', 'Designation', {
            optional: true,
            autoComplete: 'organization-title',
          })}
          {input('contact.email', 'Email', {
            type: 'email',
            autoComplete: 'email',
            hint: 'We send your reference number here',
          })}
          {input('contact.phone', 'Phone', { type: 'tel', autoComplete: 'tel' })}
          {input('contact.whatsapp', 'WhatsApp', {
            optional: true,
            type: 'tel',
            hint: 'If different from phone',
          })}
        </div>
      </fieldset>
    </div>
  );
}

/* ───────── 6. Project ───────── */
export function ProjectStep({ form, attachments }: { form: Form; attachments: React.ReactNode }) {
  const err = useErr(form);
  const description = useWatch({ control: form.control, name: 'description' }) ?? '';
  return (
    <div className="space-y-8">
      <Field id="budget_range" label="Monthly budget" optional error={err('budget_range')}>
        <Select id="budget_range" {...form.register('budget_range')}>
          <option value="">Prefer not to say</option>
          {budgetRangeOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field
        id="description"
        label="Describe the project"
        hint={`What will the team work on? Systems, deliverables, timelines. ${description.length}/3000`}
        error={err('description')}
      >
        <Textarea
          id="description"
          maxLength={3000}
          {...form.register('description')}
          {...describedBy('description', err('description'), true)}
        />
      </Field>
      {attachments}
    </div>
  );
}
