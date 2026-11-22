import type { RoleCategory } from '@digixsquad/api-client';

/** Display labels for contract enums (UI-only, no copy from the API). */
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
