import { fireEvent, screen, waitFor } from '@testing-library/react';
import { DEMO_PASSWORD } from '@/mocks/db';
import { hireStore } from '@/mocks/hire-store';
import { server } from '@/mocks/node';
import { nav, renderAdmin, signInAs } from '../../../test/admin-utils';
import { LoginForm, safeNext } from './LoginForm';

vi.mock('next/navigation', async () => (await import('../../../test/nav-mock')).navigationMock());

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  hireStore.reset();
  nav.replace.mockReset();
  nav.search = '';
  nav.pathname = '/admin/requests';
});
afterAll(() => server.close());

describe('admin auth', () => {
  it('guard sends signed-out visitors to login with ?next=', async () => {
    signInAs(null);
    renderAdmin(<p>secret</p>);
    await waitFor(() =>
      expect(nav.replace).toHaveBeenCalledWith('/admin/login?next=%2Fadmin%2Frequests'),
    );
    expect(screen.queryByText('secret')).toBeNull();
  });

  it('guard renders the page for a signed-in user', async () => {
    signInAs('SALES');
    renderAdmin(<p>secret</p>);
    expect(await screen.findByText('secret')).toBeInTheDocument();
  });

  it('login: wrong password shows an error; right one redirects to ?next', async () => {
    nav.search = 'next=/admin/requests/abc';
    renderAdmin(<LoginForm />, { guard: false });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'sales@digixsquad.test' },
    });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrong-password' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign in/ }));
    expect(await screen.findByText('Wrong email or password.')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Password'), { target: { value: DEMO_PASSWORD } });
    fireEvent.click(screen.getByRole('button', { name: /Sign in/ }));
    await waitFor(() => expect(nav.replace).toHaveBeenCalledWith('/admin/requests/abc'));
  });

  it.each([
    [null, '/admin'],
    ['/admin/requests?status=NEW', '/admin/requests?status=NEW'],
    ['https://evil.example', '/admin'],
    ['//evil.example', '/admin'],
    ['/admin/login', '/admin'],
  ])('safeNext(%j) = %s', (input, expected) => expect(safeNext(input)).toBe(expected));
});
