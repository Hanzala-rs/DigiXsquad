'use client';

import {
  adminAddHireRequestNote,
  adminAssignHireRequest,
  adminConvertToEngagement,
  adminCreateTalent,
  adminDeleteTalent,
  adminExportHireRequests,
  adminGetAttachmentUrl,
  adminGetEngagement,
  adminGetHireRequest,
  adminGetTalent,
  adminGetTalentMatches,
  adminListEngagements,
  adminListHireRequests,
  adminListTalents,
  adminListUsers,
  adminRenewEngagement,
  adminUpdateEngagement,
  adminUpdateHireRequestStatus,
  adminUpdateTalent,
  getDashboardStats,
  listRoles,
  type AdminListEngagementsParams,
  type AdminListHireRequestsParams,
  type AdminListTalentsParams,
  type AdminRenewEngagementBody,
  type EngagementCreate,
  type EngagementUpdate,
  type StatusUpdate,
  type TalentInput,
} from '@digixsquad/api-client';
import {
  ActivitySchema,
  AttachmentUrlSchema,
  DashboardStatsSchema,
  EngagementPageSchema,
  EngagementSchema,
  HireRequestDetailSchema,
  HireRequestPageSchema,
  MatchesSchema,
  RolesSchema,
  TalentPageSchema,
  TalentSchema,
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
  roles: ['admin', 'roles'] as const,
  talents: (params: AdminListTalentsParams) => ['admin', 'talents', params] as const,
  talentsAll: ['admin', 'talents'] as const,
  talent: (id: string) => ['admin', 'talent', id] as const,
  engagements: (params: AdminListEngagementsParams) => ['admin', 'engagements', params] as const,
  engagementsAll: ['admin', 'engagements'] as const,
  engagement: (id: string) => ['admin', 'engagement', id] as const,
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
  /** Role catalog for pickers (public endpoint). */
  roles: async () => RolesSchema.parse((await listRoles()).data),
  listTalents: async (params: AdminListTalentsParams) =>
    TalentPageSchema.parse((await authed(() => adminListTalents(params))).data),
  getTalent: async (id: string) =>
    TalentSchema.parse((await authed(() => adminGetTalent(id))).data),
  /** Create when `id` is null, otherwise replace. */
  saveTalent: async (id: string | null, body: TalentInput) =>
    TalentSchema.parse(
      (id
        ? await authed(() => adminUpdateTalent(id, body))
        : await authed(() => adminCreateTalent(body))
      ).data,
    ),
  deactivateTalent: async (id: string) => void (await authed(() => adminDeleteTalent(id))),
  listEngagements: async (params: AdminListEngagementsParams) =>
    EngagementPageSchema.parse((await authed(() => adminListEngagements(params))).data),
  getEngagement: async (id: string) =>
    EngagementSchema.parse((await authed(() => adminGetEngagement(id))).data),
  updateEngagement: async (id: string, body: EngagementUpdate) =>
    EngagementSchema.parse((await authed(() => adminUpdateEngagement(id, body))).data),
  renewEngagement: async (id: string, body: AdminRenewEngagementBody) =>
    EngagementSchema.parse((await authed(() => adminRenewEngagement(id, body))).data),
  exportCsv: async (status?: StatusUpdate['status']) => {
    const res = await authed(() => adminExportHireRequests(status ? { status } : undefined));
    return String(res.data);
  },
};
