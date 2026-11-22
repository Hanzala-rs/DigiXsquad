/**
 * Response schemas used to narrow generated response unions (the generated `data` type includes
 * error bodies even though apiFetch throws on non-2xx). Re-exported under readable names.
 */
export {
  AdminConvertToEngagementResponse as EngagementSchema,
  AdminGetAttachmentUrlResponse as AttachmentUrlSchema,
  AdminGetHireRequestResponse as HireRequestDetailSchema,
  AdminGetTalentMatchesResponse as MatchesSchema,
  AdminListHireRequestsResponse as HireRequestPageSchema,
  AdminListUsersResponse as UsersSchema,
  GetDashboardStatsResponse as DashboardStatsSchema,
  GetMeResponse as AuthUser,
  AdminAddHireRequestNoteResponse as ActivitySchema,
} from '@digixsquad/api-client/zod';
