import type { SiteContentCompany } from '@digixsquad/api-client';
import { render, screen, within } from '@testing-library/react';
import { Footer } from './Footer';
import { socialLinks } from './SocialLinks';

const base: SiteContentCompany = {
  name: 'DigixSquad',
  tagline: 'Your IT team.',
  email: 'info@digixsquad.com',
  phone: '+92 300 0000000',
  whatsapp: '+92 300 0000000',
  address: 'TBD, Pakistan',
  ntn: 'TBD',
  socials: { linkedin: '', x: '' },
};

describe('socialLinks', () => {
  it('drops placeholders and non-web values', () => {
    expect(socialLinks(base)).toEqual([]);
    expect(
      socialLinks({ ...base, socials: { x: 'TBD', linkedin: 'javascript:alert(1)' } }),
    ).toEqual([]);
  });

  it('uses x, falls back to twitter, and builds a wa.me link', () => {
    const links = socialLinks({
      ...base,
      whatsapp: '+92 321 1234567',
      socials: {
        twitter: 'https://twitter.com/digixsquad',
        linkedin: 'https://linkedin.com/company/dx',
      },
    });
    expect(links.map((l) => [l.key, l.href])).toEqual([
      ['x', 'https://twitter.com/digixsquad'],
      ['linkedin', 'https://linkedin.com/company/dx'],
      ['whatsapp', 'https://wa.me/923211234567'],
    ]);
  });
});

describe('Footer', () => {
  it('is the #contact section and hides placeholder contact details', () => {
    const { container } = render(<Footer company={base} />);
    expect(container.querySelector('footer')).toHaveAttribute('id', 'contact');
    expect(screen.getByRole('link', { name: 'info@digixsquad.com' })).toBeInTheDocument();
    expect(screen.queryByText(/0000000/)).not.toBeInTheDocument();
    expect(screen.queryByText(/TBD/)).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Sponsors' })).not.toBeInTheDocument();
    expect(screen.queryByText('Links')).not.toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'About' })).toBeInTheDocument();
    expect(
      within(screen.getByRole('navigation', { name: 'Company' })).getByRole('link', {
        name: 'Track a request',
      }),
    ).toHaveAttribute('href', '/track');
  });

  it('lists sponsors (logo or name) and social buttons', () => {
    render(
      <Footer
        company={{ ...base, socials: { linkedin: 'https://linkedin.com/company/dx' } }}
        sponsors={[
          { name: 'Acme', url: 'https://acme.example' },
          { name: 'Globex', logo_url: '/brand/logo.webp' },
        ]}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Sponsors' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Acme' })).toHaveAttribute(
      'href',
      'https://acme.example',
    );
    expect(screen.getByRole('img', { name: 'Globex' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'DigixSquad on LinkedIn' })).toHaveAttribute(
      'href',
      'https://linkedin.com/company/dx',
    );
  });
});
