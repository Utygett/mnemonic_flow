// src/shared/lib/utils/error-message.ts
import { ApiError } from '../../api';

export function getErrorMessage(e: unknown): string {
  if (e instanceof ApiError) return e.detail ?? e.message;
  if (e instanceof Error) return e.message;
  if (typeof e === 'string') return e;
  return 'Неизвестная ошибка';
}
