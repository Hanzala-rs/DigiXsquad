import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        'flex items-center gap-2.5 font-heading text-lg font-bold tracking-[0.04em]',
        className,
      )}
    >
      <Image src="/brand/logo.webp" alt="" width={35} height={30} className="h-[30px] w-auto" />
      <span>
        Digix<span className="text-primary">Squad</span>
      </span>
    </Link>
  );
}
