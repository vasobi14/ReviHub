export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    const fieldErrors = (err as { fieldErrors?: Record<string, string> })
      .fieldErrors;
    if (fieldErrors) {
      const messages = [...new Set(Object.values(fieldErrors))];
      if (messages.length > 0) return messages.join('; ');
    }
    return err.message;
  }
  if (typeof err === 'string') return err;
  return 'Something went wrong';
}
