import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/node';

// Turnstile reads the mock flag at import time.
vi.stubEnv('NEXT_PUBLIC_API_MOCKING', 'enabled');
const { ContactForm } = await import('./ContactForm');

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function setup() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <ContactForm />
    </QueryClientProvider>,
  );
}

const fill = (label: RegExp, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

function fillValid() {
  fill(/Full name/, 'Ayesha Malik');
  fill(/Email/, 'ayesha@example.com');
  fill(/Subject/, 'Pricing for a QA tester');
  fill(/Message/, 'We need one QA tester for three months, on-site in Lahore.');
}

describe('ContactForm', () => {
  it('shows validation errors from the contract schema', async () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: /Send message/ }));
    await waitFor(() => expect(screen.getAllByRole('alert').length).toBeGreaterThanOrEqual(3));
    expect(screen.getByLabelText(/Full name/)).toHaveAttribute('aria-invalid', 'true');
  });

  it('submits to the API and shows the success state', async () => {
    setup();
    fillValid();
    fireEvent.click(screen.getByRole('button', { name: /Send message/ }));
    expect(await screen.findByText(/Message sent/)).toBeInTheDocument();
  });

  it('shows a friendly error when rate limited', async () => {
    server.use(
      http.post('*/contact', () =>
        HttpResponse.json({ detail: 'Too many requests', code: 'rate_limited' }, { status: 429 }),
      ),
    );
    setup();
    fillValid();
    fireEvent.click(screen.getByRole('button', { name: /Send message/ }));
    expect(await screen.findByText(/Too many messages/)).toBeInTheDocument();
  });
});
