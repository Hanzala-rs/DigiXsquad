import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { db } from '@/mocks/db';
import { hireStore } from '@/mocks/hire-store';
import { server } from '@/mocks/node';
import { nav, renderAdmin, signInAs } from '../../../../test/admin-utils';
import { TalentEditor } from './TalentEditor';
import { TalentsView } from './TalentsView';

vi.mock('next/navigation', async () =>
  (await import('../../../../test/nav-mock')).navigationMock(),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  hireStore.reset();
  nav.replace.mockReset();
  nav.push.mockReset();
  nav.search = '';
  nav.pathname = '/admin/talents';
});
afterAll(() => server.close());

const type = (label: RegExp, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

describe('talents', () => {
  it('lists the bench with cost for OPS and filters through the URL', async () => {
    signInAs('OPS');
    renderAdmin(<TalentsView />);
    const table = await screen.findByRole('table');
    expect(within(table).getByRole('button', { name: 'Monthly cost' })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Availability'), { target: { value: 'AVAILABLE' } });
    expect(nav.replace).toHaveBeenCalledWith('/admin/talents?availability=AVAILABLE', {
      scroll: false,
    });
  });

  it('adds a talent, then opens it', async () => {
    signInAs('OPS');
    renderAdmin(<TalentEditor id={null} />);
    fireEvent.click(await screen.findByRole('button', { name: /Add talent/ }));
    expect(await screen.findAllByText(/required|Please/i)).not.toHaveLength(0);

    type(/Full name/, 'Hina Test');
    type(/^Email/, 'hina.test@example.com');
    type(/^Phone/, '+92 300 0000000');
    await screen.findByRole('option', { name: 'QA Tester' });
    type(/Primary role/, 'qa-tester');
    type(/Experience/, '3');
    type(/Skills/, 'Cypress, Playwright');
    fireEvent.click(screen.getByRole('button', { name: /Add talent/ }));

    await waitFor(() => expect(nav.push).toHaveBeenCalled());
    const id = String(nav.push.mock.calls[0]![0]).split('/').pop()!;
    expect(db.getTalent(id)).toMatchObject({
      full_name: 'Hina Test',
      skills: ['Cypress', 'Playwright'],
      experience_years: 3,
    });
  });

  it('edits and deactivates a talent (two clicks)', async () => {
    signInAs('OPS');
    const t = db.listTalents({ page: 1, page_size: 1, availability: 'AVAILABLE' }).items[0]!;
    renderAdmin(<TalentEditor id={t.id} />);
    fireEvent.change(await screen.findByLabelText(/City/), { target: { value: 'Multan' } });
    fireEvent.click(screen.getByRole('button', { name: /Save changes/ }));
    expect(await screen.findByRole('status')).toHaveTextContent('Saved');
    expect(db.getTalent(t.id)!.city).toBe('Multan');

    fireEvent.click(screen.getByRole('button', { name: /Deactivate/ }));
    fireEvent.click(screen.getByRole('button', { name: /Click again to deactivate/ }));
    await waitFor(() => expect(db.getTalent(t.id)!.is_active).toBe(false));
  });
});
