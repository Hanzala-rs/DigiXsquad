import type {
  BudgetRange,
  ContractType,
  EngagementMode,
  OrgType,
  ProcurementMode,
  RequestStatus,
  RequestType,
  RoleCategory,
  Seniority,
} from '@digixsquad/api-client';

/** Display labels for contract enums (UI-only text, not CMS copy). */
export const roleCategoryLabels: Record<RoleCategory, string> = {
  DEVELOPMENT: 'Development',
  DIGITAL_MEDIA: 'Digital Media',
  DATA_AI: 'Data & AI',
  IT_SUPPORT: 'IT Support',
  DIGITAL_MARKETING: 'Digital Marketing',
  MANAGEMENT: 'Management',
};

export const roleCategoryOrder: RoleCategory[] = [
  'DEVELOPMENT',
  'DATA_AI',
  'DIGITAL_MEDIA',
  'DIGITAL_MARKETING',
  'IT_SUPPORT',
  'MANAGEMENT',
];

type Option<T extends string> = { value: T; label: string; hint?: string };

export const orgTypeOptions: Option<OrgType>[] = [
  {
    value: 'GOVT',
    label: 'Government',
    hint: 'Federal or provincial department, authority or public body',
  },
  { value: 'PRIVATE', label: 'Private', hint: 'Company, startup, NGO or institution' },
];

export const requestTypeOptions: Option<RequestType>[] = [
  {
    value: 'SINGLE_ROLE',
    label: 'Single role',
    hint: 'One kind of professional, e.g. a QA tester',
  },
  { value: 'SQUAD', label: 'Ready-made squad', hint: 'A complete team for a type of project' },
  { value: 'CUSTOM_TEAM', label: 'Custom team', hint: 'Pick your own mix of roles' },
];

export const seniorityOptions: Option<Seniority>[] = [
  { value: 'JUNIOR', label: 'Junior' },
  { value: 'MID', label: 'Mid-level' },
  { value: 'SENIOR', label: 'Senior' },
  { value: 'LEAD', label: 'Lead' },
];

export const engagementModeOptions: Option<EngagementMode>[] = [
  { value: 'ONSITE', label: 'On-site', hint: 'At your office' },
  { value: 'REMOTE', label: 'Remote', hint: 'From our side' },
  { value: 'HYBRID', label: 'Hybrid', hint: 'A mix of both' },
];

export const contractTypeOptions: Option<ContractType>[] = [
  { value: 'MONTHLY', label: 'Monthly', hint: 'Fixed monthly fee' },
  { value: 'PROJECT', label: 'Project-based', hint: 'Agreed scope and price' },
];

export const procurementModeOptions: Option<ProcurementMode>[] = [
  { value: 'DIRECT', label: 'Direct contracting' },
  { value: 'RFQ', label: 'Request for quotation (RFQ)' },
  { value: 'OPEN_TENDER', label: 'Open tender' },
  { value: 'FRAMEWORK', label: 'Framework agreement' },
  { value: 'NOT_SURE', label: 'Not sure yet' },
];

export const budgetRangeOptions: Option<BudgetRange>[] = [
  { value: 'PKR_UNDER_200K', label: 'Under PKR 200,000' },
  { value: 'PKR_200K_500K', label: 'PKR 200,000 – 500,000' },
  { value: 'PKR_500K_1M', label: 'PKR 500,000 – 1 million' },
  { value: 'PKR_1M_3M', label: 'PKR 1 – 3 million' },
  { value: 'PKR_3M_PLUS', label: 'Over PKR 3 million' },
  { value: 'NOT_SURE', label: 'Not sure yet' },
];

export const requestStatusLabels: Record<RequestStatus, { label: string; description: string }> = {
  NEW: { label: 'Received', description: 'We have your request and will review it shortly.' },
  CONTACTED: { label: 'Contacted', description: 'Our team has reached out to discuss your needs.' },
  PROPOSAL_SENT: {
    label: 'Proposal sent',
    description: 'Profiles and a proposal have been shared.',
  },
  NEGOTIATION: {
    label: 'In discussion',
    description: 'We are finalizing scope, pricing and terms.',
  },
  WON: { label: 'Confirmed', description: 'Contract confirmed. Your team is being onboarded.' },
  LOST: { label: 'Closed', description: 'This request has been closed.' },
  ON_HOLD: { label: 'On hold', description: 'This request is paused for now.' },
};

export const labelOf = <T extends string>(options: Option<T>[], value?: T | null) =>
  options.find((o) => o.value === value)?.label ?? '—';
