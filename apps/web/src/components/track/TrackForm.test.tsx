import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { DEMO_REQUEST, hireStore } from '@/mocks/hire-store';
import { server } from '@/mocks/node';
import { TrackForm } from './TrackForm';

let search = '';
vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams(search) }));

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => hireStore.reset());
afterAll(() => server.close());

function setup(query = '') {
  search = query;
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <TrackForm />
    </QueryClientProvider>,
  );
}

const type = (label: RegExp, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

describe('TrackForm', () => {
  it('prefills the reference from ?ref= and shows status + timeline', async () => {
    setup(`ref=${DEMO_REQUEST.ref.toLowerCase()}`);
    expect(screen.getByLabelText(/Reference number/)).toHaveValue(DEMO_REQUEST.ref);
    type(/Email used/, DEMO_REQUEST.email);
    fireEvent.click(screen.getByRole('button', { name: /Track/ }));
    expect(await screen.findByRole('heading', { name: 'Proposal sent' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('validates the reference format', async () => {
    setup();
    type(/Reference number/, 'ABC');
    type(/Email used/, 'a@b.co');
    fireEvent.click(screen.getByRole('button', { name: /Track/ }));
    expect(await screen.findByText(/Use the format DS-2026-0001/)).toBeInTheDocument();
  });

  it('says so when nothing matches (wrong email)', async () => {
    setup();
    type(/Reference number/, DEMO_REQUEST.ref);
    type(/Email used/, 'someone@else.com');
    fireEvent.click(screen.getByRole('button', { name: /Track/ }));
    expect(await screen.findByText(/No request matches/)).toBeInTheDocument();
  });
});
