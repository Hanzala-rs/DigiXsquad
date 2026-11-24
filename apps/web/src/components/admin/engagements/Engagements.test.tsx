import { fireEvent, screen, waitFor } from '@testing-library/react';
import { db } from '@/mocks/db';
import { hireStore } from '@/mocks/hire-store';
import { server } from '@/mocks/node';
import { nav, renderAdmin, signInAs } from '../../../../test/admin-utils';
import { EngagementDetail } from './EngagementDetail';
import { EngagementsView } from './EngagementsView';

vi.mock('next/navigation', async () =>
  (await import('../../../../test/nav-mock')).navigationMock(),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  hireStore.reset();
  nav.replace.mockReset();
  nav.push.mockReset();
  nav.search = '';
  nav.pathname = '/admin/engagements';
});
afterAll(() => server.close());

const active = () => db.listEngagements({ page: 1, page_size: 50, status: 'ACTIVE' }).items[0]!;

describe('engagements', () => {
  it('shows renewal alerts with days left', async () => {
    signInAs('OPS');
    nav.search = 'ending=30';
    renderAdmin(<EngagementsView />);
    expect(await screen.findByText(/ending within 30 days/)).toBeInTheDocument();
    expect(screen.getAllByText(/\dd left|Ends today|Ended/).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: /Renewals due/ }));
    expect(nav.replace).toHaveBeenCalledWith('/admin/engagements', { scroll: false });
  });

  it('renews into a new engagement and opens it', async () => {
    signInAs('OPS');
    const e = active();
    renderAdmin(<EngagementDetail id={e.id} />);
    fireEvent.click(await screen.findByRole('button', { name: /Renew/ }));
    await waitFor(() => expect(nav.push).toHaveBeenCalled());
    const nextId = String(nav.push.mock.calls[0]![0]).split('/').pop()!;
    expect(db.getEngagement(nextId)!.renewed_from_id).toBe(e.id);
    expect(db.getEngagement(e.id)!.status).toBe('COMPLETED');
  });

  it('ending an engagement frees the team', async () => {
    signInAs('OPS');
    const e = active();
    renderAdmin(<EngagementDetail id={e.id} />);
    fireEvent.change(await screen.findByLabelText('Status'), { target: { value: 'TERMINATED' } });
    expect(screen.getByText(/frees the team/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(db.getEngagement(e.id)!.status).toBe('TERMINATED'));
    expect(
      e.assignments.every((a) => db.getTalent(a.talent.id)!.availability === 'AVAILABLE'),
    ).toBe(true);
  });
});
