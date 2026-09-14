export type InitialHueRule = 'theme' | 'fixed' | 'accent';
export type ColorStyle = 'soft' | 'default' | 'vivid';
export const defaultInitialHue = 0;
export function normalizeInitialHue(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return defaultInitialHue;
  return Math.min(360, Math.max(0, Math.round(parsed)));
}
export function normalizeColorStyle(value: unknown): ColorStyle {
  if (value === 'soft' || value === 'vivid') return value;
  return 'default';
}
export function normalizeInitialHueRule(value: unknown): InitialHueRule {
  return value === 'fixed' || value === 'accent' ? value : 'theme';
}
