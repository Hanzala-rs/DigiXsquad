import { fireEvent, render, screen } from '@testing-library/react';
import { RolesExplorer } from './RolesExplorer';

const roles = [
  { slug: 'qa-tester', category: 'DEVELOPMENT' as const },
  { slug: 'frontend-developer', category: 'DEVELOPMENT' as const },
  { slug: 'video-editor', category: 'DIGITAL_MEDIA' as const },
];
const cards = Object.fromEntries(roles.map((r) => [r.slug, <span key={r.slug}>{r.slug}</span>]));

describe('RolesExplorer', () => {
  it('shows all roles, then filters by category', () => {
    render(<RolesExplorer roles={roles} cards={cards} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    // only categories that have roles get a chip
    expect(screen.queryByRole('button', { name: /Data & AI/ })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /Digital Media/ }));
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    expect(screen.getByText('video-editor')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Digital Media/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    fireEvent.click(screen.getByRole('button', { name: /All roles/ }));
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });
});
