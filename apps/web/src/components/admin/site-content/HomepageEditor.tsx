'use client';

import { adminUpdateSiteContent, getSiteContent, type SiteContent } from '@digixsquad/api-client';
import { AdminUpdateSiteContentResponse, GetSiteContentResponse } from '@digixsquad/api-client/zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, CheckCircle2, Loader2, Plus, Trash2 } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import {
  useFieldArray,
  useForm,
  type FieldArray,
  type FieldArrayPath,
  type Path,
  type UseFormReturn,
} from 'react-hook-form';
import { describedBy, Field, Input, Textarea } from '@/components/forms/fields';
import { Button } from '@/components/ui/button';
import { authed } from '@/lib/admin/session';
import { friendlyError } from '@/lib/hire/schema';
import { useCan } from '../AdminSession';
import { EmptyState, ErrorState, PageHeader, Panel, Skeleton } from '../ui';
import {
  emptyToUndefined,
  HomepageSchema,
  homepageDefaults,
  mergeHomepage,
  toInt,
  type HomepageParsed,
  type HomepageValues,
} from './homepage-schema';

export const siteContentKey = ['admin', 'site-content'] as const;

const fetchSiteContent = async () =>
  GetSiteContentResponse.parse((await getSiteContent({ cache: 'no-store' })).data);
const saveSiteContent = async (body: SiteContent) =>
  AdminUpdateSiteContentResponse.parse((await authed(() => adminUpdateSiteContent(body))).data);

/** /admin/site-content: edits the home-page fields of site content (SUPER_ADMIN). */
export function HomepageEditor() {
  const allowed = useCan('content.manage');
  const content = useQuery({
    queryKey: siteContentKey,
    queryFn: fetchSiteContent,
    enabled: allowed,
  });

  const header = (
    <PageHeader
      title="Homepage"
      description="Founder, services, team, project counters and sponsors on the home page. Changes show on the site within about 5 minutes."
    />
  );
  if (!allowed)
    return (
      <>
        {header}
        <Panel>
          <EmptyState title="Only a super admin can edit the homepage." />
        </Panel>
      </>
    );
  if (content.isError)
    return (
      <>
        {header}
        <ErrorState error={content.error} onRetry={() => content.refetch()} />
      </>
    );
  if (!content.data) return <Skeleton className="chamfer h-96" />;
  return (
    <>
      {header}
      <HomepageForm content={content.data} />
    </>
  );
}

type Form = UseFormReturn<HomepageValues, unknown, HomepageParsed>;

