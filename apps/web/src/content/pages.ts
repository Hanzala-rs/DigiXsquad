/**
 * Page copy that the contract's `SiteContent` doesn't cover yet (sector pages, engagement models,
 * page intros). Draft copy: the client must approve it (PLAN.md §11).
 *
 * TODO(contract PR): move into SiteContent (e.g. `pages.government`, `pages.private_sector`,
 * `engagement_models`) so admins can edit it, then read via getSiteContent().
 */

type Item = { title: string; description: string; icon: string };

export const pageIntros = {
  squads: {
    eyebrow: 'Squads',
    title: 'Ready-made teams for real projects',
    description:
      'Each squad comes with the roles a project needs and a lead who owns delivery. Start with the default line-up, then add or remove roles.',
  },
  roles: {
    eyebrow: 'Roles',
    title: 'Hire one professional, monthly',
    description:
      'Every role is available on its own, on-site, remote or hybrid, from one month. Filter by category to find the skill you need.',
  },
  howItWorks: {
    eyebrow: 'How it works',
    title: 'From request to a working team in five steps',
    description:
      'No recruitment drives, no HR paperwork. Tell us what you need and we handle hiring, training, payroll and replacement.',
  },
  about: {
    eyebrow: 'About us',
    title: 'Skilled IT teams, without the hiring',
  },
  contact: {
    eyebrow: 'Contact',
    title: 'Talk to our team',
    description:
      'Questions about squads, pricing or procurement? Send a message and we will get back within one working day. Ready to hire? Use the hire request form instead.',
  },
} as const;

export const government = {
  eyebrow: 'Government',
  title: 'Digital delivery capacity for departments',
  description:
    'Run e-governance, dashboards and digitization projects with a managed team on a simple monthly contract, procured the way your department already works.',
  focusTitle: 'What we deliver for the public sector',
  focus: [
    {
      title: 'e-Governance portals',
      description:
        'Citizen services, online applications, tracking and payments, built and maintained.',
      icon: 'landmark',
    },
    {
      title: 'Dashboards and MIS',
      description: 'Power BI and custom dashboards that turn department data into decisions.',
      icon: 'bar-chart-3',
    },
    {
      title: 'Digitization',
      description: 'Records scanning, data entry and migration from paper and legacy systems.',
      icon: 'file-check',
    },
    {
      title: 'Cybersecurity and IT support',
      description: 'Network, helpdesk and security hardening for offices and data centers.',
      icon: 'shield-check',
    },
  ] satisfies Item[],
  procurementTitle: 'Procurement made simple',
  procurement: [
    {
      title: 'Direct contracting',
      description: 'Small, urgent requirements within your financial powers.',
      icon: 'file-check',
    },
    {
      title: 'RFQ',
      description: 'We respond to requests for quotation with full documents.',
      icon: 'clipboard-list',
    },
    {
      title: 'Open tender',
      description: 'Technical and financial proposals under PPRA rules.',
      icon: 'building-2',
    },
    {
      title: 'Framework agreements',
      description: 'Call-off squads as needed under one agreement.',
      icon: 'repeat',
    },
  ] satisfies Item[],
} as const;

export const privateSector = {
  eyebrow: 'Private sector',
  title: 'Scale your tech team month to month',
  description:
    'Add developers, designers, marketers or a full squad without long hiring cycles or fixed headcount. Grow when you need to, pause when you don’t.',
  focusTitle: 'Where businesses use DigixSquad',
  focus: [
    {
      title: 'Software and product',
      description: 'Web and mobile apps, MVPs and ongoing product development.',
      icon: 'code-2',
    },
    {
      title: 'ERP and CRM',
      description: 'Odoo, Dynamics and custom ERP/CRM setup, customization and support.',
      icon: 'layout-dashboard',
    },
    {
      title: 'Digital marketing',
      description: 'Social media, performance ads, SEO and content on a monthly plan.',
      icon: 'megaphone',
    },
    {
      title: 'Automation and chatbots',
      description: 'Workflow automation, AI chatbots and integrations that save hours every week.',
      icon: 'brain-circuit',
    },
  ] satisfies Item[],
  flexTitle: 'Contracts that flex with you',
  flex: [
    {
      title: 'From one month',
      description: 'Start small and extend when it works. No long lock-ins.',
      icon: 'calendar-range',
    },
    {
      title: 'Scale up or down',
      description: 'Add a role or release one at the end of any month.',
      icon: 'trending-up',
    },
    {
      title: 'Monthly or project-based',
      description: 'Pay a fixed monthly fee, or agree a scope and price per project.',
      icon: 'repeat',
    },
    {
      title: 'Free replacement',
      description: 'Not the right fit? We replace the resource at no extra cost.',
      icon: 'refresh-cw',
    },
  ] satisfies Item[],
} as const;

export const engagementModels = {
  eyebrow: 'Engagement models',
  title: 'Choose how you pay and how they work',
  description:
    'Two contract types and three work modes. Mix them to fit your budget, your office and your project.',
  contracts: [
    {
      title: 'Monthly',
      description:
        'A fixed monthly fee per professional or squad, for 1 to 36 months. Best for ongoing work, support and evolving scope.',
      icon: 'calendar-range',
      points: [
        'Predictable monthly cost',
        'Renew, scale or end each term',
        'Monthly progress reports',
      ],
    },
    {
      title: 'Project-based',
      description:
        'An agreed scope, timeline and price, delivered by a squad with a lead. Best for well-defined deliverables.',
      icon: 'clipboard-list',
      points: [
        'Fixed scope and milestones',
        'Delivery owned by our lead',
        'Acceptance at each milestone',
      ],
    },
  ],
  modes: [
    {
      title: 'On-site',
      description: 'The team works from your office, on your systems and hours.',
      icon: 'building-2',
    },
    {
      title: 'Remote',
      description: 'The team works from our side with daily check-ins and secure access.',
      icon: 'server',
    },
    {
      title: 'Hybrid',
      description: 'A mix: on-site when it matters, remote the rest of the time.',
      icon: 'repeat',
    },
  ] satisfies Item[],
} as const;

export const ctaBand = {
  title: 'Need a team this month?',
  description:
    'Tell us the roles, duration and work mode. We reply with matched profiles within days.',
  primary: 'Start a hire request',
  secondary: 'Talk to us',
} as const;
