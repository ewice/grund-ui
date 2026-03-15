/**
 * Generates a unique ID string with the given prefix.
 * Uses `crypto.randomUUID()` for guaranteed uniqueness across
 * test runs, page navigations, and SSR/hydration scenarios.
 *
 * @param prefix - A short string prepended to the ID (e.g. 'trigger', 'panel')
 * @returns A unique string like `trigger-3f2a1b4c`
 */
export function generateId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}
