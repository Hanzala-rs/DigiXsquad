import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { roles, squads } from '@/lib/seed-data';
import { todayISO } from '@/lib/hire/schema';
import { hireStore } from '@/mocks/hire-store';
import { server } from '@/mocks/node';

let search = '';
vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams(search) }));
vi.stubEnv('NEXT_PUBLIC_API_MOCKING', 'enabled'); // Turnstile mock token
const { HireWizard } = await import('./HireWizard');

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  sessionStorage.clear();
  hireStore.reset();
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function setup(query = '') {
  search = query;
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <HireWizard squads={squads} roles={roles} />
    </QueryClientProvider>,
  );
}

const heading = () => screen.getByRole('heading', { level: 2 }).textContent;
const cont = () => fireEvent.click(screen.getByRole('button', { name: /Continue/ }));
const type = (label: RegExp, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
const tomorrow = todayISO(new Date(Date.now() + 86_400_000));

describe('HireWizard', () => {
  it('blocks the first step until an organization type is chosen', async () => {
    setup();
    expect(heading()).toBe('Organization type');
    cont();
    expect(await screen.findByText('Please choose an option.')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText(/Private/));
    cont();
    await waitFor(() => expect(heading()).toBe('What you need'));
  });

  it('completes a government squad request from a squad CTA link', async () => {
    setup('squad=data-ai-squad&org=GOVT');

    // Prefill skips to the roles step with the squad's default line-up.
    expect(heading()).toBe('Roles');
    const squad = squads.find((s) => s.slug === 'data-ai-squad')!;
    expect(screen.getAllByLabelText('Role')).toHaveLength(squad.roles.length);
    cont();

    await waitFor(() => expect(heading()).toBe('Duration & work mode'));
    type(/Preferred start date/, tomorrow);
    fireEvent.click(screen.getByLabelText(/Remote/));
    cont();

    await waitFor(() => expect(heading()).toBe('Your details'));
    type(/Department \/ organization name/, 'Punjab IT Board');
    type(/Full name/, 'Ali Khan');
    type(/^Email/, 'ali@example.gov.pk');
    type(/^Phone/, '+92 300 1234567');
    cont();
    // Business rule: GOVT ⇒ procurement mode
    expect(await screen.findByText(/Choose a procurement mode/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Procurement mode'), { target: { value: 'RFQ' } });
    cont();

    await waitFor(() => expect(heading()).toBe('Project'));
    type(/Describe the project/, 'Build a provincial dashboard for school enrolment data.');
    cont();

    await waitFor(() => expect(heading()).toBe('Review & submit'));
    expect(screen.getByText(squad.name)).toBeInTheDocument();
    expect(screen.getByText('Punjab IT Board')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Submit request/ }));
    expect(await screen.findByText('Please confirm to continue.')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText(/I agree/));
    fireEvent.click(screen.getByRole('button', { name: /Submit request/ }));

    const status = await screen.findByRole('status');
    expect(within(status).getByText(/^DS-\d{4}-0002$/)).toBeInTheDocument();
    expect(within(status).getByText('ali@example.gov.pk')).toBeInTheDocument();
    expect(sessionStorage.getItem('ds_hire_draft')).toBeNull();
  });

  it('saves a draft and restores it after a reload', async () => {
    const first = setup();
    fireEvent.click(screen.getByLabelText(/Government/));
    cont();
    await waitFor(() => expect(heading()).toBe('What you need'));
    first.unmount();

    setup();
    expect(heading()).toBe('What you need');
  });

  it('a single role allows exactly one role row', async () => {
    setup('role=qa-tester');
    fireEvent.click(screen.getByLabelText(/Private/));
    cont();
    await waitFor(() => expect(heading()).toBe('What you need'));
    expect(screen.getByLabelText(/Single role/)).toBeChecked();
    cont();
    await waitFor(() => expect(heading()).toBe('Roles'));
    expect(screen.getAllByLabelText('Role')).toHaveLength(1);
    expect(screen.queryByRole('button', { name: /Add a role/ })).toBeNull();
  });
});
