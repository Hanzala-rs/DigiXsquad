import type { HireFormValues, StepIndex } from './schema';

export type UploadedFile = { key: string; name: string; size: number };
export type HireDraft = { step: StepIndex; values: HireFormValues; files: UploadedFile[] };

const KEY = 'ds_hire_draft';

/** Draft survives reloads within the tab (sessionStorage). Token and consent are never saved. */
export function loadDraft(): HireDraft | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw) as HireDraft;
    if (!draft || typeof draft !== 'object' || !draft.values) return null;
    return draft;
  } catch {
    return null;
  }
}

export function saveDraft(draft: HireDraft) {
  try {
    const values = { ...draft.values, turnstile_token: '', consent: false };
    sessionStorage.setItem(KEY, JSON.stringify({ ...draft, values }));
  } catch {
    // Storage full or blocked: the form still works, it just won't survive a reload.
  }
}

export function clearDraft() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
