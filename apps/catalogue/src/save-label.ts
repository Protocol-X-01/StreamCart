/** Describe the public, privacy-bucketed save count without implying an exact total. */
export function formatSaveCount(value: unknown): string {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 5) {
    return 'Save count hidden for privacy';
  }
  return `${Math.floor(value / 5) * 5}+ save actions`;
}
