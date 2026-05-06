export function getApiErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const axiosErr = err as { response?: { data?: { message?: string } } };
    return axiosErr.response?.data?.message ?? 'Something went wrong. Please try again.';
  }
  if (err instanceof Error) return err.message;
  return 'Something went wrong. Please try again.';
}
