export type Progress = { seal: number; flap: number; pull: number };
export const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
export const smooth = (n: number) => n * n * (3 - 2 * n);

export function shadeHex(hex: string, amount: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const target = amount < 0 ? 0 : 255;
  const t = Math.min(1, Math.abs(amount));
  const ch = (v: number) => Math.round(v + (target - v) * t);
  const r = ch((n >> 16) & 255);
  const g = ch((n >> 8) & 255);
  const b = ch(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}
