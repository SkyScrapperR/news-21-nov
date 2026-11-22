// art.ts — hand-coded illustrations. Every drawing is built from paths in code: no photos, no logos.
import { Canvas, Path, hex, mix, drawText, measure, Font, type RGB, type Pt } from './gfx.ts';
import type { Story } from './news.ts';

export type Art = (cv: Canvas, x: number, y: number, w: number, h: number, s: Story) => void;
const F = (n: string) => new Font(new URL('./fonts/' + n, import.meta.url));
export const fK = F('Lato-Black.ttf'), fB = F('Lato-Bold.ttf'), fR = F('Lato-Regular.ttf'), fS = F('DMSerifDisplay-Regular.ttf');

export const P = {
  ink: hex('#1a1915'), paper: hex('#f7f2e6'), white: hex('#fffdf6'), red: hex('#b4231b'), sky: hex('#cfe0e8'), sky2: hex('#9fbfcf'),
  night: hex('#1d2a40'), night2: hex('#33476a'), sand: hex('#d9c49a'), earth: hex('#8a6a45'), green: hex('#4f8a4b'), sea: hex('#3f78a0'),
  gold: hex('#e3b23c'), grey: hex('#8d8b86'), lgrey: hex('#c9c5bb'), orange: hex('#e07a2e'),
};

// ---------------------------------------------------------------- primitives
export function skyline(cv: Canvas, x: number, y: number, w: number, base: number, col: RGB, seed: number, hmin = 10, hmax = 34, lit?: RGB) {
  let r = seed;
  const rnd = () => { r = (r * 1103515245 + 12345) % 2147483648; return r / 2147483648; };
  let cx = x;
  while (cx < x + w) {
    const bw = 8 + rnd() * 14, bh = hmin + rnd() * (hmax - hmin);
    cv.rect(cx, base - bh, bw, bh + 1, col);
    if (lit) for (let wy = base - bh + 4; wy < base - 3; wy += 5) for (let wx = cx + 2; wx < cx + bw - 2; wx += 4) if (rnd() > 0.55) cv.rect(wx, wy, 1.6, 2, lit);
    cx += bw + 1 + rnd() * 3;
  }
}
export function globe(cv: Canvas, cx: number, cy: number, r: number, sea: RGB, land: RGB) {
  cv.circle(cx, cy, r, sea);
  const p = new Path();
  p.poly([cx - r * 0.7, cy - r * 0.5, cx - r * 0.2, cy - r * 0.75, cx + r * 0.05, cy - r * 0.35, cx - r * 0.25, cy - r * 0.05, cx - r * 0.1, cy + r * 0.4, cx - r * 0.45, cy + r * 0.7, cx - r * 0.75, cy + r * 0.1]);
  p.poly([cx + r * 0.25, cy - r * 0.6, cx + r * 0.75, cy - r * 0.45, cx + r * 0.85, cy + r * 0.05, cx + r * 0.45, cy + r * 0.2, cx + r * 0.35, cy + r * 0.65, cx + r * 0.15, cy + r * 0.2]);
  cv.fill(p, land);
  cv.line(new Path().ellipse(cx, cy, r, r).polys[0], 1.2, mix(sea, P.ink, 0.4), 1, true);
}
export function seismo(cv: Canvas, x: number, y: number, w: number, amp: number, col: RGB, lw = 1.6, peak = 0.55) {
  const pts: Pt[] = [];
  let r = 7;
  const rnd = () => { r = (r * 16807) % 2147483647; return r / 2147483647 - 0.5; };
  for (let i = 0; i <= 120; i++) {
    const t = i / 120;
    const env = Math.exp(-Math.pow((t - peak) / 0.09, 2)) + 0.06;
    pts.push([x + t * w, y + rnd() * 2 * amp * env * (i % 2 ? 1 : -1)]);
  }
  cv.line(pts, lw, col);
}
export function bars(cv: Canvas, x: number, y: number, w: number, h: number, vals: number[], col: RGB, hi = -1, hiCol = P.red) {
  const mx = Math.max(...vals), bw = w / vals.length;
  vals.forEach((v, i) => { const bh = (v / mx) * h; cv.rect(x + i * bw + 1, y + h - bh, bw - 2, bh, i === hi ? hiCol : col); });
}
export function arrow(cv: Canvas, a: Pt, b: Pt, lw: number, col: RGB, head = 6) {
  cv.line([a, b], lw, col);
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
  const p = new Path().poly([b[0] + Math.cos(ang) * head * 0.6, b[1] + Math.sin(ang) * head * 0.6,
    b[0] + Math.cos(ang + 2.5) * head, b[1] + Math.sin(ang + 2.5) * head, b[0] + Math.cos(ang - 2.5) * head, b[1] + Math.sin(ang - 2.5) * head]);
  cv.fill(p, col);
}
export function text(cv: Canvas, font: Font, size: number, col: RGB, s: string, x: number, y: number, al: 'l' | 'c' | 'r' = 'l', track = 0) {
  return drawText(cv, { font, size, color: col, track }, s, x, y, al);
}
export function tw(font: Font, size: number, s: string) { return measure({ font, size, color: P.ink }, s); }
export function person(cv: Canvas, cx: number, base: number, s: number, col: RGB) {
  cv.circle(cx, base - s * 2.35, s * 0.42, col);
  cv.fill(new Path().roundRect(cx - s * 0.55, base - s * 1.85, s * 1.1, s * 1.85, s * 0.4), col);
}
export function podium(cv: Canvas, cx: number, base: number, s: number, col: RGB) {
  cv.fill(new Path().poly([cx - s, base, cx + s, base, cx + s * 0.8, base - s * 1.3, cx - s * 0.8, base - s * 1.3]), col);
}

