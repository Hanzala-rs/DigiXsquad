'use client';

import type { Talent } from '@digixsquad/api-client';
import { AdminCreateTalentBody } from '@digixsquad/api-client/zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Loader2, UserX } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, type ComponentProps } from 'react';
import { useForm, type RegisterOptions } from 'react-hook-form';
import type { z } from 'zod';
import { describedBy, Field, Input, Select } from '@/components/forms/fields';
import { Button } from '@/components/ui/button';
import { seniorityOptions } from '@/content/labels';
import { adminApi, qk } from '@/lib/admin/api';
import { availabilityBadge } from '@/lib/admin/format';
import { friendlyError } from '@/lib/hire/schema';
import { useCan } from '../AdminSession';
import { ErrorState, Panel } from '../ui';

type Values = z.input<typeof AdminCreateTalentBody>;
type Parsed = z.output<typeof AdminCreateTalentBody>;

const toNumber = (v: unknown) => (v === '' || v == null ? undefined : Number(v));
/** "React, Node.js ,  SQL" → ["React", "Node.js", "SQL"] (an array default shows as "a,b"). */
const toList = (v: unknown) =>
  typeof v === 'string'
    ? v
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : v;

const defaults = (t?: Talent): Values => ({
  full_name: t?.full_name ?? '',
  email: t?.email ?? '',
  phone: t?.phone ?? '',
  primary_role_slug: t?.primary_role.slug ?? '',
  seniority: t?.seniority ?? 'MID',
  skills: t?.skills ?? [],
  experience_years: t?.experience_years ?? 0,
  availability: t?.availability ?? 'AVAILABLE',
  monthly_cost: t?.monthly_cost ?? undefined,
  city: t?.city ?? '',
});

/** Create (no `talent`) or edit a talent. */
export function TalentForm({ talent }: { talent?: Talent }) {
  const router = useRouter();
  const qc = useQueryClient();
  const canSeeCost = useCan('talents.cost');
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const roles = useQuery({ queryKey: qk.roles, queryFn: adminApi.roles, staleTime: Infinity });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<Values, unknown, Parsed>({
    resolver: zodResolver(AdminCreateTalentBody, { error: friendlyError }),
    defaultValues: defaults(talent),
  });

  const refresh = (t: Talent) => {
    qc.setQueryData(qk.talent(t.id), t);
    void qc.invalidateQueries({ queryKey: qk.talentsAll });
    void qc.invalidateQueries({ queryKey: qk.stats });
  };
  const save = useMutation({
    mutationFn: (v: Parsed) => adminApi.saveTalent(talent?.id ?? null, v),
    onSuccess: (t) => {
      refresh(t);
      if (talent) reset(defaults(t));
      else router.push(`/admin/talents/${t.id}`);
    },
  });
  const deactivate = useMutation({
    mutationFn: () => adminApi.deactivateTalent(talent!.id),
    onSuccess: () => {
      refresh({ ...talent!, is_active: false, availability: 'INACTIVE' });
      reset(defaults({ ...talent!, availability: 'INACTIVE' }));
      setConfirmDeactivate(false);
    },
  });

  const err = (name: keyof Values) => errors[name]?.message;
  const input = (
    name: keyof Values,
    label: string,
    props: ComponentProps<'input'> = {},
    options: RegisterOptions<Values> & { optional?: boolean; hint?: string } = {},
  ) => {
    const { optional, hint, ...reg } = options;
    return (
      <Field id={name} label={label} error={err(name)} optional={optional} hint={hint}>
        <Input
          id={name}
          {...describedBy(name, err(name), !!hint)}
          {...props}
          {...register(name, reg)}
        />
      </Field>
    );
  };
  const select = (
    name: keyof Values,
    label: string,
    options: { value: string; label: string }[],
  ) => (
    <Field id={name} label={label} error={err(name)}>
      <Select id={name} {...describedBy(name, err(name))} {...register(name)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
    </Field>
  );

  return (
    <form onSubmit={handleSubmit((v) => save.mutate(v))} noValidate className="space-y-5">
      <Panel title="Profile">
        <div className="grid gap-5 md:grid-cols-2">
          {input('full_name', 'Full name', { autoComplete: 'off' })}
          {input('email', 'Email', { type: 'email', autoComplete: 'off' })}
          {input('phone', 'Phone', { type: 'tel' })}
          {input('city', 'City', {}, { optional: true })}
        </div>
      </Panel>

      <Panel title="Role & skills">
        <div className="grid gap-5 md:grid-cols-2">
          {select('primary_role_slug', 'Primary role', [
            { value: '', label: roles.isPending ? 'Loading roles…' : 'Choose a role' },
            ...(roles.data ?? []).map((r) => ({ value: r.slug, label: r.title })),
          ])}
          {select('seniority', 'Seniority', seniorityOptions)}
          {input(
            'experience_years',
            'Experience (years)',
            { type: 'number', min: 0, max: 50, step: 0.5 },
            { setValueAs: toNumber },
          )}
          {select(
            'availability',
            'Availability',
            Object.entries(availabilityBadge).map(([value, b]) => ({ value, label: b.label })),
          )}
          <div className="md:col-span-2">
            {input(
              'skills',
              'Skills',
              {},
              {
                setValueAs: toList,
                optional: true,
                hint: 'Comma separated, e.g. React, Node.js, PostgreSQL',
              },
            )}
          </div>
          {canSeeCost &&
            input(
              'monthly_cost',
              'Monthly cost (PKR)',
              { type: 'number', min: 0, step: 1000 },
              { setValueAs: toNumber, optional: true, hint: 'Internal. Hidden from Sales.' },
            )}
        </div>
      </Panel>

      {(save.isError || deactivate.isError) && (
        <ErrorState error={save.error ?? deactivate.error} />
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={save.isPending || (!!talent && !isDirty)}>
          {save.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
          {talent ? 'Save changes' : 'Add talent'}
        </Button>
        {save.isSuccess && talent && !isDirty && (
          <p role="status" className="flex items-center gap-2 text-sm text-emerald-300">
            <CheckCircle2 className="size-4" aria-hidden="true" /> Saved
          </p>
        )}
        {talent?.is_active && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="ml-auto"
            disabled={deactivate.isPending}
            onClick={() => (confirmDeactivate ? deactivate.mutate() : setConfirmDeactivate(true))}
          >
            <UserX aria-hidden="true" />
            {confirmDeactivate ? 'Click again to deactivate' : 'Deactivate'}
          </Button>
        )}
      </div>
    </form>
  );
}
