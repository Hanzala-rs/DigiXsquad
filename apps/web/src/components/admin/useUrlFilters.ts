'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

/**
 * List filters live in the URL so views are shareable and survive reloads.
 * `set` merges a patch (empty value = remove) and resets paging unless `page` is in the patch.
 */
export function useUrlFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const set = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    if (!('page' in patch)) next.delete('page');
    const s = next.toString();
    router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
  };

  return {
    params,
    set,
    page: Math.max(1, Number(params.get('page')) || 1),
    setPage: (p: number) => set({ page: p > 1 ? String(p) : undefined }),
    /** The param's value only if it's one of `allowed`. */
    oneOf: <T extends string>(key: string, allowed: readonly T[]) => {
      const v = params.get(key);
      return allowed.includes(v as T) ? (v as T) : undefined;
    },
  };
}
