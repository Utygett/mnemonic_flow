// Public API for group entity
export type { Group, GroupCreatePayload, UserGroupResponse } from './model/types'
export {
  getUserGroups,
  getGroupDecksSummary,
  createGroup,
  deleteGroup,
  addDeckToGroup,
  removeDeckFromGroup,
} from './api/groupsApi'
