// Must match --dur-search-leave, --dur-stagger, and --stagger-max-index in tokens.css
export const SEARCH_LEAVE_MS = 200;
export const SEARCH_STAGGER_MS = 32;
export const SEARCH_STAGGER_MAX_INDEX = 8;

export function searchLeaveDurationMs(itemCount: number): number {
  const capped = Math.min(Math.max(itemCount - 1, 0), SEARCH_STAGGER_MAX_INDEX);
  return SEARCH_LEAVE_MS + capped * SEARCH_STAGGER_MS;
}
