import type { TeamMember } from '@digixsquad/api-client';
import { UserRound } from 'lucide-react';
import Image from 'next/image';

/** "Jane Doe Khan" → "JD". */
export function teamInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('');
}

/**
 * Chamfered portrait frame: transparent cut-out photo standing on a dark radial orange glow,
 * or a silhouette + initials placeholder when the member has no photo yet.
 */
export function TeamPortrait({ member }: { member: TeamMember }) {
  const alt = `${member.name}, ${member.title}`;
  const external = member.photo_url ? /^https?:\/\//.test(member.photo_url) : false;

  return (
    // clip-path cuts outer box-shadows, so the hover glow is a drop-shadow on this wrapper.
    <div className="group/portrait mx-auto w-full max-w-md transition-[filter] duration-500 hover:drop-shadow-[0_0_28px_rgb(255_106_0/0.35)]">
      <div className="chamfer edge-glow relative aspect-[4/5] w-full overflow-hidden bg-card before:z-10">
        {/* glow floor + grid */}
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_95%,rgb(255_106_0/0.5),rgb(232_68_15/0.16)_38%,transparent_70%)]"
          aria-hidden="true"
        />
        <div className="bg-grid pointer-events-none absolute inset-0" aria-hidden="true" />
        <div
          className="pointer-events-none absolute inset-x-8 bottom-0 h-px bg-gradient-to-r from-transparent via-glow to-transparent"
          aria-hidden="true"
        />

        {member.photo_url ? (
          <Image
            src={member.photo_url}
            alt={alt}
            fill
            sizes="(min-width: 820px) 28rem, 90vw"
            unoptimized={external}
            className="object-contain object-bottom drop-shadow-[0_0_24px_rgb(255_106_0/0.25)] transition-transform duration-700 ease-brand group-hover/portrait:scale-[1.03]"
          />
        ) : (
          <div role="img" aria-label={alt} className="absolute inset-0 grid place-items-center">
            <div className="flex flex-col items-center gap-4">
              <UserRound
                aria-hidden="true"
                strokeWidth={1}
                className="size-36 text-muted-foreground/50 md:size-44"
              />
              <span
                aria-hidden="true"
                className="chamfer-sm bg-background/80 px-4 py-1.5 font-heading text-3xl font-bold tracking-[0.2em] text-primary shadow-[inset_0_0_0_1px_rgb(255_106_0/0.4)]"
              >
                {teamInitials(member.name)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
