import 'server-only';
import type { ZodType } from 'zod';

export const REVALIDATE_SECONDS = 300;
const TIMEOUT_MS = 3000;

/** Fetch options for server-side reads: ISR cache + short timeout so builds never hang on the API. */
export const serverFetchOptions = () => ({
  next: { revalidate: REVALIDATE_SECONDS },
  signal: AbortSignal.timeout(TIMEOUT_MS),
});

/**
 * Call a generated api-client function; validate with the contract's Zod schema and fall back to
 * seed data when the API is unreachable or returns something off-contract.
 */
export async function withFallback<T>(
  label: string,
  call: () => Promise<{ data: unknown }>,
  schema: ZodType<T>,
  fallback: () => T,
): Promise<T> {
  try {
    const res = await call();
    const parsed = schema.safeParse(res.data);
    if (parsed.success) return parsed.data;
    console.warn(`[${label}] API response did not match the contract, using seed`);
  } catch {
    // API unreachable: expected until apps/api ships.
  }
  return fallback();
}