function HomepageForm({ content }: { content: SiteContent }) {
  const qc = useQueryClient();
  const form: Form = useForm<HomepageValues, unknown, HomepageParsed>({
    resolver: zodResolver(HomepageSchema, { error: friendlyError }),
    defaultValues: homepageDefaults(content),
  });
  const {
    handleSubmit,
    reset,
    formState: { isDirty },
  } = form;

  const save = useMutation({
    // Always merge into the latest copy so fields edited elsewhere aren't overwritten.
    mutationFn: (v: HomepageParsed) =>
      saveSiteContent(mergeHomepage(qc.getQueryData<SiteContent>(siteContentKey) ?? content, v)),
    onSuccess: (saved) => {
      qc.setQueryData(siteContentKey, saved);
      reset(homepageDefaults(saved));
    },
  });

  return (
    <form onSubmit={handleSubmit((v) => save.mutate(v))} noValidate className="space-y-5">
      <Panel title="Founder">
        <div className="grid gap-5 md:grid-cols-2">
          <TextField form={form} name="founder.name" label="Name" />
          <TextField form={form} name="founder.title" label="Title" />
          <div className="md:col-span-2">
            <TextField
              form={form}
              name="founder.portrait_alt"
              label="Portrait alt text"
              optional
              hint="Describes the hero portrait for screen readers."
            />
          </div>
        </div>
      </Panel>

      <ListPanel
        form={form}
        name="what_we_do"
        title="What we do"
        itemLabel="Service"
        empty={{ title: '', description: '', icon: undefined }}
        render={(i) => (
          <div className="grid gap-4 md:grid-cols-2">
            <TextField form={form} name={`what_we_do.${i}.title`} label="Title" />
            <TextField
              form={form}
              name={`what_we_do.${i}.icon`}
              label="Icon"
              optional
              hint="Lucide icon name, e.g. users, landmark, rocket."
            />
            <div className="md:col-span-2">
              <TextField
                form={form}
                name={`what_we_do.${i}.description`}
                label="Description"
                multiline
              />
            </div>
          </div>
        )}
      />

      <ListPanel
        form={form}
        name="team"
        title="Team"
        itemLabel="Team member"
        reorder
        empty={{ name: '', title: '', bio: undefined, photo_url: undefined }}
        render={(i) => (
          <div className="grid gap-4 md:grid-cols-2">
            <TextField form={form} name={`team.${i}.name`} label="Name" />
            <TextField form={form} name={`team.${i}.title`} label="Title" />
            <div className="md:col-span-2">
              <TextField
                form={form}
                name={`team.${i}.photo_url`}
                label="Photo URL"
                optional
                hint="A site path such as /brand/founder-portrait.webp, or a full https:// URL."
              />
            </div>
            <div className="md:col-span-2">
              <TextField form={form} name={`team.${i}.bio`} label="Bio" optional multiline />
            </div>
          </div>
        )}
      />

      <ListPanel
        form={form}
        name="projects"
        title="Project counters"
        itemLabel="Counter"
        empty={{ label: '', value: 0, suffix: undefined }}
        render={(i) => (
          <div className="grid gap-4 md:grid-cols-[2fr_1fr_1fr]">
            <TextField form={form} name={`projects.${i}.label`} label="Label" />
            <TextField
              form={form}
              name={`projects.${i}.value`}
              label="Value"
              input={{ type: 'number', min: 0, step: 1, inputMode: 'numeric' }}
              setValueAs={toInt}
            />
            <TextField
              form={form}
              name={`projects.${i}.suffix`}
              label="Suffix"
              optional
              hint='e.g. "+"'
            />
          </div>
        )}
      />

      <ListPanel
        form={form}
        name="sponsors"
        title="Sponsors"
        itemLabel="Sponsor"
        empty={{ name: '', logo_url: undefined, url: undefined }}
        render={(i) => (
          <div className="grid gap-4 md:grid-cols-3">
            <TextField form={form} name={`sponsors.${i}.name`} label="Name" />
            <TextField
              form={form}
              name={`sponsors.${i}.logo_url`}
              label="Logo URL"
              optional
              hint="Shown instead of the name when set."
            />
            <TextField
              form={form}
              name={`sponsors.${i}.url`}
              label="Website"
              optional
              input={{ type: 'url', placeholder: 'https://' }}
            />
          </div>
        )}
      />

      {save.isError && <ErrorState error={save.error} />}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={save.isPending || !isDirty}>
          {save.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
          Save changes
        </Button>
        {save.isSuccess && !isDirty && (
          <p role="status" className="flex items-center gap-2 text-sm text-emerald-300">
            <CheckCircle2 className="size-4" aria-hidden="true" /> Saved
          </p>
        )}
      </div>
    </form>
  );
}

function TextField({
  form,
  name,
  label,
  optional,
  hint,
  multiline,
  input,
  setValueAs = emptyToUndefined,
}: {
  form: Form;
  name: Path<HomepageValues>;
  label: string;
  optional?: boolean;
  hint?: string;
  multiline?: boolean;
  input?: ComponentProps<'input'>;
  setValueAs?: (v: unknown) => unknown;
}) {
  const id = `hp-${name.replace(/\./g, '-')}`;
  const error = form.getFieldState(name, form.formState).error?.message;
  // Required strings keep "" (so the blank check reports it); optional ones become undefined.
  const reg = form.register(name, optional || input?.type === 'number' ? { setValueAs } : {});
  return (
    <Field id={id} label={label} error={error} optional={optional} hint={hint}>
      {multiline ? (
        <Textarea id={id} className="min-h-24" {...describedBy(id, error, !!hint)} {...reg} />
      ) : (
        <Input id={id} {...describedBy(id, error, !!hint)} {...input} {...reg} />
      )}
    </Field>
  );
}

type ListName = FieldArrayPath<HomepageValues>;

function ListPanel<N extends ListName>({
  form,
  name,
  title,
  itemLabel,
  empty,
  reorder,
  render,
}: {
  form: Form;
  name: N;
  title: string;
  itemLabel: string;
  empty: FieldArray<HomepageValues, N>;
  reorder?: boolean;
  render: (index: number) => ReactNode;
}) {
  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name,
  });
  const iconBtn =
    'chamfer-sm grid size-8 place-items-center bg-card text-muted-foreground shadow-[inset_0_0_0_1px_var(--border)] hover:text-foreground disabled:opacity-40';
  return (
    <Panel
      title={title}
      actions={
        <Button type="button" variant="ghost" size="sm" onClick={() => append(empty)}>
          <Plus aria-hidden="true" /> Add {itemLabel.toLowerCase()}
        </Button>
      }
    >
      {fields.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing here yet.</p>
      ) : (
        <ol className="space-y-4">
          {fields.map((f, i) => {
            const legend = `${itemLabel} ${i + 1}`;
            return (
              <li key={f.id}>
                <fieldset className="chamfer relative bg-surface p-4 shadow-[inset_0_0_0_1px_var(--border)]">
                  <legend className="float-left mb-3 flex h-8 items-center font-heading text-sm font-semibold">
                    {legend}
                  </legend>
                  <div className="absolute top-4 right-4 flex items-center gap-1.5">
                    {reorder && (
                      <>
                        <button
                          type="button"
                          className={iconBtn}
                          aria-label={`Move ${legend} up`}
                          disabled={i === 0}
                          onClick={() => move(i, i - 1)}
                        >
                          <ArrowUp className="size-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className={iconBtn}
                          aria-label={`Move ${legend} down`}
                          disabled={i === fields.length - 1}
                          onClick={() => move(i, i + 1)}
                        >
                          <ArrowDown className="size-4" aria-hidden="true" />
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      className={iconBtn}
                      aria-label={`Remove ${legend}`}
                      onClick={() => remove(i)}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="clear-both">{render(i)}</div>
                </fieldset>
              </li>
            );
          })}
        </ol>
      )}
    </Panel>
  );
}
