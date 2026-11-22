'use client';

import { CheckCircle2, Copy } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

export function HireSuccess({ refNo, email }: { refNo: string; email: string }) {
  const heading = useRef<HTMLHeadingElement>(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => heading.current?.focus(), []);

  return (
    <div className="chamfer edge-glow bg-card p-8 text-center md:p-12" role="status">
      <CheckCircle2 className="mx-auto size-12 text-primary" aria-hidden="true" />
      <h2 ref={heading} tabIndex={-1} className="mt-5 text-3xl font-bold uppercase outline-none">
        Request received
      </h2>
      <p className="mt-3 text-muted-foreground">Your reference number</p>
      <div className="mt-2 flex items-center justify-center gap-3">
        <span className="text-brand-gradient font-heading text-4xl font-bold tracking-wider">
          {refNo}
        </span>
        <button
          type="button"
          onClick={() =>
            navigator.clipboard?.writeText(refNo).then(
              () => setCopied(true),
              () => setCopied(false),
            )
          }
          className="text-muted-foreground hover:text-foreground"
          aria-label="Copy reference number"
        >
          <Copy className="size-5" />
        </button>
      </div>
      <p className="mt-1 h-5 text-xs text-primary" aria-live="polite">
        {copied ? 'Copied' : ''}
      </p>
      <p className="mx-auto mt-4 max-w-md text-muted-foreground">
        We sent a confirmation to <strong className="text-foreground">{email}</strong>. Our team
        will contact you within one working day with matched profiles.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href={`/track?ref=${encodeURIComponent(refNo)}`}>Track this request</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </div>
  );
}
