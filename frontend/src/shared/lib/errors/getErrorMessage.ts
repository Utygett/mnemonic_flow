export function getErrorMessage(e: unknown): string {
  if (!e) return '';

  if (typeof e === 'string') return e;

  if (e instanceof Error) {
    const anyErr = e as any;
    if (typeof anyErr?.detail === 'string' && anyErr.detail) return anyErr.detail;
    return e.message;
  }

  const anyErr = e as any;
  if (typeof anyErr?.detail === 'string' && anyErr.detail) return anyErr.detail;
  if (typeof anyErr?.message === 'string' && anyErr.message) return anyErr.message;

  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
}
