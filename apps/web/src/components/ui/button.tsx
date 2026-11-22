import { Slot } from '@/components/ui/slot';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';

/** Chamfered brand button (prototype `.btn.primary` / `.btn.ghost`). */
export const buttonVariants = cva(
  'chamfer inline-flex items-center justify-center gap-2 font-heading font-semibold uppercase tracking-[0.1em] whitespace-nowrap transition-[transform,box-shadow,filter,background-color] duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary:
          'bg-[linear-gradient(135deg,var(--glow),var(--primary)_50%,var(--deep))] text-primary-foreground hover:-translate-y-0.5 hover:brightness-110',
        ghost:
          'bg-surface/75 text-foreground shadow-[inset_0_0_0_1px_rgb(255_106_0/0.6)] backdrop-blur-md hover:shadow-[inset_0_0_0_1px_var(--glow),0_0_18px_rgb(255_106_0/0.35)]',
        link: 'text-primary underline-offset-4 hover:underline [clip-path:none]',
      },
      size: {
        sm: 'chamfer-sm px-[18px] py-2.5 text-xs',
        md: 'px-[26px] py-3.5 text-sm',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

type ButtonProps = ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    /** Render the single child (e.g. next/link) with button styles. */
    asChild?: boolean;
  };

export function Button({ className, variant, size, asChild, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button';
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
