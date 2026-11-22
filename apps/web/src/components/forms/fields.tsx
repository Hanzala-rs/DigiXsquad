import { Check, ChevronDown } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/utils';

const control =
  'w-full bg-surface px-4 py-3 text-foreground placeholder:text-muted-foreground/70 shadow-[inset_0_0_0_1px_var(--border)] outline-none transition-shadow focus:shadow-[inset_0_0_0_1px_var(--primary),0_0_0_3px_rgb(255_106_0/0.2)] aria-[invalid=true]:shadow-[inset_0_0_0_1px_var(--destructive)]';

export function FieldError({ id, children }: { id?: string; children?: ReactNode }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="text-sm text-[#ff8a80]">
      {children}
    </p>
  );
}

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
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </div>
  );
}

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cn(control, 'chamfer-sm', className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return <textarea className={cn(control, 'chamfer-sm min-h-36 resize-y', className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentProps<'select'>) {
  return (
    <div className="relative">
      <select className={cn(control, 'chamfer-sm appearance-none pr-10', className)} {...props}>
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-primary"
      />
    </div>
  );
}

/** aria props wiring a control to its Field's error/hint. */
export function describedBy(id: string, error?: string, hint?: boolean) {
  return {
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? `${id}-error` : hint ? `${id}-hint` : undefined,
  } as const;
}

/**
 * Radio group rendered as chamfered cards. Native radios underneath, so keyboard
 * (arrow keys) and screen readers work as usual.
 */
export function ChoiceCards<T extends string>({
  name,
  legend,
  options,
  value,
  onChange,
  error,
  columns = 2,
}: {
  name: string;
  legend: string;
  options: { value: T; label: string; hint?: string }[];
  value?: T;
  onChange: (value: T) => void;
  error?: string;
  columns?: 2 | 3;
}) {
  const errorId = `${name}-error`;
  return (
    <fieldset aria-describedby={error ? errorId : undefined} className="space-y-3">
      <legend className="mb-3 text-sm font-medium">{legend}</legend>
      <div className={cn('grid gap-3', columns === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2')}>
        {options.map((o) => {
          const checked = value === o.value;
          return (
            <label
              key={o.value}
              className={cn(
                'chamfer relative flex cursor-pointer items-start gap-3 bg-surface p-4 transition-shadow has-[:focus-visible]:shadow-[inset_0_0_0_2px_var(--primary)]',
                checked
                  ? 'shadow-[inset_0_0_0_1px_var(--primary),0_0_22px_rgb(255_106_0/0.18)]'
                  : 'shadow-[inset_0_0_0_1px_var(--border)] hover:shadow-[inset_0_0_0_1px_rgb(255_106_0/0.5)]',
              )}
            >
              <input
                type="radio"
                name={name}
                value={o.value}
                checked={checked}
                onChange={() => onChange(o.value)}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className={cn(
                  'mt-0.5 grid size-5 shrink-0 place-items-center',
                  checked
                    ? 'bg-primary text-primary-foreground'
                    : 'shadow-[inset_0_0_0_1px_var(--border)]',
                )}
              >
                {checked && <Check className="size-3.5" strokeWidth={3} />}
              </span>
              <span>
                <span className="block font-heading font-semibold">{o.label}</span>
                {o.hint && (
                  <span className="mt-1 block text-sm text-muted-foreground">{o.hint}</span>
                )}
              </span>
            </label>
          );
        })}
      </div>
      <FieldError id={errorId}>{error}</FieldError>
    </fieldset>
  );
}

export function Checkbox({
  id,
  label,
  error,
  ...props
}: { id: string; label: ReactNode; error?: string } & ComponentProps<'input'>) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3 text-sm">
        <input
          id={id}
          type="checkbox"
          className="mt-0.5 size-5 shrink-0 accent-primary"
          {...describedBy(id, error)}
          {...props}
        />
        <span>{label}</span>
      </label>
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </div>
  );
}
