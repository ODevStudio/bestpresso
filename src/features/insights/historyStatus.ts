// Background sync is silent when saved history is already available.
export function historyStatus(hasCache: boolean, failed: boolean, complete = true): string | null {
  if (!hasCache) return failed ? 'History unavailable · retrying automatically' : 'Loading history…'
  if (failed) return 'Showing saved history · retrying automatically'
  return complete ? null : 'Limited history · cached records'
}
