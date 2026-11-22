import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';
import { LoginForm } from '@/components/admin/LoginForm';

export const metadata: Metadata = { title: 'Sign in' };

export default function AdminLoginPage() {
  return (
    <main id="main" className="relative grid min-h-svh place-items-center px-4 py-12">
      <div className="bg-grid pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Image src="/brand/logo.webp" alt="" width={64} height={56} priority />
          <h1 className="text-2xl font-bold uppercase">Admin sign in</h1>
          <p className="text-sm text-muted-foreground">DigixSquad staff only.</p>
        </div>
        <div className="chamfer edge-glow bg-card p-6 sm:p-8">
          <Suspense fallback={<div className="h-56 animate-pulse bg-surface" aria-hidden="true" />}>
            <LoginForm />
          </Suspense>
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            ← Back to website
          </Link>
        </p>
      </div>
    </main>
  );
}
