// entities/comment/model/types.ts

export interface Comment {
  id: string
  content: string
  created_at: string // ISO 8601 datetime string from backend (snake_case to match API)
  author_username: string // Username from backend (snake_case to match API)
}

export interface CreateCommentRequest {
  content: string
}
