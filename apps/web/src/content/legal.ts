/**
 * DRAFT legal pages. Placeholder wording to show structure only: it must be reviewed and
 * replaced by the client's legal advisor before launch (PLAN.md §11).
 */
type Section = { heading: string; body: string[] };
export type LegalDoc = { title: string; updated: string; intro: string; sections: Section[] };

export const privacyPolicy: LegalDoc = {
  title: 'Privacy Policy',
  updated: '2026-11-22',
  intro:
    'This policy explains what information DigixSquad collects through this website, why we collect it and how we protect it.',
  sections: [
    {
      heading: 'Information we collect',
      body: [
        'When you submit a hire request or contact form we collect the details you enter: your name, organization, designation, email, phone or WhatsApp number, city, project description and any files you attach.',
        'We collect basic, privacy-friendly usage statistics (page views, device type) through Cloudflare Web Analytics, which does not use cookies or track you across sites.',
      ],
    },
    {
      heading: 'How we use it',
      body: [
        'To respond to your request, prepare proposals, match professionals to your requirement and manage the engagement.',
        'To send you updates about your request by email. We do not sell your information or use it for unrelated marketing.',
      ],
    },
    {
      heading: 'Storage and security',
      body: [
        'Data is stored on secured servers with encrypted backups. Attachments are kept in a private storage bucket and are only accessible to authorized staff through time-limited links.',
        'Access to request data is role-based and every change by our staff is logged.',
      ],
    },
    {
      heading: 'Retention',
      body: [
        'We keep request and engagement records for as long as needed for the engagement and for legal and tax obligations, then delete or anonymize them.',
      ],
    },
    {
      heading: 'Your choices',
      body: [
        'You can ask us to correct or delete your information at any time by contacting us. Some records may be kept where the law requires it.',
      ],
    },
  ],
};

export const termsOfUse: LegalDoc = {
  title: 'Terms of Use',
  updated: '2026-11-22',
  intro:
    'These terms apply to your use of this website. Engagements are governed by the separate contract signed for each request.',
  sections: [
    {
      heading: 'Use of the website',
      body: [
        'You may use this website to learn about our services, submit hire requests and contact us. Please provide accurate information and do not misuse the forms.',
      ],
    },
    {
      heading: 'Requests and quotations',
      body: [
        'Submitting a request does not create a contract. Pricing, scope, duration and service levels are confirmed in a written proposal and contract.',
      ],
    },
    {
      heading: 'Content',
      body: [
        'Text, logos and images on this site belong to DigixSquad. Statistics and timelines describe typical outcomes and are not guarantees.',
      ],
    },
    {
      heading: 'Liability',
      body: [
        'The website is provided as is. We are not liable for losses arising from use of the website, to the extent permitted by law.',
      ],
    },
    {
      heading: 'Governing law',
      body: ['These terms are governed by the laws of Pakistan.'],
    },
  ],
};
