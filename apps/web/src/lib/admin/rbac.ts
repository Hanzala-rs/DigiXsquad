import type { UserRole } from '@digixsquad/api-client';

/**
 * RBAC matrix from AGENTS.md ("Conventions"). The API enforces it; the UI uses it only to hide
 * actions a role can't take.
 *   SUPER_ADMIN = everything
 *   SALES = requests, notes, status, matches (no users, no audit logs, can't see monthly_cost)
 *   OPS = talents, engagements, matches, requests read
 */
export type Permission =
  | 'requests.read'
  | 'requests.write' // status + notes
  | 'requests.assign'
  | 'requests.export'
  | 'matches.read'
  | 'engagements.convert'
  | 'engagements.manage'
  | 'talents.manage'
  | 'talents.cost'
  | 'catalog.manage'
  | 'content.manage'
  | 'users.manage'
  | 'audit.read'
  | 'messages.read';

const MATRIX: Record<UserRole, ReadonlySet<Permission>> = {
  SUPER_ADMIN: new Set<Permission>([
    'requests.read',
    'requests.write',
    'requests.assign',
    'requests.export',
    'matches.read',
    'engagements.convert',
    'engagements.manage',
    'talents.manage',
    'talents.cost',
    'catalog.manage',
    'content.manage',
    'users.manage',
    'audit.read',
    'messages.read',
  ]),
  SALES: new Set<Permission>([
    'requests.read',
    'requests.write',
    'requests.export',
    'matches.read',
    'messages.read',
  ]),
  OPS: new Set<Permission>([
    'requests.read',
    'matches.read',
    'engagements.convert',
    'engagements.manage',
    'talents.manage',
    'talents.cost',
  ]),
};

export const can = (role: UserRole | undefined, permission: Permission) =>
  !!role && MATRIX[role].has(permission);

export const roleLabels: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super admin',
  SALES: 'Sales',
  OPS: 'Operations',
};
