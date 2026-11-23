'use client';

import {
  adminAddHireRequestNote,
  adminAssignHireRequest,
  adminConvertToEngagement,
  adminExportHireRequests,
  adminGetAttachmentUrl,
  adminGetHireRequest,
  adminGetTalentMatches,
  adminListHireRequests,
  adminListUsers,
  adminUpdateHireRequestStatus,
  getDashboardStats,
  type AdminListHireRequestsParams,
  type EngagementCreate,
  type StatusUpdate,
} from '@digixsquad/api-client';
import {
  ActivitySchema,
  AttachmentUrlSchema,
  DashboardStatsSchema,
  EngagementSchema,
  HireRequestDetailSchema,
  HireRequestPageSchema,
  MatchesSchema,
  UsersSchema,
} from './schemas';
import { authed } from './session';

/** Query keys (TanStack Query). */
export const qk = {
  stats: ['admin', 'stats'] as const,
  requests: (params: AdminListHireRequestsParams) => ['admin', 'requests', params] as const,
  requestsAll: ['admin', 'requests'] as const,
  request: (id: string) => ['admin', 'request', id] as const,
  matches: (id: string) => ['admin', 'request', id, 'matches'] as const,
  users: ['admin', 'users'] as const,
};

/** Every admin call: transparent session refresh + contract-validated response. */
export const adminApi = {
  stats: async () => DashboardStatsSchema.parse((await authed(() => getDashboardStats())).data),
  listRequests: async (params: AdminListHireRequestsParams) =>
    HireRequestPageSchema.parse((await authed(() => adminListHireRequests(params))).data),
  getRequest: async (id: string) =>
    HireRequestDetailSchema.parse((await authed(() => adminGetHireRequest(id))).data),
  updateStatus: async (id: string, body: StatusUpdate) =>
    HireRequestDetailSchema.parse(
      (await authed(() => adminUpdateHireRequestStatus(id, body))).data,
    ),
  assign: async (id: string, userId: string | null) =>
    HireRequestDetailSchema.parse(
      (await authed(() => adminAssignHireRequest(id, { user_id: userId }))).data,
    ),
  addNote: async (id: string, body: string) =>
    ActivitySchema.parse((await authed(() => adminAddHireRequestNote(id, { body }))).data),
  matches: async (id: string) =>
    MatchesSchema.parse((await authed(() => adminGetTalentMatches(id))).data),
  convert: async (id: string, body: EngagementCreate) =>
    EngagementSchema.parse((await authed(() => adminConvertToEngagement(id, body))).data),
  attachmentUrl: async (id: string) =>
    AttachmentUrlSchema.parse((await authed(() => adminGetAttachmentUrl(id))).data),
  users: async () => UsersSchema.parse((await authed(() => adminListUsers())).data),
  exportCsv: async (status?: StatusUpdate['status']) => {
    const res = await authed(() => adminExportHireRequests(status ? { status } : undefined));
    return String(res.data);
  },
};
