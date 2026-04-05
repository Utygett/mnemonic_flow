// entities/comment/index.ts

export type { Comment, CreateCommentRequest } from './model/types'
export { getComments, createComment, deleteComment } from './api/commentsApi'
