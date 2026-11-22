'use client';

import { ApiError, createHireRequest, type ServiceRole, type Squad } from '@digixsquad/api-client';
import { CreateHireRequestResponse } from '@digixsquad/api-client/zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm, useWatch, type Resolver } from 'react-hook-form';
import { Checkbox } from '@/components/forms/fields';
import { Turnstile } from '@/components/forms/Turnstile';
import { Button } from '@/components/ui/button';
import { clearDraft, loadDraft, saveDraft, type UploadedFile } from '@/lib/hire/draft';
import {
  clean,
  defaultHireValues,
  friendlyError,
  HIRE_STEPS,
  LAST_STEP,
  prefillFromQuery,
  stepSchemas,
  toRequestBody,
  type HireFormValues,
  type StepIndex,
} from '@/lib/hire/schema';
import { Attachments } from './Attachments';
import { HireSuccess } from './HireSuccess';
import { Review } from './Review';
import {
  DetailsStep,
  EngagementStep,
  errorAt,
  NeedStep,
  OrgStep,
  ProjectStep,
  RolesStep,
} from './steps';

type Props = { squads: Squad[]; roles: ServiceRole[] };

/**
 * Start state: saved draft, then CTA prefill (?squad= / ?role= / ?org=) on top.
 * Safe to read sessionStorage here: useSearchParams makes this subtree client-rendered.
 */
function initialState(params: URLSearchParams, squads: Squad[], roles: ServiceRole[]) {
  const draft = typeof window === 'undefined' ? null : loadDraft();
  const prefill = prefillFromQuery(params, squads, new Set(roles.map((r) => r.slug)));
  const values: HireFormValues = { ...defaultHireValues(), ...draft?.values, ...prefill };
  const hasPrefill = Object.keys(prefill).length > 0;
  const step: StepIndex = hasPrefill ? (values.org_type ? 2 : 0) : (draft?.step ?? 0);
  return { values, step, files: draft?.files ?? [] };
}

