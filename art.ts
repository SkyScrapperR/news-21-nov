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
function burst(cv: Canvas, cx: number, cy: number, r: number, col: RGB, inner: RGB, spikes = 16) {
  const pts: number[] = [];
  for (let i = 0; i < spikes; i++) { const a = (i / spikes) * Math.PI * 2, rr = i % 2 ? r * 0.48 : r; pts.push(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
  cv.fill(new Path().poly(pts), col);
  cv.circle(cx, cy, r * 0.32, inner);
}
function tanker(cv: Canvas, cx: number, cy: number, s: number, col: RGB) {
  cv.fill(new Path().poly([cx - s, cy - s * 0.2, cx + s * 0.8, cy - s * 0.2, cx + s, cy, cx + s * 0.8, cy + s * 0.32, cx - s * 0.9, cy + s * 0.32]), col);
  cv.rect(cx - s * 0.85, cy - s * 0.6, s * 0.32, s * 0.42, col);
}
function dashed(cv: Canvas, a: Pt, b: Pt, lw: number, col: RGB, dash = 4, gap = 3, curve = 0) {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const nx = -(b[1] - a[1]) / L, ny = (b[0] - a[0]) / L;
  const Q = (t: number): Pt => [a[0] + (b[0] - a[0]) * t + nx * curve * 4 * t * (1 - t), a[1] + (b[1] - a[1]) * t + ny * curve * 4 * t * (1 - t)];
  for (let d = 0; d < L; d += dash + gap) {
    const t0 = d / L, t1 = Math.min(1, (d + dash) / L);
    const seg: Pt[] = []; for (let k = 0; k <= 4; k++) seg.push(Q(t0 + ((t1 - t0) * k) / 4));
    cv.line(seg, lw, col);
  }
}
// bold label with an optional solid box behind it
function label(cv: Canvas, s: string, x: number, y: number, size: number, col: RGB, bg?: RGB, al: 'l' | 'c' | 'r' = 'l', font = fK) {
  const w = tw(font, size, s);
  const lx = al === 'c' ? x - w / 2 : al === 'r' ? x - w : x;
  if (bg) cv.rect(lx - 3, y - size * 0.92, w + 6, size * 1.26, bg);
  text(cv, font, size, col, s, lx, y);
  return w;
}
// the big key fact of a tile: serif figure plus a short caption under it
function keyFact(cv: Canvas, big: string, cap: string, x: number, y: number, col: RGB, capCol: RGB, size = 25, capBg?: RGB) {
  text(cv, fS, size, col, big, x, y, 'r');
  if (!cap) return;
  const w = tw(fK, 9.2, cap) + 0.3 * cap.length;
  if (capBg) cv.rect(x - w - 4, y + 3, w + 8, 12.5, capBg);
  text(cv, fK, 9.2, capCol, cap, x, y + 12.5, 'r', 0.3);
}

// ---------------------------------------------------------------- hero 1: the Gulf (focal point: the strike on Bahrain)
const gulf: Art = (cv, x, y, w, h) => {
  const sea = hex('#1f4f73');
  cv.rect(x, y, w, h, sea);
  const lon0 = 48.6, lon1 = 57.9, lat0 = 29.4, lat1 = 23.5;
  const f = (lon: number, lat: number): Pt => [x + ((lon - lon0) / (lon1 - lon0)) * w, y + ((lat0 - lat) / (lat0 - lat1)) * h];
  const arabia = hex('#ecd6a2'), iran = hex('#cfb27a');
  cv.fill(polyLL([48.6, 29.4, 48.6, 30.0, 49.6, 29.9, 50.2, 29.2, 50.7, 28.6, 51.2, 27.9, 52.0, 27.6, 52.8, 27.2, 53.7, 26.8, 54.6, 26.5,
    55.4, 26.6, 56.0, 27.05, 56.6, 27.1, 57.2, 26.6, 57.4, 25.8, 57.9, 25.7, 57.9, 29.4], f), iran);
  cv.fill(polyLL([48.6, 28.9, 49.2, 27.4, 49.9, 26.8, 50.2, 26.2, 50.1, 25.8, 50.7, 25.2, 50.8, 24.8, 50.85, 25.6, 51.05, 26.1,
    51.4, 26.1, 51.6, 25.3, 51.6, 24.6, 52.3, 24.15, 53.4, 24.1, 54.2, 24.3, 54.7, 24.6, 55.4, 25.3, 55.9, 25.7, 56.08, 26.05, 56.2, 26.35, 56.35, 26.39,
    56.42, 26.1, 56.38, 25.6, 56.37, 24.9, 56.6, 24.4, 57.5, 23.75, 57.9, 23.6, 57.9, 23.5, 48.6, 23.5], f), arabia);
  // attack arcs from Iran towards Bahrain
  const [bx, by] = f(50.55, 26.05);
  dashed(cv, f(54.2, 27.0), [bx + 6, by - 6], 2.2, hex('#ff5a3c'), 6, 4, -14);
  dashed(cv, f(53.6, 27.2), [bx + 4, by - 9], 2.2, hex('#ff5a3c'), 6, 4, -9);
  burst(cv, bx, by, 17, hex('#e8291c'), hex('#ffd65a'));
  label(cv, 'BAHRAIN', bx + 20, by + 2, 11, P.white, hex('#0f2c44'));
  label(cv, '2 air bases hit', bx + 20, by + 17, 8.6, hex('#ffd65a'), hex('#0f2c44'));
  label(cv, 'IRAN', x + w - 10, y + 22, 12, hex('#5c4520'), undefined, 'r');
  // Hormuz: two tankers struck
  for (const [tx, ty] of [[x + w - 74, y + 66], [x + w - 34, y + 84]] as Pt[]) {
    tanker(cv, tx, ty, 13, hex('#111111'));
    burst(cv, tx - 3, ty - 9, 8, hex('#ff7a1a'), hex('#ffe08a'), 12);
  }
  label(cv, 'HORMUZ', x + w - 54, y + 48, 10, P.white, undefined, 'c');
  label(cv, '2 tankers hit', x + w - 8, y + 104, 8.6, hex('#ffd65a'), hex('#0f2c44'), 'r');
};

// ---------------------------------------------------------------- hero 2: Peru quake (focal point: the deep hypocentre)
const quake: Art = (cv, x, y, w, h) => {
  const surf = y + 70;
  cv.vgrad(x, y, w, surf - y + 2, hex('#f7e6c4'), hex('#efc68d'));
  cv.vgrad(x, surf, w, h - (surf - y), hex('#8a5a38'), hex('#3e2717'));
  const kmPx = (h - (surf - y) - 16) / 150;
  // Nazca slab dipping east
  cv.fill(new Path().poly([x, surf + 6, x + w * 0.22, surf + 10, x + w, surf + 140 * kmPx, x + w, surf + 140 * kmPx + 10, x + w * 0.22, surf + 20, x, surf + 16]), hex('#9fb4c2'), 0.35);
  // Pacific, coast, Andes
  cv.rect(x, surf - 3, w * 0.18, 5, hex('#2f6f9a'));
  cv.fill(new Path().poly([x + w * 0.18, surf + 1, x + w * 0.26, surf - 6, x + w * 0.36, surf - 18, x + w * 0.43, surf - 32, x + w * 0.5, surf - 24, x + w * 0.58, surf - 38,
    x + w * 0.66, surf - 27, x + w * 0.75, surf - 34, x + w * 0.86, surf - 20, x + w, surf - 12, x + w, surf + 2]), hex('#4a2f1d'));
  cv.fill(new Path().poly([x + w * 0.58, surf - 38, x + w * 0.6, surf - 31, x + w * 0.555, surf - 32]), P.white);
  // Lima
  const lx = x + w * 0.2;
  cv.rect(lx - 5, surf - 9, 4, 9, P.ink); cv.rect(lx, surf - 13, 4, 13, P.ink); cv.rect(lx + 5, surf - 7, 4, 7, P.ink);
  label(cv, 'LIMA', lx - 6, surf + 13, 9, P.white);
  text(cv, fB, 7.5, hex('#f2d9b0'), 'shaking felt', lx - 6, surf + 23);
  // hypocentre at ~110–130 km
  const ex = x + w * 0.64, hy = surf + 118 * kmPx;
  for (let r = 1; r <= 4; r++) cv.line(new Path().ellipse(ex, hy, r * 15, r * 10).polys[0], 1.4, hex('#ffcf6a'), 0.75 - r * 0.15, true);
  dashed(cv, [ex, surf - 28], [ex, hy - 10], 1.5, P.white, 4, 3);
  burst(cv, ex, hy, 14, hex('#e8291c'), hex('#ffe08a'));
  cv.circle(ex, surf - 28, 4, hex('#e8291c'));
  label(cv, 'ONDORES', ex + 8, surf - 31, 9, P.white);
  label(cv, '108–129 km', ex + 20, hy + 4, 10, P.white, hex('#2a1a0f'));
};

// ---------------------------------------------------------------- hero 3: COP31 overtime (focal point: the red 13th day)
const cop: Art = (cv, x, y, w, h) => {
  cv.vgrad(x, y, w, h, hex('#dcecd8'), hex('#bcd9b6'));
  // thermometer + 1.5°C
  const tx = x + w * 0.66;
  cv.rrect(tx - 5, y + 8, 10, 52, 5, P.white); cv.circle(tx, y + 62, 8.5, hex('#d0281c')); cv.rect(tx - 2.4, y + 24, 4.8, 38, hex('#d0281c'));
  label(cv, '1.5°C', tx + 12, y + 30, 11, P.ink);
  // calendar: 9–20 November scheduled, 21 overtime
  const n = 13, cx0 = x + 8, cw = (w - 16) / n, cy = y + 74, ch = 30;
  for (let i = 0; i < n; i++) {
    const over = i === 12;
    const top = over ? cy - 10 : cy;
    cv.rect(cx0 + i * cw + 1, top, cw - 2, ch + (over ? 10 : 0), over ? hex('#d0281c') : hex('#2e7d4f'));
    text(cv, fK, over ? 13 : 11, P.white, String(9 + i), cx0 + i * cw + cw / 2, cy + 20, 'c');
  }
  label(cv, '+1 DAY', x + w - 10, cy - 15, 12, hex('#d0281c'), undefined, 'r');
  text(cv, fK, 8, hex('#1e5a38'), 'NOV 9–20 SCHEDULED', cx0 + 2, cy - 5, 'l', 0.4);
  label(cv, 'approval session Sun 06:00 GMT', x + w - 8, y + h - 8, 8.4, P.ink, undefined, 'r', fB);
};

// ---------------------------------------------------------------- tiles (each: one bold icon + one big key fact)
const ship: Art = (cv, x, y, w, h) => {
  cv.vgrad(x, y, w, h, hex('#1d3550'), hex('#2e5878'));
  const sy = y + h - 14;
  cv.rect(x, sy, w, 14, hex('#173049'));
  const sx = x + 10;
  cv.fill(new Path().poly([sx, sy - 12, sx + 88, sy - 12, sx + 80, sy + 4, sx + 6, sy + 4]), hex('#0b0b0b'));
  for (let i = 0; i < 4; i++) cv.rect(sx + 14 + i * 14, sy - 21, 12, 9, [hex('#c43b2c'), hex('#2a6f97'), hex('#d4a017'), hex('#4f8a4b')][i]);
  cv.rect(sx + 72, sy - 26, 12, 14, P.white);
  for (let i = 0; i < 4; i++) cv.circle(sx + 30 + i * 6, sy - 30 - i * 5, 5 + i, hex('#6b6b6b'), 0.6);
  burst(cv, sx + 28, sy - 22, 9, hex('#ff7a1a'), hex('#ffe08a'), 12);
  keyFact(cv, '2', 'DRONES', x + w - 8, y + 30, P.white, hex('#ffb14a'), 30, hex('#132a42'));
};
const robot: Art = (cv, x, y, w, h) => {
  cv.vgrad(x, y, w, h, hex('#2c4a6e'), hex('#203852'));
  const rx = x + 34, ry = y + 12;
  const steel = hex('#c9d3dc');
  cv.rrect(rx - 17, ry, 34, 22, 5, steel);
  cv.circle(rx - 8, ry + 11, 4, hex('#e8291c')); cv.circle(rx + 8, ry + 11, 4, hex('#e8291c'));
  cv.rect(rx - 1.2, ry - 7, 2.4, 7, steel); cv.circle(rx, ry - 8, 3, hex('#e8291c'));
  cv.rrect(rx - 14, ry + 25, 28, 22, 3, steel);
  cv.line([[rx - 14, ry + 30], [rx - 26, ry + 42]], 4, steel); cv.line([[rx + 14, ry + 30], [rx + 26, ry + 42]], 4, steel);
  keyFact(cv, '128', 'NATIONS · ROBOT ARMS', x + w - 8, y + 30, P.white, hex('#9cc6ef'), 30);
};
const wanted: Art = (cv, x, y, w, h) => {
  cv.vgrad(x, y, w, h, hex('#e8d6ad'), hex('#d2b985'));
  const px = x + 12, py = y + 5, pw = 46, ph = h - 10;
  cv.rect(px, py, pw, ph, hex('#fbf4e2')); cv.strokeRect(px, py, pw, ph, 1.2, P.ink);
  person(cv, px + pw / 2, py + ph - 5, 10, P.ink);
  label(cv, '$5M', px + pw / 2, py + 12, 9, P.red, undefined, 'c');
  // stamp
  const sx = x + 66, sy = y + 18;
  cv.strokeRect(sx, sy, w - 74, 26, 2.4, hex('#c0211a'));
  label(cv, 'CAPTURED', sx + (w - 74) / 2, sy + 18, 14, hex('#c0211a'), undefined, 'c');
  text(cv, fK, 8, P.ink, 'FBI TOP TEN', sx + (w - 74) / 2, sy + 36, 'c', 0.4);
};
const trade: Art = (cv, x, y, w, h) => {
  cv.vgrad(x, y, w, h, hex('#e9eff6'), hex('#ccdbea'));
  const sx = x + 24, sy = y + h / 2;
  cv.circle(sx, sy, 19, hex('#1f4e9a'));
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; cv.circle(sx + Math.cos(a) * 12.5, sy + Math.sin(a) * 12.5, 1.9, hex('#f2c230')); }
  const fx = x + 48;
  cv.rect(fx, sy - 13, 30, 13, hex('#d0281c')); cv.rect(fx, sy, 30, 13, P.white); cv.strokeRect(fx, sy - 13, 30, 26, 0.8, P.ink);
  keyFact(cv, '90.4%', 'DUTY-FREE LINES', x + w - 8, y + 30, hex('#1f4e9a'), P.ink, 26);
  cv.rect(x + 86, y + 48, w - 94, 6, P.white); cv.rect(x + 86, y + 48, (w - 94) * 0.904, 6, hex('#2a87b8'));
};
const plant: Art = (cv, x, y, w, h) => {
  cv.vgrad(x, y, w, h, hex('#2b2930'), hex('#5a3a2c'));
  const base = y + h - 5;
  cv.rect(x, base, w, 5, hex('#1c1a18'));
  cv.rect(x + 10, base - 22, 66, 22, hex('#5a5a5e'));
  for (const cx of [22, 40, 58]) cv.fill(new Path().poly([x + cx - 5, base - 22, x + cx + 5, base - 22, x + cx + 3, base - 50, x + cx - 3, base - 50]), hex('#77777c'));
  for (let i = 0; i < 9; i++) {
    const fx = x + 12 + ((i * 7) % 62), fh = 12 + ((i * 37) % 14);
    cv.fill(new Path().poly([fx - 6, base - 22, fx + 6, base - 22, fx + 1, base - 22 - fh]), i % 2 ? hex('#ff7a1a') : hex('#ffc93a'));
  }
  keyFact(cv, '4', 'DEAD IN FIRE', x + w - 8, y + 30, hex('#ffb14a'), P.white, 30, hex('#2b2930'));
};
const chart: Art = (cv, x, y, w, h) => {
  cv.rect(x, y, w, h, hex('#f3eee2'));
  // reported: almost -18% over the week, -6.23% on Friday; Mon–Thu drawn as a straight line between them
  const vals = [100, 96.9, 93.8, 90.7, 87.6, 82.1];
  const cx = x + 8, cw = w * 0.5, top = y + 8, ch = h - 16;
  const pts: Pt[] = vals.map((v, i) => [cx + (cw * i) / (vals.length - 1), top + ((100 - v) / 20) * ch]);
  cv.fill(new Path().poly([cx, top + ch, ...pts.flat(), cx + cw, top + ch]), hex('#d0281c'), 0.15);
  cv.line(pts, 2.6, hex('#d0281c'));
  arrow(cv, pts[4], pts[5], 2.6, hex('#d0281c'), 8);
  keyFact(cv, '−18%', 'TAIEX, WEEK', x + w - 8, y + 30, hex('#c0211a'), P.ink, 26, hex('#f3eee2'));
};
const rugby: Art = (cv, x, y, w, h) => {
  cv.vgrad(x, y, w, h, hex('#3f8a3a'), hex('#2f6e2c'));
  for (let i = 0; i < 7; i++) cv.rect(x + i * 30, y, 15, h, P.white, 0.06);
  const px = x + 22;
  cv.vline(px - 9, y + 6, y + h - 4, 2.4, P.white); cv.vline(px + 9, y + 6, y + h - 4, 2.4, P.white); cv.hline(px - 9, px + 9, y + 36, 2.4, P.white);
  cv.fill(new Path().ellipse(px + 30, y + 44, 12, 7.5), hex('#8a4b2a'));
  const bx = x + 70, bw = w - 78;
  cv.rrect(bx, y + 9, bw, 46, 4, hex('#111111'));
  text(cv, fK, 9, P.white, 'ENG', bx + 9, y + 22); text(cv, fK, 9, P.white, 'NZL', bx + bw - 9, y + 22, 'r');
  text(cv, fS, 26, hex('#ffd04a'), '37–12', bx + bw / 2, y + 48, 'c');
};
const ballot: Art = (cv, x, y, w, h) => {
  cv.vgrad(x, y, w, h, hex('#1d7a4c'), hex('#145c39'));
  const bx = x + 12, by = y + 26;
  cv.rect(bx, by, 44, 30, hex('#f3efe2'));
  cv.rect(bx + 12, by - 1, 20, 3, P.ink);
  cv.fill(new Path().poly([bx + 15, by - 16, bx + 29, by - 16, bx + 29, by + 1, bx + 15, by + 1]), P.white);
  cv.line([[bx + 18, by - 8], [bx + 21, by - 5], [bx + 26, by - 12]], 1.8, hex('#1d7a4c'));
  const fx = x + 76, fy = y + 34;
  cv.circle(fx, fy, 14, P.white); cv.circle(fx, fy, 5, P.ink);
  for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2 - Math.PI / 2; cv.circle(fx + Math.cos(a) * 11, fy + Math.sin(a) * 11, 2.6, P.ink); }
  keyFact(cv, '54/54', 'BACK INFANTINO', x + w - 8, y + 30, P.white, hex('#bfe8cf'), 24);
};
const peaks: Art = (cv, x, y, w, h) => {
  cv.vgrad(x, y, w, h, hex('#f1d6ae'), hex('#e0b27a'));
  cv.fill(new Path().poly([x, y + h, x + 22, y + 26, x + 44, y + 40, x + 70, y + 14, x + 98, y + 42, x + 124, y + 30, x + w, y + 46, x + w, y + h]), hex('#9a6a44'));
  cv.fill(new Path().poly([x, y + h, x + 36, y + 44, x + 66, y + 52, x + 98, y + 40, x + 140, y + 54, x + w, y + 50, x + w, y + h]), hex('#6e4a2e'));
  const cx = x + 58, cy = y + 32;
  cv.line(new Path().circle(cx, cy, 11).polys[0], 2, hex('#c0211a'), 1, true);
  for (const [a, b] of [[[cx - 17, cy], [cx - 6, cy]], [[cx + 6, cy], [cx + 17, cy]], [[cx, cy - 17], [cx, cy - 6]], [[cx, cy + 6], [cx, cy + 17]]] as Pt[][]) cv.line([a, b], 1.8, hex('#c0211a'));
  keyFact(cv, '15', 'MILITANTS KILLED', x + w - 8, y + 30, P.ink, P.white, 30, hex('#5a3a22'));
};
const f1: Art = (cv, x, y, w, h) => {
  cv.vgrad(x, y, w, h, hex('#17152a'), hex('#33295a'));
  for (let i = 0; i < 16; i++) cv.circle(x + ((i * 53) % w), y + 4 + ((i * 29) % 18), 1, hex('#ffd98a'));
  const ty = y + h - 12;
  cv.rect(x, ty, w, 12, hex('#2b2b2b'));
  for (let i = 0; i < 8; i++) cv.rect(x + 4 + i * 26, ty + 5, 13, 1.6, P.white);
  const cx = x + 8;
  cv.fill(new Path().poly([cx, ty - 3, cx + 8, ty - 10, cx + 30, ty - 11, cx + 38, ty - 17, cx + 48, ty - 17, cx + 54, ty - 10, cx + 72, ty - 9, cx + 76, ty - 3]), hex('#3a5bd0'));
  cv.rect(cx + 70, ty - 17, 3, 9, hex('#3a5bd0')); cv.rect(cx - 2, ty - 9, 3, 7, hex('#3a5bd0'));
  cv.circle(cx + 14, ty - 3, 6, hex('#0b0b0b')); cv.circle(cx + 62, ty - 3, 6, hex('#0b0b0b'));
  keyFact(cv, 'P1', 'VERSTAPPEN · VEGAS', x + w - 8, y + 30, hex('#ffd04a'), P.white, 30, hex('#17152a'));
};

export const ART: Record<string, Art> = { gulf, quake, cop };
export const TILE_ART: Record<string, Art> = { ship, robot, wanted, trade, plant, chart, rugby, ballot, peaks, f1 };
