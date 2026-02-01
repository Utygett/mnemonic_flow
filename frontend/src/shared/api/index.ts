// Shared API exports
export { apiRequest, ApiError } from './request'

// Auth helpers (keep backwards-compatible names)
export { login as loginWithCredentials, register as registerUser, getMe } from './auth-client'

// Stats
export { getStatsOverview } from './stats-client'
