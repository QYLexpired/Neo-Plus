import { mkdirSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { deflateSync } from 'zlib';
const __dirname = dirname(fileURLToPath(import.meta.url));
const outFile = resolve(__dirname, '../src/modules/liquidglassfilter.ts');
export type LiquidGlassProfileType = 'convex-round' | 'convex' | 'concave' | 'lip';
export interface LiquidGlassConfig {
  width?: number;
  height?: number;
  borderRadius?: number;
  bezelWidth?: number;
  thickness?: number;
  strength?: number;
  dispersion?: number;
  ior?: number;
  profileType?: LiquidGlassProfileType;
  dpr?: number;
  filterId: string;
}
export interface DisplacementTable {
  table: Float32Array;
  maxDisplacementPx: number;
}
export interface DisplacementMapData {
  data: Uint8ClampedArray;
  width: number;
  height: number;
  maxDisplacementPx: number;
}
const defaultConfig = {
  width: 200,
  height: 200,
  borderRadius: 75,
  bezelWidth: 20,
  thickness: 200,
  strength: 1,
  dispersion: 0,
  ior: 1.5,
  profileType: 'convex-round' as LiquidGlassProfileType,
  dpr: 1,
} as const;
export function resolveConfig(config: LiquidGlassConfig): Required<LiquidGlassConfig> {
  return { ...defaultConfig, ...config };
}
export function getProfileHeight(t: number, type: LiquidGlassProfileType): number {
  t = Math.max(0, Math.min(1, t));
  switch (type) {
    case 'convex':
      return Math.sqrt(1 - Math.pow(1 - t, 2));
    case 'concave':
      return 1 - Math.sqrt(1 - Math.pow(1 - t, 2));
    case 'lip': {
      const smootherstep = (x: number) => x * x * x * (x * (x * 6 - 15) + 10);
      const convexVal = Math.sqrt(1 - Math.pow(1 - t, 2));
      const concaveVal = 1 - Math.sqrt(1 - Math.pow(1 - t, 2));
      const mixFactor = smootherstep(t);
      return convexVal * (1 - mixFactor) + concaveVal * mixFactor;
    }
    case 'convex-round':
    default:
      return Math.pow(1 - Math.pow(1 - t, 4), 0.25);
  }
}
export function roundedRectSDF(x: number, y: number, width: number, height: number, radius: number): number {
  const px = Math.abs(x - width / 2);
  const py = Math.abs(y - height / 2);
  const sx = width / 2 - radius;
  const sy = height / 2 - radius;
  const qx = px - sx;
  const qy = py - sy;
  const dist = Math.sqrt(Math.max(qx, 0) ** 2 + Math.max(qy, 0) ** 2) + Math.min(Math.max(qx, qy), 0);
  return dist - radius;
}
export function computeDisplacementTable(config: LiquidGlassConfig): DisplacementTable {
  const { bezelWidth, thickness, ior, strength, profileType, dpr } = resolveConfig(config);
  const rBezel = bezelWidth * dpr;
  const rThickness = thickness * dpr;
  const steps = Math.ceil(rBezel) + 2;
  const table = new Float32Array(steps);
  const delta = 0.5;
  let maxPhysDisp = 0;
  for (let i = 0; i < steps; i++) {
    if (rBezel <= 0) {
      table[i] = 0;
      continue;
    }
    const pos1 = Math.max(0, (i - delta) / rBezel);
    const pos2 = Math.min(1, (i + delta) / rBezel);
    const h1 = getProfileHeight(pos1, profileType);
    const h2 = getProfileHeight(pos2, profileType);
    const slope = (h2 - h1) / (pos2 - pos1);
    const geometricSlope = (slope * rThickness) / rBezel;
    const incidentAngle = Math.atan(geometricSlope);
    const sinRefracted = Math.sin(incidentAngle) / ior;
    if (Math.abs(sinRefracted) >= 1) {
      table[i] = 0;
      continue;
    }
    const refractedAngle = Math.asin(sinRefracted);
    const deflection = incidentAngle - refractedAngle;
    const physDisp = Math.tan(deflection) * rThickness * strength;
    table[i] = physDisp;
    maxPhysDisp = Math.max(maxPhysDisp, Math.abs(physDisp));
  }
  return { table, maxDisplacementPx: Math.max(maxPhysDisp, 1) };
}
export function computeDisplacementMap(config: LiquidGlassConfig): DisplacementMapData {
  const { width, height, borderRadius, bezelWidth, dpr } = resolveConfig(config);
  const rw = Math.ceil(width * dpr);
  const rh = Math.ceil(height * dpr);
  const rBezel = bezelWidth * dpr;
  const rRadius = borderRadius * dpr;
  const data = new Uint8ClampedArray(rw * rh * 4);
  const { table, maxDisplacementPx } = computeDisplacementTable(config);
  const steps = table.length;
  const sdf = (x: number, y: number) => roundedRectSDF(x, y, rw, rh, rRadius);
  for (let y = 0; y < rh; y++) {
    for (let x = 0; x < rw; x++) {
      const idx = (y * rw + x) * 4;
      const dist = sdf(x, y);
      if (dist < 1.0 && dist > -rBezel) {
        const d = 1.0;
        const dx = sdf(x + d, y) - sdf(x - d, y);
        const dy = sdf(x, y + d) - sdf(x, y - d);
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const dirX = -dx / len;
        const dirY = -dy / len;
        const distFromEdge = -dist;
        const tableIdx = Math.max(0, Math.min(steps - 1, distFromEdge));
        const idxLow = Math.floor(tableIdx);
        const ratio = tableIdx - idxLow;
        const rawDisp = table[idxLow] * (1 - ratio) + table[Math.min(idxLow + 1, steps - 1)] * ratio;
        const normDisp = rawDisp / maxDisplacementPx;
        const outerAA = Math.max(0, Math.min(1, -dist + 1.0));
        const innerAA = Math.max(0, Math.min(1, dist + rBezel));
        const edgeAA = outerAA * innerAA;
        data[idx] = 128 + dirX * normDisp * 127 * edgeAA;
        data[idx + 1] = 128 + dirY * normDisp * 127 * edgeAA;
        data[idx + 2] = 0;
        data[idx + 3] = 255;
      } else {
        data[idx] = 128;
        data[idx + 1] = 128;
        data[idx + 2] = 0;
        data[idx + 3] = 255;
      }
    }
  }
  return { data, width: rw, height: rh, maxDisplacementPx };
}
export function buildFilterMarkup(config: LiquidGlassConfig, mapUrl: string, maxDisplacementPx: number): string {
  const { width, height, dispersion, dpr, filterId } = resolveConfig(config);
  const baseScale = maxDisplacementPx / dpr;
  const mapDef =
    `<feImage href="${mapUrl}" x="0" y="0" width="${width}" height="${height}" result="mapSource" preserveAspectRatio="none" />`;
  let filterLogic = '';
  if (dispersion <= 0.001) {
    filterLogic = `<feDisplacementMap in="SourceGraphic" in2="mapSource" scale="${baseScale}" xChannelSelector="R" yChannelSelector="G" result="refracted" />`;
  } else {
    const scaleR = baseScale * (1 - dispersion);
    const scaleG = baseScale;
    const scaleB = baseScale * (1 + dispersion);
    filterLogic = `<feDisplacementMap in="SourceGraphic" in2="mapSource" scale="${scaleR}" xChannelSelector="R" yChannelSelector="G" result="dispR" />
      <feColorMatrix in="dispR" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="R" />
      <feDisplacementMap in="SourceGraphic" in2="mapSource" scale="${scaleG}" xChannelSelector="R" yChannelSelector="G" result="dispG" />
      <feColorMatrix in="dispG" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="G" />
      <feDisplacementMap in="SourceGraphic" in2="mapSource" scale="${scaleB}" xChannelSelector="R" yChannelSelector="G" result="dispB" />
      <feColorMatrix in="dispB" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="B" />
      <feBlend in="R" in2="G" mode="screen" result="RG" />
      <feBlend in="RG" in2="B" mode="screen" result="refracted" />`;
  }
  return `
    <filter id="${filterId}" color-interpolation-filters="sRGB" x="-50%" y="-50%" width="200%" height="200%">
      ${mapDef}
      ${filterLogic}
      <feComposite in="refracted" in2="SourceGraphic" operator="in" />
    </filter>`;
}
export function buildSvgMarkup(config: LiquidGlassConfig, mapUrl: string, maxDisplacementPx: number): string {
  return `<svg>
    <defs>${buildFilterMarkup(config, mapUrl, maxDisplacementPx)}</defs>
  </svg>`;
}
const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();
function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function pngChunk(type: string, data: Uint8Array): Uint8Array {
  const len = new Uint8Array(4);
  new DataView(len.buffer).setUint32(0, data.length);
  const typeBytes = new TextEncoder().encode(type);
  const body = new Uint8Array(typeBytes.length + data.length);
  body.set(typeBytes);
  body.set(data, typeBytes.length);
  const crc = new Uint8Array(4);
  new DataView(crc.buffer).setUint32(0, crc32(body));
  const out = new Uint8Array(4 + body.length + 4);
  out.set(len, 0);
  out.set(body, 4);
  out.set(crc, 4 + body.length);
  return out;
}
function encodePngDataUrl(rgba: Uint8ClampedArray, width: number, height: number): string {
  const signature = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = new Uint8Array(13);
  const dv = new DataView(ihdr.buffer);
  dv.setUint32(0, width);
  dv.setUint32(4, height);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const stride = width * 4;
  const raw = new Uint8Array((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    raw.set(rgba.subarray(y * stride, (y + 1) * stride), y * (stride + 1) + 1);
  }
  const idat = deflateSync(raw, { level: 9 });
  const parts = [
    signature,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', new Uint8Array(0)),
  ];
  const total = parts.reduce((s, p) => s + p.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return 'data:image/png;base64,' + Buffer.from(out).toString('base64');
}
const presets: LiquidGlassConfig[] = [
  {
    width: 2000,
    height: 80,
    borderRadius: 0,
    bezelWidth: 20,
    thickness: 60,
    strength: 1,
    dispersion: 0,
    ior: 1.5,
    profileType: 'convex-round',
    dpr: 2,
    filterId: 'neo-superfusion-liquidglass',
  },
  {
    width: 400,
    height: 80,
    borderRadius: 0,
    bezelWidth: 20,
    thickness: 60,
    strength: 1,
    dispersion: 0,
    ior: 1.5,
    profileType: 'convex-round',
    dpr: 2,
    filterId: 'neo-superfusion-liquidglass-mobile',
  },
];
function escapeTemplate(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
}
function generate(): void {
  const entries = presets.map((cfg) => {
    const config = resolveConfig(cfg);
    const map = computeDisplacementMap(config);
    const url = encodePngDataUrl(map.data, map.width, map.height);
    const filter = buildFilterMarkup(config, url, map.maxDisplacementPx);
    return { id: config.filterId, filter };
  });
  const body = entries
    .map(({ id, filter }) => `  '${id}': \`${escapeTemplate(filter)}\`,`)
    .join('\n');
  const content = `export const liquidGlassFilters: Record<string, string> = {\n${body}\n};\n`;
  mkdirSync(dirname(outFile), { recursive: true });
  writeFileSync(outFile, content);
}
generate();
