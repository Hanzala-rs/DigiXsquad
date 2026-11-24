'use client';

import { useQuery } from '@tanstack/react-query';
import { adminApi, qk } from '@/lib/admin/api';
import { availabilityBadge } from '@/lib/admin/format';
import { BackLink, Badge, ErrorState, PageHeader, Skeleton } from '../ui';
import { TalentForm } from './TalentForm';

/** Edit page: `id` = null renders the empty "add talent" form. */
export function TalentEditor({ id }: { id: string | null }) {
  const talent = useQuery({
    queryKey: qk.talent(id ?? ''),
    queryFn: () => adminApi.getTalent(id!),
    enabled: !!id,
  });

  if (!id)
    return (
      <>
        <BackLink href="/admin/talents">Talents</BackLink>
        <PageHeader title="Add talent" description="Add someone to the bench." />
        <TalentForm />
      </>
    );
  if (talent.isError) return <ErrorState error={talent.error} onRetry={() => talent.refetch()} />;
  if (!talent.data) return <Skeleton className="chamfer h-96" />;

  const t = talent.data;
  return (
    <>
      <BackLink href="/admin/talents">Talents</BackLink>
      <PageHeader
        title={t.full_name}
        description={`${t.primary_role.title} · ${t.experience_years} years`}
        actions={
          <Badge tone={availabilityBadge[t.availability].tone}>
            {availabilityBadge[t.availability].label}
          </Badge>
        }
      />
      {/* key: fresh form state when navigating to another talent */}
      <TalentForm key={t.id} talent={t} />
    </>
  );
}