function polyLL(pts: number[], f: (lon: number, lat: number) => Pt): Path {
  const p = new Path();
  const a = f(pts[0], pts[1]); p.moveTo(a[0], a[1]);
  for (let i = 2; i < pts.length; i += 2) { const b = f(pts[i], pts[i + 1]); p.lineTo(b[0], b[1]); }
  return p.close();
}
function burst(cv: Canvas, cx: number, cy: number, r: number, col: RGB, inner: RGB) {
  const pts: number[] = [];
  for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2, rr = i % 2 ? r * 0.45 : r; pts.push(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
  cv.fill(new Path().poly(pts), col);
  cv.circle(cx, cy, r * 0.3, inner);
}
function tanker(cv: Canvas, cx: number, cy: number, s: number, col: RGB) {
  cv.fill(new Path().poly([cx - s, cy - s * 0.2, cx + s * 0.8, cy - s * 0.2, cx + s, cy, cx + s * 0.8, cy + s * 0.3, cx - s * 0.9, cy + s * 0.3]), col);
  cv.rect(cx - s * 0.85, cy - s * 0.55, s * 0.3, s * 0.36, col);
}
function dashed(cv: Canvas, a: Pt, b: Pt, lw: number, col: RGB, dash = 4, gap = 3, curve = 0) {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const nx = -(b[1] - a[1]) / L, ny = (b[0] - a[0]) / L;
  const P = (t: number): Pt => [a[0] + (b[0] - a[0]) * t + nx * curve * 4 * t * (1 - t), a[1] + (b[1] - a[1]) * t + ny * curve * 4 * t * (1 - t)];
  for (let d = 0; d < L; d += dash + gap) {
    const t0 = d / L, t1 = Math.min(1, (d + dash) / L);
    const seg: Pt[] = []; for (let k = 0; k <= 4; k++) seg.push(P(t0 + ((t1 - t0) * k) / 4));
    cv.line(seg, lw, col);
  }
}
function label(cv: Canvas, s: string, x: number, y: number, size: number, col: RGB, bg?: RGB, al: 'l' | 'c' | 'r' = 'l') {
  const w = tw(fK, size, s);
  const lx = al === 'c' ? x - w / 2 : al === 'r' ? x - w : x;
  if (bg) cv.rect(lx - 2.5, y - size * 0.9, w + 5, size * 1.2, bg);
  text(cv, fK, size, col, s, lx, y);
}

// ---------------------------------------------------------------- hero 1: the Gulf
const gulf: Art = (cv, x, y, w, h) => {
  const sea = hex('#bcd3df');
  cv.rect(x, y, w, h, sea);
  const lon0 = 47.6, lon1 = 57.9, lat0 = 30.2, lat1 = 22.6;
  const f = (lon: number, lat: number): Pt => [x + ((lon - lon0) / (lon1 - lon0)) * w, y + ((lat0 - lat) / (lat0 - lat1)) * h];
  const land = hex('#e4d5b0'), land2 = hex('#d8c79c');
  // Iran (north shore)
  cv.fill(polyLL([47.6, 30.2, 47.6, 30.0, 48.6, 30.0, 49.6, 29.9, 50.2, 29.2, 50.7, 28.6, 51.2, 27.9, 52.0, 27.6, 52.8, 27.2, 53.7, 26.8, 54.6, 26.5,
    55.4, 26.6, 56.0, 27.05, 56.6, 27.1, 57.2, 26.6, 57.4, 25.8, 57.9, 25.7, 57.9, 30.2], f), land2);
  // Arabia: Kuwait – Saudi – Qatar – UAE – Musandam – Oman
  cv.fill(polyLL([47.6, 29.6, 48.2, 29.4, 48.5, 28.4, 49.2, 27.4, 49.9, 26.8, 50.2, 26.2, 50.1, 25.8, 50.7, 25.2, 50.8, 24.8, 50.85, 25.6, 51.05, 26.1,
    51.4, 26.1, 51.6, 25.3, 51.6, 24.6, 52.3, 24.15, 53.4, 24.1, 54.2, 24.3, 54.7, 24.6, 55.4, 25.3, 55.9, 25.7, 56.08, 26.05, 56.2, 26.35, 56.35, 26.39,
    56.42, 26.1, 56.38, 25.6, 56.37, 24.9, 56.6, 24.4, 57.5, 23.75, 57.9, 23.6, 57.9, 22.6, 47.6, 22.6], f), land);
  // Bahrain
  const [bx, by] = f(50.55, 26.03);
  cv.fill(new Path().ellipse(bx, by, 2.6, 4.4), land);
  // attack arcs from Iran to Bahrain
  dashed(cv, f(51.6, 27.75), [bx + 2, by - 4], 1.3, P.red, 4, 3, -8);
  burst(cv, bx - 1, by - 2, 7, P.red, hex('#ffd27a'));
  burst(cv, bx + 2, by + 4, 5, P.red, hex('#ffd27a'));
  label(cv, 'BAHRAIN', bx - 9, by + 2, 8, P.ink, undefined, 'r');
  text(cv, fB, 7, P.ink, 'Al-Rafa · Awali bases', bx - 9, by + 11, 'r');
  text(cv, fB, 7, P.ink, 'plant fire · no injuries', bx - 9, by + 20, 'r');
  label(cv, 'IRAN', f(53.5, 27.5)[0], f(53.5, 27.5)[1], 9, mix(P.ink, P.paper, 0.35), undefined, 'c');
  label(cv, 'QATAR', f(51.25, 25.2)[0], f(51.25, 25.2)[1], 6.5, mix(P.ink, P.paper, 0.4), undefined, 'c');
  label(cv, 'UAE', f(54.3, 23.6)[0], f(54.3, 23.6)[1], 7, mix(P.ink, P.paper, 0.4), undefined, 'c');
  // Hormuz zoom box
  const [hx, hy] = f(56.3, 26.3);
  cv.line([[hx - 9, hy - 9], [hx + 9, hy - 9], [hx + 9, hy + 9], [hx - 9, hy + 9]], 1, P.ink, 1, true);
  const ix = x + w - 112, iy = y + 6, iw = 106, ih = 74;
  cv.line([[hx - 9, hy - 9], [ix, iy + ih]], 0.7, P.ink, 0.6);
  cv.rect(ix - 1.5, iy - 1.5, iw + 3, ih + 3, P.ink);
  cv.setClip(ix, iy, iw, ih);
  cv.rect(ix, iy, iw, ih, sea);
  const z0 = 55.95, z1 = 56.85, za = 26.62, zb = 25.98;
  const g = (lon: number, lat: number): Pt => [ix + ((lon - z0) / (z1 - z0)) * iw, iy + ((za - lat) / (za - zb)) * ih];
  cv.fill(polyLL([55.95, 25.98, 55.95, 25.95, 56.08, 26.05, 56.15, 26.2, 56.2, 26.35, 56.3, 26.38, 56.37, 26.33, 56.42, 26.15, 56.4, 25.98], g), land);
  cv.fill(polyLL([55.95, 26.62, 56.85, 26.62, 56.85, 26.5, 56.5, 26.56, 56.2, 26.58, 55.95, 26.55], g), land2);
  const [kx, ky] = g(56.24, 26.18);
  cv.circle(kx, ky, 2.2, P.ink);
  text(cv, fB, 7, P.ink, 'Khasab', kx - 3, ky + 9, 'r');
  const ta = g(56.24, 26.37), tb = g(56.55, 26.18);
  dashed(cv, [kx, ky], ta, 0.8, P.ink, 2, 2); dashed(cv, [kx, ky], tb, 0.8, P.ink, 2, 2);
  tanker(cv, ta[0], ta[1], 7, P.ink); burst(cv, ta[0] - 4, ta[1] - 3, 4.5, P.red, hex('#ffd27a'));
  tanker(cv, tb[0], tb[1], 7, P.ink); burst(cv, tb[0] + 1, tb[1] - 3, 4.5, P.red, hex('#ffd27a'));
  label(cv, '05:00 · 11 nm N', ta[0] + 10, ta[1] + 2, 6.8, P.white, P.ink);
  label(cv, '05:50 · 17 nm E', tb[0] - 26, tb[1] + 14, 6.8, P.white, P.ink);
  cv.noClip();
  text(cv, fK, 7, P.ink, 'STRAIT OF HORMUZ (UTC)', ix + iw / 2, iy + ih + 9, 'c');
};

// ---------------------------------------------------------------- hero 2: Peru quake cross-section
const quake: Art = (cv, x, y, w, h) => {
  cv.vgrad(x, y, w, h * 0.6, hex('#f4e7cf'), hex('#ead9b8'));
  const surf = y + h * 0.56, depthPx = (h - (surf - y) - 22) / 150; // 0..150 km
  // crust/mantle bands
  cv.vgrad(x, surf, w, h - (surf - y), hex('#c9a77a'), hex('#8e6a47'));
  // subducting Nazca slab (pale band dipping east)
  const slab = new Path().poly([x, surf + 4, x + w * 0.25, surf + 14, x + w, surf + 150 * depthPx * 0.95, x + w, surf + 150 * depthPx * 0.95 + 14, x + w * 0.25, surf + 28, x, surf + 16]);
  cv.fill(slab, hex('#6f8fa3'), 0.55);
  text(cv, fB, 6.8, P.white, 'Nazca plate', x + w * 0.3, surf + 30);
  // surface profile: Pacific, coast (Lima), Andes, Ondores
  const sea = new Path().poly([x, surf - 1, x + w * 0.2, surf - 1, x + w * 0.2, surf + 3, x, surf + 3]);
  cv.fill(sea, hex('#3f78a0'));
  const mts = new Path().poly([x + w * 0.2, surf, x + w * 0.27, surf - 4, x + w * 0.36, surf - 14, x + w * 0.42, surf - 26, x + w * 0.48, surf - 19, x + w * 0.55, surf - 30,
    x + w * 0.62, surf - 22, x + w * 0.7, surf - 27, x + w * 0.8, surf - 18, x + w * 0.9, surf - 10, x + w, surf - 6, x + w, surf + 1, x + w * 0.2, surf + 1]);
  cv.fill(mts, hex('#7d6247'));
  cv.fill(new Path().poly([x + w * 0.42, surf - 26, x + w * 0.445, surf - 21, x + w * 0.4, surf - 22]), P.white);
  cv.fill(new Path().poly([x + w * 0.55, surf - 30, x + w * 0.575, surf - 24, x + w * 0.53, surf - 25]), P.white);
  // Lima
  const lx = x + w * 0.22;
  cv.rect(lx - 4, surf - 7, 3, 7, P.ink); cv.rect(lx, surf - 10, 3, 10, P.ink); cv.rect(lx + 4, surf - 6, 3, 6, P.ink);
  label(cv, 'LIMA (felt)', lx - 4, surf + 12, 7, P.white);
  // epicentre & hypocentre
  const ex = x + w * 0.66;
  const hyUsgs = surf + 108 * depthPx, hyIgp = surf + 129 * depthPx;
  for (let r = 1; r <= 4; r++) cv.line(new Path().ellipse(ex, hyIgp - 6, r * 13, r * 9).polys[0], 0.9, P.red, 0.55 - r * 0.1, true);
  dashed(cv, [ex, surf - 22], [ex, hyUsgs - 6], 1, P.ink, 3, 2);
  burst(cv, ex, hyIgp - 6, 9, P.red, hex('#ffd27a'));
  cv.circle(ex, surf - 24, 3, P.red);
  label(cv, 'ONDORES', ex + 7, surf - 15, 7, P.white);
  // depth axis
  const ax = x + w - 22;
  cv.vline(ax, surf, surf + 150 * depthPx, 1, P.white);
  for (const d of [0, 50, 100, 150]) { cv.hline(ax - 3, ax + 3, surf + d * depthPx, 1, P.white); text(cv, fB, 6.5, P.white, String(d), ax + 5, surf + d * depthPx + 2.5); }
  text(cv, fB, 6.5, P.white, 'km', ax + 5, surf - 4);
  label(cv, 'USGS 108 km', ex - 14, hyUsgs - 7, 6.8, P.white, mix(P.ink, P.red, 0.25), 'r');
  label(cv, 'IGP 129 km', ex - 14, hyIgp + 4, 6.8, P.white, mix(P.ink, P.red, 0.25), 'r');
  // seismogram strip
  const sx = x + w * 0.5, sy = y + 18;
  cv.rect(sx, y + 6, w * 0.5 - 6, 26, P.white, 0.85);
  seismo(cv, sx + 4, sy, w * 0.5 - 14, 10, P.red, 1.1, 0.35);
  text(cv, fB, 6.5, P.ink, 'M6.7 · Fri 19:09 local', sx + 4, y + 29);
};

// ---------------------------------------------------------------- hero 3: COP31 overtime
const cop: Art = (cv, x, y, w, h) => {
  cv.vgrad(x, y, w, h, hex('#dfeadf'), hex('#c7d9c8'));
  const tx = x + w - 13;
  cv.rrect(tx - 3.5, y + 8, 7, 46, 3.5, P.white); cv.circle(tx, y + 58, 6, P.red); cv.rect(tx - 1.6, y + 22, 3.2, 36, P.red);
  label(cv, '1.5°C', tx - 9, y + 16, 7, P.ink, undefined, 'r');
  // calendar: 9–21 November, 12 scheduled + 1 overtime
  const n = 13, cx0 = x + 8, cw = (w - 16) / n, cy = y + 74, ch = 22;
  text(cv, fK, 7, P.ink, 'NOVEMBER 2026 · scheduled 9–20 · overtime 21', cx0, cy - 4);
  for (let i = 0; i < n; i++) {
    const over = i === 12;
    cv.rect(cx0 + i * cw + 1, cy, cw - 2, ch, over ? P.red : hex('#fdfbf3'));
    if (!over) cv.rect(cx0 + i * cw + 1, cy, cw - 2, 4, hex('#4f8a4b'));
    text(cv, fK, 9, over ? P.white : P.ink, String(9 + i), cx0 + i * cw + cw / 2, cy + 17, 'c');
  }
  cv.vline(cx0 + 12 * cw, cy - 3, cy + ch + 3, 2, P.ink);
  // deadline clock: 03:00 GMT objections, 06:00 approval
  const kx = x + w * 0.62, ky = y + 32, r = 17;
  cv.circle(kx, ky, r + 2, P.ink); cv.circle(kx, ky, r, P.white);
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; cv.line([[kx + Math.cos(a) * (r - 3), ky + Math.sin(a) * (r - 3)], [kx + Math.cos(a) * (r - 1), ky + Math.sin(a) * (r - 1)]], 1, P.ink); }
  cv.line([[kx, ky], [kx + r * 0.55, ky]], 2, P.ink); // 3 o'clock
  cv.line([[kx, ky], [kx, ky - r * 0.8]], 1.4, P.ink);
  cv.circle(kx, ky, 2, P.red);
  text(cv, fK, 7, P.ink, 'objections by', kx + r + 6, ky - 6);
  text(cv, fK, 7, P.red, '03:00 GMT', kx + r + 6, ky + 3);
  text(cv, fB, 6.8, P.ink, 'approval Sun 06:00', kx + r + 6, ky + 12);
};

