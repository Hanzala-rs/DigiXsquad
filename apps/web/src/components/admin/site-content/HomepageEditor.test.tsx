import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { siteContent } from '@/lib/seed-data';
import { siteContentStore } from '@/mocks/handlers';
import { hireStore } from '@/mocks/hire-store';
import { server } from '@/mocks/node';
import { nav, renderAdmin, signInAs } from '../../../../test/admin-utils';
import { adminNav } from '../AdminShell';
import { HomepageEditor } from './HomepageEditor';

vi.mock('next/navigation', async () =>
  (await import('../../../../test/nav-mock')).navigationMock(),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  hireStore.reset();
  siteContentStore.reset();
  nav.pathname = '/admin/site-content';
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const group = (name: string) => screen.getByRole('group', { name });

describe('homepage editor', () => {
  it('is in the admin nav for content managers', () => {
    expect(adminNav.find((i) => i.href === '/admin/site-content')).toMatchObject({
      label: 'Homepage',
      permission: 'content.manage',
    });
  });

  it('editing a counter sends the full, merged site content', async () => {
    signInAs('SUPER_ADMIN');
    const sent: unknown[] = [];
    server.events.on('request:start', async ({ request }) => {
      if (request.method === 'PUT') sent.push(await request.clone().json());
    });
    renderAdmin(<HomepageEditor />);

    const counter = await waitFor(() => group('Counter 1'));
    fireEvent.change(within(counter).getByLabelText('Value'), { target: { value: '27' } });
    fireEvent.click(screen.getByRole('button', { name: /Save changes/ }));

    expect(await screen.findByRole('status')).toHaveTextContent('Saved');
    expect(sent).toHaveLength(1);
    const body = sent[0] as typeof siteContent;
    // Untouched fields go back as they were; only the counter changed.
    expect(body.company).toEqual(siteContent.company);
    expect(body.about).toEqual(siteContent.about);
    expect(body.faqs).toEqual(siteContent.faqs);
    expect(body.projects![0]).toEqual({ ...siteContent.projects![0], value: 27 });
    expect(body.projects!.slice(1)).toEqual(siteContent.projects!.slice(1));
    expect(body.team).toEqual(siteContent.team);
    expect(siteContentStore.get().projects![0]!.value).toBe(27);
    server.events.removeAllListeners();
  });

  it('adds, reorders and validates list items', async () => {
    signInAs('SUPER_ADMIN');
    renderAdmin(<HomepageEditor />);
    await waitFor(() => group('Team member 1'));

    fireEvent.click(screen.getByRole('button', { name: 'Move Team member 2 up' }));
    expect(within(group('Team member 1')).getByLabelText('Name')).toHaveValue(
      siteContent.team![1]!.name,
    );

    fireEvent.click(screen.getByRole('button', { name: /Add sponsor/ }));
    const sponsor = group('Sponsor 1');
    fireEvent.change(within(sponsor).getByLabelText(/Website/), { target: { value: 'nope' } });
    fireEvent.click(screen.getByRole('button', { name: /Save changes/ }));
    expect(await within(sponsor).findAllByRole('alert')).toHaveLength(2); // name + url
    expect(siteContentStore.get().sponsors).toEqual([]);

    fireEvent.change(within(sponsor).getByLabelText('Name'), { target: { value: 'Acme' } });
    fireEvent.change(within(sponsor).getByLabelText(/Website/), {
      target: { value: 'https://acme.example' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Save changes/ }));
    expect(await screen.findByRole('status')).toHaveTextContent('Saved');
    expect(siteContentStore.get().sponsors).toEqual([
      { name: 'Acme', url: 'https://acme.example' },
    ]);
    expect(siteContentStore.get().team![0]!.name).toBe(siteContent.team![1]!.name);
  });

  it('shows the API error when saving fails', async () => {
    signInAs('SUPER_ADMIN');
    server.use(
      http.put('*/admin/site-content', () =>
        HttpResponse.json({ detail: 'Not allowed for your role' }, { status: 403 }),
      ),
    );
    renderAdmin(<HomepageEditor />);
    const founder = await screen.findByLabelText('Portrait alt text', { exact: false });
    fireEvent.change(founder, { target: { value: 'New alt' } });
    fireEvent.click(screen.getByRole('button', { name: /Save changes/ }));
    expect(await screen.findByText('Not allowed for your role')).toBeInTheDocument();
  });

  it('tells other roles they cannot edit it', async () => {
    signInAs('SALES');
    renderAdmin(<HomepageEditor />);
    expect(
      await screen.findByText('Only a super admin can edit the homepage.'),
    ).toBeInTheDocument();
  });
});
