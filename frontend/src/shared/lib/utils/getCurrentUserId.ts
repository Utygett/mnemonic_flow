// Get current user ID from JWT token in localStorage
export function getCurrentUserId(): string | null {
  try {
    const token = localStorage.getItem('access_token')
    if (!token) return null

    const parts = token.split('.')
    if (parts.length !== 3) return null

    const payload = JSON.parse(atob(parts[1]))
    return payload.sub ?? null
  } catch {
    return null
  }
}
