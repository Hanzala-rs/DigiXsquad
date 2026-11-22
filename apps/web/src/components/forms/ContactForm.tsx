'use client';

import { ApiError, createContactMessage } from '@digixsquad/api-client';
import { CreateContactMessageBody } from '@digixsquad/api-client/zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { Button } from '@/components/ui/button';
import { describedBy, Field, Input, Textarea } from './fields';
import { Turnstile } from './Turnstile';

type Values = z.input<typeof CreateContactMessageBody>;

// Contract schema + friendlier messages for the UI. Turnstile token is set programmatically.
const schema = CreateContactMessageBody.extend({
  turnstile_token: CreateContactMessageBody.shape.turnstile_token.min(
    1,
    'Please complete the check.',
  ),
});

export function ContactForm() {
  const [resetKey, setResetKey] = useState(0);
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: '',
      turnstile_token: '',
    },
  });

  const mutation = useMutation({
    mutationFn: (values: Values) =>
      createContactMessage({ ...values, phone: values.phone || undefined }),
    onSuccess: () => reset(),
    onSettled: () => setResetKey((k) => k + 1),
  });

  if (mutation.isSuccess) {
    return (
      <div role="status" className="chamfer edge-glow bg-card p-8 text-center">
        <CheckCircle2 className="mx-auto size-10 text-primary" aria-hidden="true" />
        <h2 className="mt-4 text-2xl font-bold uppercase">Message sent</h2>
        <p className="mt-2 text-muted-foreground">
          Thanks. Our team will reply within one working day.
        </p>
        <Button className="mt-6" variant="ghost" onClick={() => mutation.reset()}>
          Send another
        </Button>
      </div>
    );
  }

  const err = (k: keyof Values) => errors[k]?.message;
  const serverError =
    mutation.error instanceof ApiError
      ? mutation.error.status === 429
        ? 'Too many messages. Please wait a minute and try again.'
        : mutation.error.message
      : mutation.error
        ? 'Could not send your message. Check your connection and try again.'
        : null;

  return (
    <form noValidate onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="name" label="Full name" error={err('name')}>
          <Input
            id="name"
            autoComplete="name"
            {...register('name')}
            {...describedBy('name', err('name'))}
          />
        </Field>
        <Field id="email" label="Email" error={err('email')}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            {...register('email')}
            {...describedBy('email', err('email'))}
          />
        </Field>
        <Field id="phone" label="Phone" optional error={err('phone')}>
          <Input
            id="phone"
            type="tel"
            autoComplete="tel"
            {...register('phone')}
            {...describedBy('phone', err('phone'))}
          />
        </Field>
        <Field id="subject" label="Subject" error={err('subject')}>
          <Input
            id="subject"
            {...register('subject')}
            {...describedBy('subject', err('subject'))}
          />
        </Field>
      </div>
      <Field id="message" label="Message" error={err('message')}>
        <Textarea
          id="message"
          {...register('message')}
          {...describedBy('message', err('message'))}
        />
      </Field>

      <input type="hidden" {...register('turnstile_token')} />
      <Turnstile
        resetKey={resetKey}
        onToken={(t) => setValue('turnstile_token', t, { shouldValidate: !!t })}
      />
      {err('turnstile_token') && (
        <p role="alert" className="text-sm text-[#ff8a80]">
          {err('turnstile_token')}
        </p>
      )}

      {serverError && (
        <p role="alert" className="chamfer-sm bg-destructive/15 px-4 py-3 text-sm text-[#ff8a80]">
          {serverError}
        </p>
      )}

      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
        {mutation.isPending ? 'Sending…' : 'Send message'}
      </Button>
    </form>
  );
}
