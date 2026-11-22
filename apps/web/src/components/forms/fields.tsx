import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/utils';

const control =
  'w-full bg-surface px-4 py-3 text-foreground placeholder:text-muted-foreground/70 shadow-[inset_0_0_0_1px_var(--border)] outline-none transition-shadow focus:shadow-[inset_0_0_0_1px_var(--primary),0_0_0_3px_rgb(255_106_0/0.2)] aria-[invalid=true]:shadow-[inset_0_0_0_1px_var(--destructive)]';

export function Field({
  id,
  label,
  error,
  hint,
  optional,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
        {optional && <span className="ml-1 text-muted-foreground">(optional)</span>}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-[#ff8a80]">
          {error}
        </p>
      )}
    </div>
  );
}

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cn(control, 'chamfer-sm', className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return <textarea className={cn(control, 'chamfer-sm min-h-36 resize-y', className)} {...props} />;
}

/** aria props wiring a control to its Field's error/hint. */
export function describedBy(id: string, error?: string, hint?: boolean) {
  return {
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? `${id}-error` : hint ? `${id}-hint` : undefined,
  } as const;
}
