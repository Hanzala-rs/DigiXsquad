import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { db } from '@/mocks/db';
import { hireStore } from '@/mocks/hire-store';
import { server } from '@/mocks/node';
import { nav, renderAdmin, signInAs } from '../../../../test/admin-utils';
import { RequestDetail } from './RequestDetail';
import { RequestsView } from './RequestsView';

vi.mock('next/navigation', async () =>
  (await import('../../../../test/nav-mock')).navigationMock(),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  hireStore.reset();
  nav.replace.mockReset();
  nav.search = '';
  nav.pathname = '/admin/requests';
});
afterAll(() => server.close());

const byOrg = (org: string) => db.listRequests({ page: 1, page_size: 100, q: org }).items[0]!;

describe('requests list', () => {
  it('table shows requests and filters by status through the URL', async () => {
    signInAs('SALES');
    renderAdmin(<RequestsView />);
    const table = await screen.findByRole('table');
    expect(within(table).getAllByRole('row').length).toBeGreaterThan(5);
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'NEW' } });
    expect(nav.replace).toHaveBeenCalledWith('/admin/requests?status=NEW', { scroll: false });
  });

  it('table applies URL filters', async () => {
    signInAs('SALES');
    nav.search = 'status=WON';
    renderAdmin(<RequestsView />);
    const table = await screen.findByRole('table');
    const rows = within(table).getAllByRole('row').slice(1);
    expect(rows.length).toBeGreaterThan(0);
    rows.forEach((r) => expect(within(r).getByText('Won')).toBeInTheDocument());
  });

  it('board moves a card with the "Move to" picker', async () => {
    signInAs('SALES');
    nav.search = 'view=board';
    const target = byOrg('Tez Logistics');
    renderAdmin(<RequestsView />);
    const picker = await screen.findByLabelText(`Move ${target.ref_no} to`);
    fireEvent.change(picker, { target: { value: 'CONTACTED' } });
    await waitFor(() => expect(db.getRequest(target.id)!.status).toBe('CONTACTED'));
  });

  it('OPS sees the board read-only (no move pickers, no export)', async () => {
    signInAs('OPS');
    nav.search = 'view=board';
    renderAdmin(<RequestsView />);
    await screen.findAllByText(/Tez Logistics/);
    expect(screen.queryByLabelText(/^Move DS-/)).toBeNull();
    expect(screen.queryByRole('button', { name: /Export CSV/ })).toBeNull();
  });
});

describe('request detail', () => {
  it('SALES changes status with a note; both land on the timeline', async () => {
    signInAs('SALES');
    const r = byOrg('Punjab IT Board');
    renderAdmin(<RequestDetail id={r.id} />);
    fireEvent.change(await screen.findByLabelText('Status'), { target: { value: 'NEGOTIATION' } });
    fireEvent.change(screen.getByLabelText(/^Note/), { target: { value: 'Agreed on 2 testers.' } });
    fireEvent.click(screen.getByRole('button', { name: /Update/ }));
    // Wait for the server round-trip (the note text also sits in the textarea until then).
    expect(await screen.findByText('Status changed to NEGOTIATION')).toBeInTheDocument();
    expect(screen.getByLabelText(/^Note/)).toHaveValue('');
    expect(screen.getAllByText('Agreed on 2 testers.').length).toBeGreaterThan(0);
    expect(db.getRequest(r.id)!.status).toBe('NEGOTIATION');
    // SALES can't assign owners or see internal cost
    expect(screen.queryByLabelText('Owner')).toBeNull();
    expect(screen.queryByText(/\/mo$/)).toBeNull();
  });

  it('SALES adds a note', async () => {
    signInAs('SALES');
    renderAdmin(<RequestDetail id={byOrg('Tez Logistics').id} />);
    fireEvent.change(await screen.findByLabelText('Add a note'), {
      target: { value: 'Left a voicemail.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Add note/ }));
    expect(await screen.findByText('Left a voicemail.')).toBeInTheDocument();
  });

  it('OPS converts a request into an engagement', async () => {
    signInAs('OPS');
    const r = byOrg('Tez Logistics');
    renderAdmin(<RequestDetail id={r.id} />);
    expect(screen.queryByLabelText('Status')).toBeNull(); // read-only for OPS
    const boxes = await screen.findAllByRole('checkbox');
    fireEvent.click(boxes[0]!);
    fireEvent.change(screen.getByLabelText('Monthly fee (PKR)'), { target: { value: '400000' } });
    fireEvent.click(screen.getByRole('button', { name: /^Convert$/ }));
    expect(await screen.findByText(/Converted to an engagement/)).toBeInTheDocument();
    expect(db.getRequest(r.id)!.status).toBe('WON');
    expect(db.getRequest(r.id)!.engagement_id).toBeTruthy();
  });

  it('SUPER_ADMIN assigns an owner', async () => {
    signInAs('SUPER_ADMIN');
    const r = byOrg('Tez Logistics');
    renderAdmin(<RequestDetail id={r.id} />);
    const owner = await screen.findByLabelText('Owner');
    await waitFor(() => expect(owner).not.toBeDisabled());
    const sales = db.listUsers().find((u) => u.role === 'SALES')!;
    fireEvent.change(owner, { target: { value: sales.id } });
    await waitFor(() => expect(db.getRequest(r.id)!.assigned_to?.id).toBe(sales.id));
    expect(await screen.findByText(`Assigned to ${sales.name}`)).toBeInTheDocument();
  });
});
