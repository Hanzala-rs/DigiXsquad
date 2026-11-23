import { Slot } from '@/components/ui/slot';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';

// Shared hover/press: light sweep (`.btn-fx` in globals.css), lift, icon nudge, press-in.
const fx =
  'btn-fx hover:-translate-y-0.5 hover:[&_svg:last-child]:translate-x-0.5 active:translate-y-0 active:scale-[0.98]';

/** Chamfered brand button (prototype `.btn.primary` / `.btn.ghost`). */
export const buttonVariants = cva(
  'chamfer inline-flex items-center justify-center gap-2 font-heading font-semibold uppercase tracking-[0.1em] whitespace-nowrap transition-[transform,box-shadow,filter,background-color] duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:transition-transform [&_svg]:duration-200',
  {
    variants: {
      variant: {
        primary: `${fx} bg-[linear-gradient(135deg,var(--glow),var(--primary)_50%,var(--deep))] text-primary-foreground hover:brightness-110 hover:shadow-[inset_0_0_0_1px_rgb(255_255_255/0.35)]`,
        ghost: `${fx} bg-surface/75 text-foreground shadow-[inset_0_0_0_1px_rgb(255_106_0/0.6)] backdrop-blur-md hover:bg-primary/10 hover:shadow-[inset_0_0_0_1px_var(--glow),inset_0_0_18px_rgb(255_106_0/0.25)]`,
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
