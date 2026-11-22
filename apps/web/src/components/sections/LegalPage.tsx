import type { LegalDoc } from '@/content/legal';
import { Container, PageHeader } from './primitives';

export function LegalPage({ doc }: { doc: LegalDoc }) {
  const updated = new Date(doc.updated).toLocaleDateString('en-GB', { dateStyle: 'long' });
  return (
    <>
      <PageHeader eyebrow="Legal" title={doc.title} description={`Last updated ${updated}`} />
      <Container className="max-w-3xl pb-24">
        <p className="text-lg text-muted-foreground">{doc.intro}</p>
        {doc.sections.map((s) => (
          <section key={s.heading} className="mt-10">
            <h2 className="text-xl font-semibold uppercase">{s.heading}</h2>
            {s.body.map((para) => (
              <p key={para} className="mt-3 leading-relaxed text-muted-foreground">
                {para}
              </p>
            ))}
          </section>
        ))}
      </Container>
    </>
  );
}
