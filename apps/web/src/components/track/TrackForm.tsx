'use client';

import { ApiError, trackHireRequest } from '@digixsquad/api-client';
import {
  trackHireRequestQueryRefRegExp,
  TrackHireRequestQueryParams,
  TrackHireRequestResponse,
} from '@digixsquad/api-client/zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Loader2, Search } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { describedBy, Field, Input } from '@/components/forms/fields';
import { Button } from '@/components/ui/button';
import { requestStatusLabels } from '@/content/labels';
import { friendlyError } from '@/lib/hire/schema';
import { cn } from '@/lib/utils';

type Values = z.input<typeof TrackHireRequestQueryParams>;
type Result = z.output<typeof TrackHireRequestResponse>;

// Same rules as the contract, with a format hint instead of a generic regex message.
const schema = TrackHireRequestQueryParams.extend({
  ref: z.string().regex(trackHireRequestQueryRefRegExp, 'Use the format DS-2026-0001.'),
});

const fmt = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });

export function TrackForm() {
  const params = useSearchParams();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema, { error: friendlyError }),
    // Only the reference comes from the URL; the email is never put in a link.
    defaultValues: { ref: (params.get('ref') ?? '').toUpperCase(), email: '' },
  });

  const mutation = useMutation({
    mutationFn: async (v: Values) => {
      const res = await trackHireRequest({
        ref: v.ref.trim().toUpperCase(),
        email: v.email.trim(),
      });
      return TrackHireRequestResponse.parse(res.data);
    },
  });

  const error =
    mutation.error instanceof ApiError
      ? mutation.error.status === 404
        ? 'No request matches that reference number and email. Check both and try again.'
        : mutation.error.status === 429
          ? 'Too many lookups. Please wait a minute and try again.'
          : mutation.error.message
      : mutation.error
        ? 'Could not look up your request. Check your connection and try again.'
        : null;

  return (
    <div className="space-y-8">
      <form
        noValidate
        onSubmit={handleSubmit((v) => mutation.mutate(v))}
        className="grid gap-5 sm:grid-cols-[1fr_1.3fr_auto] sm:items-start"
      >
        <Field id="ref" label="Reference number" error={errors.ref?.message}>
          <Input
            id="ref"
            placeholder="DS-2026-0001"
            autoCapitalize="characters"
            spellCheck={false}
            {...register('ref', { setValueAs: (v: string) => v.trim().toUpperCase() })}
            {...describedBy('ref', errors.ref?.message)}
          />
        </Field>
        <Field id="email" label="Email used in the request" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            {...register('email', { setValueAs: (v: string) => v.trim() })}
            {...describedBy('email', errors.email?.message)}
          />
        </Field>
        <Button type="submit" className="sm:mt-7" disabled={mutation.isPending}>
          {mutation.isPending ? (
            <Loader2 className="animate-spin" aria-hidden="true" />
          ) : (
            <Search aria-hidden="true" />
          )}
          Track
        </Button>
      </form>

      {error && (
        <p role="alert" className="chamfer-sm bg-destructive/15 px-4 py-3 text-sm text-[#ff8a80]">
          {error}
        </p>
      )}
      {mutation.data && <TrackResult result={mutation.data} />}
    </div>
  );
}

function TrackResult({ result }: { result: Result }) {
  const status = requestStatusLabels[result.status];
  const timeline = [...result.timeline].sort((a, b) => b.at.localeCompare(a.at));
  return (
    <section
      aria-live="polite"
      aria-labelledby="track-result"
      className="chamfer edge-glow bg-card p-6 md:p-8"
    >
      <p className="font-heading text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
        {result.ref_no}
      </p>
      <h2 id="track-result" className="mt-2 text-3xl font-bold uppercase">
        <span className="text-brand-gradient">{status.label}</span>
      </h2>
      <p className="mt-2 text-muted-foreground">{status.description}</p>
      <p className="mt-1 text-xs text-muted-foreground">Last updated {fmt(result.updated_at)}</p>

      {timeline.length > 0 && (
        <ol className="mt-8 space-y-0 border-l border-border pl-6">
          {timeline.map((t, i) => (
            <li key={`${t.status}-${t.at}`} className="relative pb-6 last:pb-0">
              <span
                aria-hidden="true"
                className={cn(
                  'absolute top-1 -left-[29px] size-2.5',
                  i === 0 ? 'bg-primary shadow-[0_0_10px_var(--primary)]' : 'bg-accent',
                )}
              />
              <p className={cn('font-semibold', i !== 0 && 'text-muted-foreground')}>
                {requestStatusLabels[t.status].label}
              </p>
              <p className="text-xs text-muted-foreground">{fmt(t.at)}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
