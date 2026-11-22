'use client';

import { ApiError, login } from '@digixsquad/api-client';
import { LoginBody } from '@digixsquad/api-client/zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, LogIn } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { describedBy, Field, Input } from '@/components/forms/fields';
import { Button } from '@/components/ui/button';
import { AuthUser } from '@/lib/admin/schemas';
import { ME_KEY } from '@/lib/admin/session';
import { friendlyError } from '@/lib/hire/schema';

type Values = z.input<typeof LoginBody>;

/** Only same-app admin paths are allowed as a post-login redirect (no open redirect). */
export function safeNext(next: string | null): string {
  if (
    !next ||
    !next.startsWith('/admin') ||
    next.startsWith('//') ||
    next.startsWith('/admin/login')
  )
    return '/admin';
  return next;
}

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const qc = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(LoginBody, { error: friendlyError }),
    defaultValues: { email: '', password: '' },
  });

  const mutation = useMutation({
    mutationFn: async (v: Values) => AuthUser.parse((await login(v)).data),
    onSuccess: (user) => {
      qc.setQueryData(ME_KEY, user);
      router.replace(safeNext(params.get('next')));
    },
  });

  const error =
    mutation.error instanceof ApiError
      ? mutation.error.status === 401
        ? 'Wrong email or password.'
        : mutation.error.status === 429
          ? 'Too many attempts. Please wait a minute and try again.'
          : mutation.error.message
      : mutation.error
        ? 'Could not reach the server. Check your connection.'
        : null;

  return (
    <form noValidate onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-5">
      <Field id="email" label="Email" error={errors.email?.message}>
        <Input
          id="email"
          type="email"
          autoComplete="username"
          autoFocus
          {...register('email')}
          {...describedBy('email', errors.email?.message)}
        />
      </Field>
      <Field id="password" label="Password" error={errors.password?.message}>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          {...register('password')}
          {...describedBy('password', errors.password?.message)}
        />
      </Field>
      {error && (
        <p role="alert" className="chamfer-sm bg-destructive/15 px-4 py-3 text-sm text-[#ff8a80]">
          {error}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={mutation.isPending}>
        {mutation.isPending ? (
          <Loader2 className="animate-spin" aria-hidden="true" />
        ) : (
          <LogIn aria-hidden="true" />
        )}
        Sign in
      </Button>
    </form>
  );
}