export function HireWizard({ squads, roles }: Props) {
  const params = useSearchParams();
  const [init] = useState(() => initialState(new URLSearchParams(params), squads, roles));
  const [step, setStepState] = useState<StepIndex>(init.step);
  const stepRef = useRef<StepIndex>(init.step);
  const [files, setFiles] = useState<UploadedFile[]>(init.files);
  const [uploading, setUploading] = useState(false);
  const [turnstileReset, setTurnstileReset] = useState(0);
  const [done, setDone] = useState<{ refNo: string; email: string } | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);

  // Validates only the current step's slice of the contract (plus its business rules).
  const resolver = useCallback<Resolver<HireFormValues>>(
    (values, ctx, opts) =>
      zodResolver(stepSchemas[stepRef.current] as never, { error: friendlyError }, { raw: true })(
        clean(values) as never,
        ctx,
        opts as never,
      ) as never,
    [],
  );
  const form = useForm<HireFormValues>({
    resolver,
    mode: 'onTouched',
    defaultValues: init.values,
  });

  const setStep = (s: StepIndex) => {
    stepRef.current = s;
    moved.current = true;
    form.clearErrors();
    setStepState(s);
  };

  // Save draft on every change.
  const values = useWatch({ control: form.control }) as HireFormValues;
  useEffect(() => {
    if (!done) saveDraft({ step, values, files });
  }, [done, step, values, files]);

  // Move focus to the step heading after navigation (not on first load).
  useEffect(() => {
    if (!moved.current) return;
    heading.current?.focus();
    heading.current?.scrollIntoView?.({ block: 'start', behavior: 'smooth' });
  }, [step]);

  const mutation = useMutation({
    mutationFn: async (v: HireFormValues) => {
      const res = await createHireRequest(
        toRequestBody(
          v,
          files.map((f) => f.key),
        ),
      );
      return CreateHireRequestResponse.parse(res.data);
    },
    onSuccess: (data, v) => {
      clearDraft();
      setDone({ refNo: data.ref_no, email: v.contact.email });
    },
    onError: () => {
      form.setValue('turnstile_token', '');
      setTurnstileReset((k) => k + 1);
    },
  });

  async function next() {
    if (await form.trigger()) setStep(Math.min(step + 1, LAST_STEP) as StepIndex);
  }

  if (done) return <HireSuccess refNo={done.refNo} email={done.email} />;

  const err = (p: string) => errorAt(form.formState.errors, p);
  const current = HIRE_STEPS[step];
  const progress = ((step + 1) / HIRE_STEPS.length) * 100;
  const serverError =
    mutation.error instanceof ApiError
      ? mutation.error.status === 429
        ? 'Too many requests from your network. Please wait a minute and try again.'
        : mutation.error.status === 422
          ? 'Some details were not accepted. Please review the form and try again.'
          : mutation.error.message
      : mutation.error
        ? 'Could not submit your request. Check your connection and try again.'
        : null;

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (step < LAST_STEP) void next();
        else void form.handleSubmit((v) => mutation.mutate(v))();
      }}
      className="space-y-8"
    >
      <div className="space-y-3">
        <div className="flex items-baseline justify-between gap-4 font-heading text-xs font-semibold tracking-[0.2em] uppercase">
          <span className="text-primary">
            Step {step + 1} of {HIRE_STEPS.length}
          </span>
          <span className="text-muted-foreground max-sm:hidden">
            {step < LAST_STEP ? `Next: ${HIRE_STEPS[step + 1]!.title}` : 'Almost done'}
          </span>
        </div>
        <div
          className="h-1.5 bg-accent"
          role="progressbar"
          aria-label="Form progress"
          aria-valuemin={1}
          aria-valuemax={HIRE_STEPS.length}
          aria-valuenow={step + 1}
        >
          <div
            className="h-full bg-[linear-gradient(90deg,var(--deep),var(--glow))] transition-[width] duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <ol className="hidden grid-cols-7 gap-2 text-[11px] text-muted-foreground lg:grid">
          {HIRE_STEPS.map((s, i) => (
            <li
              key={s.id}
              aria-current={i === step ? 'step' : undefined}
              className={i === step ? 'text-foreground' : i < step ? 'text-primary' : ''}
            >
              {s.title}
            </li>
          ))}
        </ol>
      </div>

      <h2
        ref={heading}
        tabIndex={-1}
        className="scroll-mt-28 text-2xl font-bold uppercase outline-none md:text-3xl"
      >
        {current.title}
      </h2>

      {step === 0 && <OrgStep form={form} />}
      {step === 1 && <NeedStep form={form} squads={squads} />}
      {step === 2 && <RolesStep form={form} roles={roles} squads={squads} />}
      {step === 3 && <EngagementStep form={form} />}
      {step === 4 && <DetailsStep form={form} />}
      {step === 5 && (
        <ProjectStep
          form={form}
          attachments={
            <Attachments files={files} onChange={setFiles} onBusyChange={setUploading} />
          }
        />
      )}
      {step === 6 && (
        <div className="space-y-6">
          <Review
            values={form.getValues()}
            files={files}
            roles={roles}
            squads={squads}
            onEdit={setStep}
          />
          <Checkbox
            id="consent"
            error={err('consent')}
            label={
              <>
                I agree that DigixSquad may use these details to respond to my request, as described
                in the{' '}
                <Link href="/privacy" target="_blank" className="text-primary underline">
                  privacy policy
                </Link>
                .
              </>
            }
            {...form.register('consent')}
          />
          <input type="hidden" {...form.register('turnstile_token')} />
          <Turnstile
            resetKey={turnstileReset}
            onToken={(t) => form.setValue('turnstile_token', t, { shouldValidate: !!t })}
          />
          {err('turnstile_token') && (
            <p role="alert" className="text-sm text-[#ff8a80]">
              Please complete the security check.
            </p>
          )}
          {serverError && (
            <p
              role="alert"
              className="chamfer-sm bg-destructive/15 px-4 py-3 text-sm text-[#ff8a80]"
            >
              {serverError}
            </p>
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 border-t border-border pt-6">
        {step > 0 ? (
          <Button type="button" variant="ghost" onClick={() => setStep((step - 1) as StepIndex)}>
            <ArrowLeft aria-hidden="true" /> Back
          </Button>
        ) : (
          <span />
        )}
        {step < LAST_STEP ? (
          <Button type="submit" disabled={uploading}>
            {uploading ? 'Uploading…' : 'Continue'} <ArrowRight aria-hidden="true" />
          </Button>
        ) : (
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
            {mutation.isPending ? 'Submitting…' : 'Submit request'}
          </Button>
        )}
      </div>
    </form>
  );
}
