'use client';

import { FileText, Loader2, Paperclip, X } from 'lucide-react';
import { useRef, useState, type Dispatch, type SetStateAction } from 'react';
import type { UploadedFile } from '@/lib/hire/draft';
import { ACCEPT, checkFile, formatBytes, MAX_BYTES, MAX_FILES, uploadFile } from '@/lib/uploads';

type Pending = { id: string; name: string; size: number };

/** Upload via presigned PUT. Parent owns the list of finished uploads. */
export function Attachments({
  files,
  onChange,
  onBusyChange,
}: {
  files: UploadedFile[];
  onChange: Dispatch<SetStateAction<UploadedFile[]>>;
  onBusyChange?: (busy: boolean) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Pending[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  async function handle(list: FileList | null) {
    if (!list?.length) return;
    const room = MAX_FILES - files.length - pending.length;
    const chosen = Array.from(list);
    const errs: string[] = [];
    if (chosen.length > room) errs.push(`You can attach up to ${MAX_FILES} files.`);
    const ok = chosen.slice(0, Math.max(0, room)).filter((f) => {
      const e = checkFile(f);
      if (e) errs.push(e);
      return !e;
    });
    setErrors(errs);
    if (input.current) input.current.value = '';
    if (!ok.length) return;

    const jobs = ok.map((f) => ({ file: f, id: crypto.randomUUID() }));
    setPending((p) => [
      ...p,
      ...jobs.map(({ file, id }) => ({ id, name: file.name, size: file.size })),
    ]);
    onBusyChange?.(true);
    await Promise.all(
      jobs.map(async ({ file, id }) => {
        try {
          const key = await uploadFile(file);
          onChange((prev) => [...prev, { key, name: file.name, size: file.size }]);
        } catch {
          setErrors((e) => [...e, `${file.name} could not be uploaded. Please try again.`]);
        } finally {
          setPending((p) => p.filter((x) => x.id !== id));
        }
      }),
    );
    onBusyChange?.(false);
  }

  const full = files.length + pending.length >= MAX_FILES;

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">
        Attachments <span className="text-muted-foreground">(optional)</span>
      </p>
      <p id="attachments-hint" className="text-xs text-muted-foreground">
        Terms of reference, job descriptions or RFQ documents. PDF, DOC or DOCX, up to{' '}
        {formatBytes(MAX_BYTES)} each, {MAX_FILES} files max.
      </p>
      <input
        ref={input}
        id="attachments"
        type="file"
        multiple
        accept={ACCEPT}
        className="sr-only"
        aria-describedby="attachments-hint"
        onChange={(e) => handle(e.target.files)}
        disabled={full}
      />
      <label
        htmlFor="attachments"
        className={
          full
            ? 'chamfer-sm flex items-center justify-center gap-2 bg-surface px-4 py-5 text-sm text-muted-foreground opacity-60'
            : 'chamfer-sm flex cursor-pointer items-center justify-center gap-2 bg-surface px-4 py-5 text-sm shadow-[inset_0_0_0_1px_var(--border)] transition-shadow hover:shadow-[inset_0_0_0_1px_var(--primary)] has-[+*:focus-visible]:shadow-[inset_0_0_0_2px_var(--primary)]'
        }
      >
        <Paperclip className="size-4 text-primary" aria-hidden="true" />
        {full ? 'File limit reached' : 'Choose files'}
      </label>

      {(files.length > 0 || pending.length > 0) && (
        <ul className="space-y-2" aria-live="polite">
          {files.map((f) => (
            <li key={f.key} className="flex items-center gap-3 bg-surface px-4 py-2.5 text-sm">
              <FileText className="size-4 shrink-0 text-primary" aria-hidden="true" />
              <span className="flex-1 truncate">{f.name}</span>
              <span className="text-muted-foreground">{formatBytes(f.size)}</span>
              <button
                type="button"
                onClick={() => onChange((prev) => prev.filter((x) => x.key !== f.key))}
                className="text-muted-foreground hover:text-foreground"
                aria-label={`Remove ${f.name}`}
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
          {pending.map((p) => (
            <li key={p.id} className="flex items-center gap-3 bg-surface px-4 py-2.5 text-sm">
              <Loader2 className="size-4 shrink-0 animate-spin text-primary" aria-hidden="true" />
              <span className="flex-1 truncate">{p.name}</span>
              <span className="text-muted-foreground">Uploading…</span>
            </li>
          ))}
        </ul>
      )}
      {errors.map((e) => (
        <p key={e} role="alert" className="text-sm text-[#ff8a80]">
          {e}
        </p>
      ))}
    </div>
  );
}