// ---------------------------------------------------------------- tiles
const ship: Art = (cv, x, y, w, h) => {
  cv.vgrad(x, y, w, h, hex('#cbd9e2'), hex('#7fa1b8'));
  const sy = y + h * 0.68;
  cv.rect(x, sy, w, h - (sy - y), hex('#3f6f8f'));
  const sx = x + 26;
  cv.fill(new Path().poly([sx, sy - 10, sx + 92, sy - 10, sx + 84, sy + 4, sx + 6, sy + 4]), hex('#2b2b2b'));
  for (let i = 0; i < 4; i++) cv.rect(sx + 18 + i * 15, sy - 19, 13, 9, [hex('#b4231b'), hex('#2a6f97'), hex('#d4a017'), hex('#4f8a4b')][i]);
  cv.rect(sx + 76, sy - 24, 12, 14, P.white); cv.rect(sx + 79, sy - 30, 4, 6, P.ink);
  // smoke + fire
  for (let i = 0; i < 5; i++) cv.circle(sx + 30 + i * 7, sy - 26 - i * 4, 5 + i, hex('#555555'), 0.5);
  burst(cv, sx + 30, sy - 20, 6, P.orange, hex('#ffe08a'));
  // two drones on dashed track
  for (const [dx, dy] of [[x + w - 46, y + 12], [x + w - 30, y + 22]] as Pt[]) {
    cv.line([[dx - 6, dy], [dx + 6, dy]], 1.6, P.ink); cv.line([[dx, dy - 3], [dx, dy + 3]], 1.4, P.ink);
  }
  dashed(cv, [x + w - 40, y + 16], [sx + 40, sy - 22], 1, P.red, 3, 2, 6);
  label(cv, 'SPARTA II', sx + 2, sy + 13, 7, P.white);
  label(cv, '2 drones', x + w - 50, y + 31, 7, P.ink, P.white);
};
const robot: Art = (cv, x, y, w, h) => {
  cv.vgrad(x, y, w, h, hex('#d6e3f0'), hex('#a9c3dd'));
  const rx = x + 34, ry = y + 12;
  cv.rrect(rx - 16, ry, 32, 22, 5, hex('#5b6770'));
  cv.circle(rx - 7, ry + 10, 3.5, P.red); cv.circle(rx + 7, ry + 10, 3.5, P.red);
  cv.rect(rx - 1, ry - 6, 2, 6, hex('#5b6770')); cv.circle(rx, ry - 7, 2.5, P.red);
  cv.rrect(rx - 13, ry + 24, 26, 20, 3, hex('#5b6770'));
  cv.line([[rx - 13, ry + 30], [rx - 24, ry + 40]], 3, hex('#5b6770')); cv.line([[rx + 13, ry + 30], [rx + 24, ry + 40]], 3, hex('#5b6770'));
  // hand-raised "stop" palm over it
  text(cv, fS, 26, P.ink, '128', x + 72, y + 27);
  text(cv, fB, 7.5, P.ink, 'states in agreement', x + 72, y + 36);
  label(cv, '→ 2028', x + w - 8, y + 16, 9, P.white, P.ink, 'r');
};
const wanted: Art = (cv, x, y, w, h) => {
  cv.vgrad(x, y, w, h, hex('#e9dcc0'), hex('#d5c19b'));
  const px = x + 14, py = y + 4, pw = 50, ph = 44;
  cv.rect(px, py, pw, ph, hex('#fbf4e2')); cv.strokeRect(px, py, pw, ph, 1, P.ink);
  label(cv, 'WANTED', px + pw / 2, py + 10, 8, P.red, undefined, 'c');
  person(cv, px + pw / 2, py + 40, 9, P.ink);
  label(cv, '$5M', px + pw / 2, py + ph - 1.5, 8, P.white, P.ink, 'c');
  // handcuffs
  const hx = x + 110, hy = y + 26;
  cv.line(new Path().ellipse(hx - 13, hy, 10, 10).polys[0], 3, hex('#6b6b6b'), 1, true);
  cv.line(new Path().ellipse(hx + 13, hy, 10, 10).polys[0], 3, hex('#6b6b6b'), 1, true);
  cv.line([[hx - 3, hy], [hx + 3, hy]], 2.4, hex('#6b6b6b'));
  text(cv, fB, 7.5, P.ink, 'FBI Top Ten', hx + 28, hy - 6);
  text(cv, fB, 7.5, P.ink, 'Guasave', hx + 28, hy + 4);
};
const trade: Art = (cv, x, y, w, h) => {
  cv.vgrad(x, y, w, h, hex('#e8eef5'), hex('#cfdbe8'));
  // ring of 12 stars (left) and red/white block (right) joined by a pen line
  const sx = x + 26, sy = y + 22;
  cv.circle(sx, sy, 17, hex('#1f4e9a'));
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; cv.circle(sx + Math.cos(a) * 11, sy + Math.sin(a) * 11, 1.6, hex('#f2c230')); }
  const fx = x + 62;
  cv.rect(fx, sy - 12, 30, 12, P.red); cv.rect(fx, sy, 30, 12, P.white); cv.strokeRect(fx, sy - 12, 30, 24, 0.8, P.ink);
  // bar: 90.4% duty-free from day one
  const bx = x + 102, bw = w - 110;
  text(cv, fS, 20, P.ink, '90.4%', bx, y + 20);
  cv.rect(bx, y + 24, bw, 6, hex('#ffffff')); cv.rect(bx, y + 24, bw * 0.904, 6, hex('#2a87b8'));
  text(cv, fB, 7, P.ink, 'tariff lines at 0%', bx, y + 37);
};
const plant: Art = (cv, x, y, w, h) => {
  cv.vgrad(x, y, w, h, hex('#3b3a40'), hex('#7a5547'));
  const base = y + h - 6;
  cv.rect(x, base, w, 6, hex('#2a2724'));
  cv.rect(x + 18, base - 22, 64, 22, hex('#5a5a5e'));
  for (const [cx, ch] of [[30, 44], [46, 50], [62, 44]] as Pt[]) cv.fill(new Path().poly([x + cx - 5, base - 22, x + cx + 5, base - 22, x + cx + 3, base - 22 - ch * 0.7, x + cx - 3, base - 22 - ch * 0.7]), hex('#6c6c70'));
  for (let i = 0; i < 9; i++) {
    const fx = x + 20 + (i * 7) % 62, fh = 10 + ((i * 37) % 13);
    cv.fill(new Path().poly([fx - 5, base - 22, fx + 5, base - 22, fx + 1, base - 22 - fh]), i % 2 ? P.orange : hex('#f2c230'));
  }
  // pylons
  cv.line([[x + 100, base], [x + 106, base - 34], [x + 112, base]], 1.4, hex('#c9c5bb'));
  cv.line([[x + 101, base - 22], [x + 111, base - 22]], 1.2, hex('#c9c5bb'));
  text(cv, fK, 11, P.white, '800 MW', x + 122, y + 16);
  text(cv, fK, 9, hex('#ffcf8a'), '4 dead · 35 hurt', x + 122, y + 28);
};
const chart: Art = (cv, x, y, w, h) => {
  cv.rect(x, y, w, h, hex('#f1ece0'));
  const vals = [100, 96.9, 93.8, 90.7, 87.6, 82.1]; // reported: ~-18% week, -6.23% Friday; Mon–Thu drawn as a straight line
  const cx = x + 10, cw = w - 70, top = y + 8, ch = h - 18;
  for (let i = 0; i <= 3; i++) cv.hline(cx, cx + cw, top + (ch * i) / 3, 0.6, hex('#d1c9b5'));
  const pts: Pt[] = vals.map((v, i) => [cx + (cw * i) / (vals.length - 1), top + ((100 - v) / 20) * ch]);
  cv.fill(new Path().poly([cx, top + ch, ...pts.flat(), cx + cw, top + ch]), P.red, 0.12);
  cv.line(pts, 2, P.red);
  ['M', 'T', 'W', 'T', 'F'].forEach((d, i) => text(cv, fB, 6.5, P.grey, d, cx + (cw * (i + 1)) / 5, y + h - 2, 'c'));
  text(cv, fS, 20, P.red, '−18%', x + w - 6, y + 24, 'r');
  text(cv, fB, 7, P.ink, 'TAIEX week', x + w - 6, y + 34, 'r');
};
const rugby: Art = (cv, x, y, w, h) => {
  cv.vgrad(x, y, w, h, hex('#6aa35a'), hex('#4c8a42'));
  for (let i = 0; i < 6; i++) cv.rect(x + i * 34, y, 17, h, hex('#ffffff'), 0.06);
  // posts
  const px = x + 26;
  cv.vline(px - 9, y + 6, y + h - 4, 2, P.white); cv.vline(px + 9, y + 6, y + h - 4, 2, P.white); cv.hline(px - 9, px + 9, y + 34, 2, P.white);
  cv.fill(new Path().ellipse(px + 30, y + 40, 11, 7), hex('#8a4b2a'));
  cv.line([[px + 22, y + 40], [px + 38, y + 40]], 0.8, P.white);
  // scoreboard
  const bx = x + 74, bw = w - 82;
  cv.rrect(bx, y + 5, bw, 31, 3, P.ink);
  text(cv, fK, 8, P.white, 'ENG', bx + 8, y + 15); text(cv, fK, 8, P.white, 'NZL', bx + bw - 8, y + 15, 'r');
  text(cv, fK, 16, hex('#f2c230'), '37 – 12', bx + bw / 2, y + 32, 'c');
};
const ballot: Art = (cv, x, y, w, h) => {
  cv.vgrad(x, y, w, h, hex('#e4efe6'), hex('#bcd8c4'));
  const bx = x + 20, by = y + 22;
  cv.rect(bx, by, 46, 30, hex('#1d7f52'));
  cv.rect(bx + 13, by - 1, 20, 3, P.ink);
  cv.fill(new Path().poly([bx + 16, by - 14, bx + 30, by - 14, bx + 30, by + 1, bx + 16, by + 1]), P.white);
  cv.line([[bx + 19, by - 7], [bx + 22, by - 4], [bx + 27, by - 11]], 1.4, hex('#1d7f52'));
  // football
  const fx = x + 86, fy = y + 30;
  cv.circle(fx, fy, 13, P.white); cv.circle(fx, fy, 4.5, P.ink);
  for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2 - Math.PI / 2; cv.circle(fx + Math.cos(a) * 10.5, fy + Math.sin(a) * 10.5, 2.4, P.ink); }
  text(cv, fS, 20, P.ink, '54/54', x + w - 8, y + 22, 'r');
  text(cv, fB, 7, P.ink, 'CAF members', x + w - 8, y + 31, 'r');
};
const peaks: Art = (cv, x, y, w, h) => {
  cv.vgrad(x, y, w, h, hex('#f0dcc0'), hex('#e3c49b'));
  cv.fill(new Path().poly([x, y + h, x + 30, y + 24, x + 52, y + 38, x + 80, y + 12, x + 112, y + 40, x + 140, y + 22, x + w, y + 42, x + w, y + h]), hex('#a17652'));
  cv.fill(new Path().poly([x, y + h, x + 40, y + 40, x + 70, y + 48, x + 100, y + 36, x + 150, y + 50, x + w, y + 46, x + w, y + h]), hex('#7f5a3c'));
  const cx = x + 80, cy = y + 30;
  cv.line(new Path().circle(cx, cy, 10).polys[0], 1.4, P.red, 1, true);
  cv.line([[cx - 15, cy], [cx - 5, cy]], 1.2, P.red); cv.line([[cx + 5, cy], [cx + 15, cy]], 1.2, P.red);
  cv.line([[cx, cy - 15], [cx, cy - 5]], 1.2, P.red); cv.line([[cx, cy + 5], [cx, cy + 15]], 1.2, P.red);
  text(cv, fS, 20, P.ink, '15', x + 12, y + 22);
  text(cv, fB, 7, P.ink, 'per state media', x + 12, y + 31);
};
const f1: Art = (cv, x, y, w, h) => {
  cv.vgrad(x, y, w, h, hex('#1d1b2e'), hex('#3b2f57'));
  for (let i = 0; i < 18; i++) cv.circle(x + ((i * 53) % w), y + 4 + ((i * 29) % 20), 0.9, hex('#ffd98a'));
  const ty = y + h - 16;
  cv.rect(x, ty, w, 16, hex('#2b2b2b'));
  for (let i = 0; i < 8; i++) cv.rect(x + 4 + i * 26, ty + 7, 13, 1.6, P.white);
  // car (side view)
  const cx = x + 14;
  cv.fill(new Path().poly([cx, ty - 3, cx + 8, ty - 9, cx + 30, ty - 10, cx + 38, ty - 15, cx + 48, ty - 15, cx + 54, ty - 9, cx + 70, ty - 8, cx + 74, ty - 3]), hex('#22356b'));
  cv.rect(cx + 68, ty - 15, 3, 8, hex('#22356b')); cv.rect(cx - 2, ty - 8, 3, 6, hex('#22356b'));
  cv.circle(cx + 14, ty - 3, 5.5, P.ink); cv.circle(cx + 60, ty - 3, 5.5, P.ink);
  // grid sheet
  const gx = x + w - 84;
  cv.rect(gx, y + 6, 78, 30, P.white, 0.94);
  text(cv, fK, 7.5, P.ink, 'P1  Verstappen', gx + 4, y + 15);
  text(cv, fB, 7.5, P.ink, 'P2  Russell', gx + 4, y + 24);
  text(cv, fB, 7.5, P.red, 'P6  Antonelli −5', gx + 4, y + 33);
};

export const ART: Record<string, Art> = { gulf, quake, cop };
export const TILE_ART: Record<string, Art> = { ship, robot, wanted, trade, plant, chart, rugby, ballot, peaks, f1 };
