// gfx.ts — a tiny, deterministic 2D engine for the front page: TrueType parsing (glyf outlines, cmap, hmtx,
// GPOS pair kerning), an anti-aliased signed-area scanline rasterizer for any path, and a PNG encoder.
// Node standard library only (node:fs, node:zlib).

import { readFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

// ---------------------------------------------------------------- paths
export type Pt = [number, number];
export type Poly = Pt[];

export class Path {
  polys: Poly[] = [];
  cur: Poly | null = null;
  tol = 0.2;
  moveTo(x: number, y: number) { this.cur = [[x, y]]; this.polys.push(this.cur); return this; }
  lineTo(x: number, y: number) { if (!this.cur) return this.moveTo(x, y); this.cur.push([x, y]); return this; }
  last(): Pt { const c = this.cur!; return c[c.length - 1]; }
  quadTo(cx: number, cy: number, x: number, y: number) {
    const [x0, y0] = this.last();
    const d = Math.abs(x0 - 2 * cx + x) + Math.abs(y0 - 2 * cy + y);
    const n = Math.max(1, Math.min(64, Math.ceil(Math.sqrt(d / this.tol / 2))));
    for (let i = 1; i <= n; i++) {
      const t = i / n, u = 1 - t;
      this.cur!.push([u * u * x0 + 2 * u * t * cx + t * t * x, u * u * y0 + 2 * u * t * cy + t * t * y]);
    }
    return this;
  }
  cubicTo(c1x: number, c1y: number, c2x: number, c2y: number, x: number, y: number) {
    const [x0, y0] = this.last();
    const d = Math.abs(x0 - 2 * c1x + c2x) + Math.abs(y0 - 2 * c1y + c2y) + Math.abs(c1x - 2 * c2x + x) + Math.abs(c1y - 2 * c2y + y);
    const n = Math.max(1, Math.min(96, Math.ceil(Math.sqrt(d / this.tol))));
    for (let i = 1; i <= n; i++) {
      const t = i / n, u = 1 - t;
      this.cur!.push([
        u * u * u * x0 + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * x,
        u * u * u * y0 + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * y,
      ]);
    }
    return this;
  }
  close() { this.cur = null; return this; }
  rect(x: number, y: number, w: number, h: number) { return this.moveTo(x, y).lineTo(x + w, y).lineTo(x + w, y + h).lineTo(x, y + h).close(); }
  roundRect(x: number, y: number, w: number, h: number, r: number) {
    r = Math.min(r, w / 2, h / 2);
    const k = 0.5523 * r;
    this.moveTo(x + r, y).lineTo(x + w - r, y).cubicTo(x + w - r + k, y, x + w, y + r - k, x + w, y + r)
      .lineTo(x + w, y + h - r).cubicTo(x + w, y + h - r + k, x + w - r + k, y + h, x + w - r, y + h)
      .lineTo(x + r, y + h).cubicTo(x + r - k, y + h, x, y + h - r + k, x, y + h - r)
      .lineTo(x, y + r).cubicTo(x, y + r - k, x + r - k, y, x + r, y);
    return this.close();
  }
  ellipse(cx: number, cy: number, rx: number, ry: number) {
    const n = Math.max(16, Math.ceil(Math.sqrt(Math.max(rx, ry)) * 10));
    this.moveTo(cx + rx, cy);
    for (let i = 1; i < n; i++) { const a = (i / n) * Math.PI * 2; this.lineTo(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry); }
    return this.close();
  }
  circle(cx: number, cy: number, r: number) { return this.ellipse(cx, cy, r, r); }
  poly(pts: number[]) { this.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) this.lineTo(pts[i], pts[i + 1]); return this.close(); }
  arc(cx: number, cy: number, r: number, a0: number, a1: number, withCenter = true) {
    const n = Math.max(6, Math.ceil(Math.abs(a1 - a0) * Math.sqrt(r) * 2));
    if (withCenter) this.moveTo(cx, cy); else this.moveTo(cx + Math.cos(a0) * r, cy + Math.sin(a0) * r);
    for (let i = withCenter ? 0 : 1; i <= n; i++) { const a = a0 + (a1 - a0) * (i / n); this.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); }
    return this.close();
  }
}

function area(p: Poly) { let s = 0; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return s / 2; }

// A stroke as a set of positively-oriented quads and round joins (unioned by the rasterizer's clamp).
export function strokePath(pts: Pt[], w: number, round = true, closed = false): Path {
  const p = new Path();
  const h = w / 2;
  const n = pts.length;
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const a = pts[i], b = pts[(i + 1) % n];
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const L = Math.hypot(dx, dy) || 1;
    const nx = (-dy / L) * h, ny = (dx / L) * h;
    let q: Poly = [[a[0] + nx, a[1] + ny], [b[0] + nx, b[1] + ny], [b[0] - nx, b[1] - ny], [a[0] - nx, a[1] - ny]];
    if (area(q) < 0) q = q.reverse();
    p.polys.push(q);
  }
  if (round) {
    for (let i = 0; i < n; i++) {
      if (!closed && !round) continue;
      const c = new Path().circle(pts[i][0], pts[i][1], h).polys[0];
      p.polys.push(area(c) < 0 ? c.reverse() : c);
    }
  }
  return p;
}

// ---------------------------------------------------------------- canvas
export type RGB = [number, number, number];
export function hex(s: string): RGB { const v = parseInt(s.replace('#', ''), 16); return [(v >> 16) & 255, (v >> 8) & 255, v & 255]; }
export function mix(a: RGB, b: RGB, t: number): RGB { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }

export class Canvas {
  w: number; h: number; px: Float32Array;
  clip: [number, number, number, number];
  acc: Float32Array;
  constructor(w: number, h: number, bg: RGB) {
    this.w = w; this.h = h;
    this.px = new Float32Array(w * h * 3);
    for (let i = 0; i < w * h; i++) { this.px[i * 3] = bg[0]; this.px[i * 3 + 1] = bg[1]; this.px[i * 3 + 2] = bg[2]; }
    this.clip = [0, 0, w, h];
    this.acc = new Float32Array((w + 2) * (h + 2));
  }
  setClip(x: number, y: number, w: number, h: number) { this.clip = [Math.max(0, Math.floor(x)), Math.max(0, Math.floor(y)), Math.min(this.w, Math.ceil(x + w)), Math.min(this.h, Math.ceil(y + h))]; }
  noClip() { this.clip = [0, 0, this.w, this.h]; }

  // Signed-area coverage accumulation (exact area per pixel), then a running sum per row.
  fill(path: Path | Poly[], color: RGB, alpha = 1, gamma = 1) {
    const polys = path instanceof Path ? path.polys : path;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const p of polys) for (const [x, y] of p) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (!isFinite(x0)) return;
    const [cx0, cy0, cx1, cy1] = this.clip;
    const bx = Math.max(cx0, Math.floor(x0)), by = Math.max(cy0, Math.floor(y0));
    const ex = Math.min(cx1, Math.ceil(x1) + 1), ey = Math.min(cy1, Math.ceil(y1) + 1);
    if (bx >= ex || by >= ey) return;
    // accumulate over the whole y-range of the path, clipped by rows when compositing
    const ox = Math.floor(x0), oy = Math.floor(y0);
    const W = Math.ceil(x1) - ox + 2, H = Math.ceil(y1) - oy + 2;
    if (W * H > this.acc.length) this.acc = new Float32Array(W * H);
    const acc = this.acc;
    acc.fill(0, 0, W * H);
    for (const p of polys) {
      for (let i = 0; i < p.length; i++) {
        const a = p[i], b = p[(i + 1) % p.length];
        line(acc, W, H, a[0] - ox, a[1] - oy, b[0] - ox, b[1] - oy);
      }
    }
    const px = this.px;
    for (let y = 0; y < H; y++) {
      const gy = y + oy;
      let s = 0;
      const row = y * W;
      for (let x = 0; x < W; x++) {
        s += acc[row + x];
        const gx = x + ox;
        if (gy < by || gy >= ey || gx < bx || gx >= ex) continue;
        let c = Math.abs(s);
        if (c < 0.002) continue;
        if (c > 1) c = 1;
        if (gamma !== 1) c = Math.pow(c, gamma);
        c *= alpha;
        const k = (gy * this.w + gx) * 3;
        px[k] += (color[0] - px[k]) * c;
        px[k + 1] += (color[1] - px[k + 1]) * c;
        px[k + 2] += (color[2] - px[k + 2]) * c;
      }
    }
  }
  rect(x: number, y: number, w: number, h: number, color: RGB, alpha = 1) { this.fill(new Path().rect(x, y, w, h), color, alpha); }
  rrect(x: number, y: number, w: number, h: number, r: number, color: RGB, alpha = 1) { this.fill(new Path().roundRect(x, y, w, h, r), color, alpha); }
  circle(x: number, y: number, r: number, color: RGB, alpha = 1) { this.fill(new Path().circle(x, y, r), color, alpha); }
  line(pts: Pt[], w: number, color: RGB, alpha = 1, closed = false) { this.fill(strokePath(pts, w, true, closed), color, alpha); }
  hline(x0: number, x1: number, y: number, w: number, color: RGB) { this.rect(x0, y - w / 2, x1 - x0, w, color); }
  vline(x: number, y0: number, y1: number, w: number, color: RGB) { this.rect(x - w / 2, y0, w, y1 - y0, color); }
  strokeRect(x: number, y: number, w: number, h: number, lw: number, color: RGB) {
    this.rect(x, y, w, lw, color); this.rect(x, y + h - lw, w, lw, color); this.rect(x, y, lw, h, color); this.rect(x + w - lw, y, lw, h, color);
  }
  // vertical gradient rectangle
  vgrad(x: number, y: number, w: number, h: number, top: RGB, bot: RGB) {
    const steps = Math.max(1, Math.ceil(h));
    for (let i = 0; i < steps; i++) this.rect(x, y + i, w, Math.min(1, h - i), mix(top, bot, steps > 1 ? i / (steps - 1) : 0));
  }

  // 8-bit RGB bytes of the canvas.
  bytes(): Uint8Array {
    const n = this.w * this.h * 3, out = new Uint8Array(n);
    for (let i = 0; i < n; i++) { const v = Math.round(this.px[i]); out[i] = v < 0 ? 0 : v > 255 ? 255 : v; }
    return out;
  }

  // Indexed PNG: median-cut palette of up to `colors` entries over a 5-bit histogram, nearest-colour mapping.
  pngIndexed(colors = 256): Buffer {
    const { w, h } = this;
    const rgb = this.bytes();
    const N = w * h;
    const hist = new Uint32Array(32768);
    const sum = new Float64Array(32768 * 3);
    for (let i = 0; i < N; i++) {
      const r = rgb[i * 3], g = rgb[i * 3 + 1], b = rgb[i * 3 + 2];
      const k = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
      hist[k]++; sum[k * 3] += r; sum[k * 3 + 1] += g; sum[k * 3 + 2] += b;
    }
    type Bin = { k: number; c: [number, number, number]; n: number };
    const bins: Bin[] = [];
    for (let k = 0; k < 32768; k++) if (hist[k]) bins.push({ k, n: hist[k], c: [sum[k * 3] / hist[k], sum[k * 3 + 1] / hist[k], sum[k * 3 + 2] / hist[k]] });
    let boxes: Bin[][] = [bins];
    // split the box with the largest total squared error, along its axis of largest variance
    const score = (b: Bin[]) => {
      let n = 0; const m = [0, 0, 0];
      for (const x of b) { n += x.n; for (let c = 0; c < 3; c++) m[c] += x.c[c] * x.n; }
      for (let c = 0; c < 3; c++) m[c] /= n;
      const v = [0, 0, 0];
      for (const x of b) for (let c = 0; c < 3; c++) v[c] += x.n * (x.c[c] - m[c]) ** 2;
      const axis = v.indexOf(Math.max(...v));
      return { axis, s: v[0] + v[1] + v[2] };
    };
    while (boxes.length < colors) {
      let bi = -1, best = -1, ax = 0;
      boxes.forEach((b, i) => { if (b.length < 2) return; const sc = score(b); if (sc.s > best) { best = sc.s; bi = i; ax = sc.axis; } });
      if (bi < 0) break;
      const b = boxes[bi].slice().sort((p, q) => p.c[ax] - q.c[ax] || p.k - q.k);
      // optimal cut: minimise SSE(left) + SSE(right) using prefix sums of n, n·c and n·|c|²
      const L = b.length;
      const pn = new Float64Array(L + 1), ps = new Float64Array((L + 1) * 3), pq = new Float64Array(L + 1);
      for (let i = 0; i < L; i++) {
        const x = b[i];
        pn[i + 1] = pn[i] + x.n;
        for (let c = 0; c < 3; c++) ps[(i + 1) * 3 + c] = ps[i * 3 + c] + x.n * x.c[c];
        pq[i + 1] = pq[i] + x.n * (x.c[0] ** 2 + x.c[1] ** 2 + x.c[2] ** 2);
      }
      const sse = (i0: number, i1: number) => {
        const n = pn[i1] - pn[i0];
        let s2 = 0;
        for (let c = 0; c < 3; c++) { const s = ps[i1 * 3 + c] - ps[i0 * 3 + c]; s2 += s * s; }
        return pq[i1] - pq[i0] - s2 / n;
      };
      let cut = 1, bestCut = Infinity;
      for (let i = 1; i < L; i++) { const e = sse(0, i) + sse(i, L); if (e < bestCut) { bestCut = e; cut = i; } }
      boxes.splice(bi, 1, b.slice(0, cut), b.slice(cut));
    }
    const pal: number[][] = boxes.map((b) => {
      let r = 0, g = 0, bl = 0, n = 0;
      for (const x of b) { r += x.c[0] * x.n; g += x.c[1] * x.n; bl += x.c[2] * x.n; n += x.n; }
      return [Math.round(r / n), Math.round(g / n), Math.round(bl / n)];
    });
    const cache = new Int16Array(32768).fill(-1);
    const near = (r: number, g: number, b: number) => {
      let bi = 0, bd = Infinity;
      for (let i = 0; i < pal.length; i++) {
        const dr = pal[i][0] - r, dg = pal[i][1] - g, db = pal[i][2] - b;
        const d = 2 * dr * dr + 4 * dg * dg + 3 * db * db;
        if (d < bd) { bd = d; bi = i; }
      }
      return bi;
    };
    const raw = Buffer.alloc((w + 1) * h);
    for (let y = 0; y < h; y++) {
      raw[y * (w + 1)] = 0;
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        const r = rgb[i * 3], g = rgb[i * 3 + 1], b = rgb[i * 3 + 2];
        const k = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
        let p = cache[k];
        if (p < 0) { p = near(r, g, b); cache[k] = p; }
        raw[y * (w + 1) + 1 + x] = p;
      }
    }
    const plte = Buffer.alloc(pal.length * 3);
    pal.forEach((c, i) => { plte[i * 3] = c[0]; plte[i * 3 + 1] = c[1]; plte[i * 3 + 2] = c[2]; });
    return encodePng(w, h, 3, raw, plte);
  }

  png(): Buffer {
    const { w, h, px } = this;
    const raw = Buffer.alloc((w * 3 + 1) * h);
    const rowBytes = Buffer.alloc(w * 3);
    const prev = Buffer.alloc(w * 3);
    const cand = [Buffer.alloc(w * 3), Buffer.alloc(w * 3), Buffer.alloc(w * 3), Buffer.alloc(w * 3), Buffer.alloc(w * 3)];
    for (let y = 0; y < h; y++) {
      for (let i = 0; i < w * 3; i++) { const v = Math.round(px[y * w * 3 + i]); rowBytes[i] = v < 0 ? 0 : v > 255 ? 255 : v; }
      let best = 0, bestScore = Infinity;
      for (let f = 0; f < 5; f++) {
        const o = cand[f];
        let score = 0;
        for (let i = 0; i < w * 3; i++) {
          const a = i >= 3 ? rowBytes[i - 3] : 0, b = prev[i], c = i >= 3 ? prev[i - 3] : 0, x = rowBytes[i];
          let v: number;
          if (f === 0) v = x; else if (f === 1) v = x - a; else if (f === 2) v = x - b; else if (f === 3) v = x - ((a + b) >> 1);
          else { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v = x - (pa <= pb && pa <= pc ? a : pb <= pc ? b : c); }
          v &= 255; o[i] = v; score += v < 128 ? v : 256 - v;
        }
        if (score < bestScore) { bestScore = score; best = f; }
      }
      raw[y * (w * 3 + 1)] = best;
      cand[best].copy(raw, y * (w * 3 + 1) + 1);
      rowBytes.copy(prev);
    }
    return encodePng(w, h, 2, raw);
  }
}

// font-rs style line accumulation: exact signed area coverage
function line(acc: Float32Array, W: number, H: number, x0: number, y0: number, x1: number, y1: number) {
  if (y0 === y1) return;
  let dir = 1;
  if (y0 > y1) { dir = -1; [x0, x1] = [x1, x0]; [y0, y1] = [y1, y0]; }
  const dxdy = (x1 - x0) / (y1 - y0);
  let x = x0;
  if (y0 < 0) { x -= y0 * dxdy; y0 = 0; }
  if (y1 > H) y1 = H;
  const ys = Math.floor(y0);
  for (let y = ys; y < y1; y++) {
    const linestart = y * W;
    const dy = Math.min(y + 1, y1) - Math.max(y, y0);
    const xnext = x + dxdy * dy;
    const d = dy * dir;
    let xa = x, xb = xnext;
    if (xa > xb) [xa, xb] = [xb, xa];
    const x0floor = Math.floor(xa);
    const x0i = x0floor;
    const x1ceil = Math.ceil(xb);
    const x1i = x1ceil;
    if (x1i <= x0i + 1) {
      const xmf = 0.5 * (x + xnext) - x0floor;
      const idx = linestart + x0i;
      if (x0i >= 0 && x0i < W) acc[idx] += d - d * xmf;
      if (x0i + 1 >= 0 && x0i + 1 < W) acc[idx + 1] += d * xmf;
    } else {
      const s = 1 / (xb - xa);
      const x0f = xa - x0floor;
      const a0 = 0.5 * s * (1 - x0f) * (1 - x0f);
      const x1f = xb - x1ceil + 1;
      const am = 0.5 * s * x1f * x1f;
      const put = (i: number, v: number) => { if (i >= 0 && i < W) acc[linestart + i] += v; };
      put(x0i, d * a0);
      if (x1i === x0i + 2) put(x0i + 1, d * (1 - a0 - am));
      else {
        const a1 = s * (1.5 - x0f);
        put(x0i + 1, d * (a1 - a0));
        for (let xi = x0i + 2; xi < x1i - 1; xi++) put(xi, d * s);
        const a2 = a1 + (x1i - x0i - 3) * s;
        put(x1i - 1, d * (1 - a2 - am));
      }
      put(x1i, d * am);
    }
    x = xnext;
  }
}

// ---------------------------------------------------------------- PNG
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(b: Buffer) { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
function chunk(type: string, data: Buffer) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
export function encodePng(w: number, h: number, colorType: number, raw: Buffer, plte?: Buffer) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = colorType; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const parts = [Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr)];
  if (plte) parts.push(chunk('PLTE', plte));
  parts.push(chunk('IDAT', deflateSync(raw, { level: 9, memLevel: 9, strategy: 0 })), chunk('IEND', Buffer.alloc(0)));
  return Buffer.concat(parts);
}

// ---------------------------------------------------------------- TrueType
type Glyph = { contours: { x: number; y: number; on: boolean }[][]; adv: number };

export class Font {
  d: DataView; buf: Buffer;
  tables: Record<string, number> = {};
  upm = 1000; numGlyphs = 0; locaLong = false;
  ascender = 0; descender = 0; capH = 0; xH = 0;
  cmap = new Map<number, number>();
  advs: number[] = [];
  cache = new Map<number, Glyph>();
  kern = new Map<number, number>(); // (g1<<16|g2) -> value
  classKerns: { cov: Map<number, number>; c1: Map<number, number>; c2: Map<number, number>; n2: number; vals: Int16Array }[] = [];

  constructor(file: string | URL) {
    this.buf = readFileSync(file);
    this.d = new DataView(this.buf.buffer, this.buf.byteOffset, this.buf.byteLength);
    const d = this.d;
    const n = d.getUint16(4);
    for (let i = 0; i < n; i++) {
      const o = 12 + i * 16;
      const tag = String.fromCharCode(d.getUint8(o), d.getUint8(o + 1), d.getUint8(o + 2), d.getUint8(o + 3));
      this.tables[tag] = d.getUint32(o + 8);
    }
    const head = this.tables.head;
    this.upm = d.getUint16(head + 18);
    this.locaLong = d.getInt16(head + 50) === 1;
    this.numGlyphs = d.getUint16(this.tables.maxp + 4);
    const hhea = this.tables.hhea;
    this.ascender = d.getInt16(hhea + 4); this.descender = d.getInt16(hhea + 6);
    const nh = d.getUint16(hhea + 34);
    const hm = this.tables.hmtx;
    let last = 0;
    for (let g = 0; g < this.numGlyphs; g++) { if (g < nh) last = d.getUint16(hm + g * 4); this.advs.push(last); }
    const os2 = this.tables['OS/2'];
    if (os2 !== undefined && d.getUint16(os2) >= 2) { this.xH = d.getInt16(os2 + 86); this.capH = d.getInt16(os2 + 88); }
    this.readCmap();
    if (!this.capH) this.capH = this.ascender * 0.7;
    if (this.tables.GPOS !== undefined) this.readGpos();
  }

  readCmap() {
    const d = this.d, base = this.tables.cmap;
    const n = d.getUint16(base + 2);
    let best = -1, bestFmt = 0;
    for (let i = 0; i < n; i++) {
      const pid = d.getUint16(base + 4 + i * 8), eid = d.getUint16(base + 6 + i * 8), off = d.getUint32(base + 8 + i * 8);
      const fmt = d.getUint16(base + off);
      if ((pid === 3 && (eid === 1 || eid === 10)) || pid === 0) {
        if (fmt === 12 || (fmt === 4 && bestFmt !== 12)) { best = base + off; bestFmt = fmt; }
      }
    }
    if (best < 0) throw new Error('no cmap');
    if (bestFmt === 4) {
      const segX2 = d.getUint16(best + 6), seg = segX2 / 2;
      const ends = best + 14, starts = ends + segX2 + 2, deltas = starts + segX2, ranges = deltas + segX2;
      for (let s = 0; s < seg; s++) {
        const e = d.getUint16(ends + s * 2), st = d.getUint16(starts + s * 2), dl = d.getInt16(deltas + s * 2), ro = d.getUint16(ranges + s * 2);
        for (let c = st; c <= e && c !== 0xffff; c++) {
          let g: number;
          if (ro === 0) g = (c + dl) & 0xffff;
          else { const a = ranges + s * 2 + ro + (c - st) * 2; g = d.getUint16(a); if (g) g = (g + dl) & 0xffff; }
          if (g) this.cmap.set(c, g);
        }
      }
    } else {
      const ng = d.getUint32(best + 12);
      for (let i = 0; i < ng; i++) {
        const o = best + 16 + i * 12;
        const s = d.getUint32(o), e = d.getUint32(o + 4), g = d.getUint32(o + 8);
        for (let c = s; c <= e; c++) this.cmap.set(c, g + c - s);
      }
    }
  }

  coverage(off: number): Map<number, number> {
    const d = this.d, m = new Map<number, number>();
    const fmt = d.getUint16(off);
    if (fmt === 1) { const n = d.getUint16(off + 2); for (let i = 0; i < n; i++) m.set(d.getUint16(off + 4 + i * 2), i); }
    else { const n = d.getUint16(off + 2); for (let i = 0; i < n; i++) { const o = off + 4 + i * 6; const s = d.getUint16(o), e = d.getUint16(o + 2), si = d.getUint16(o + 4); for (let g = s; g <= e; g++) m.set(g, si + g - s); } }
    return m;
  }
  classDef(off: number): Map<number, number> {
    const d = this.d, m = new Map<number, number>();
    const fmt = d.getUint16(off);
    if (fmt === 1) { const s = d.getUint16(off + 2), n = d.getUint16(off + 4); for (let i = 0; i < n; i++) m.set(s + i, d.getUint16(off + 6 + i * 2)); }
    else { const n = d.getUint16(off + 2); for (let i = 0; i < n; i++) { const o = off + 4 + i * 6; const s = d.getUint16(o), e = d.getUint16(o + 2), c = d.getUint16(o + 4); for (let g = s; g <= e; g++) m.set(g, c); } }
    return m;
  }
  valueSize(f: number) { let n = 0; for (let i = 0; i < 8; i++) if (f & (1 << i)) n += 2; return n; }
  xAdvOf(off: number, f: number) { // XAdvance from a ValueRecord (or XPlacement fallback ignored)
    let o = off;
    if (f & 1) o += 2; if (f & 2) o += 2;
    if (f & 4) return this.d.getInt16(o);
    return 0;
  }

  readGpos() {
    const d = this.d, g = this.tables.GPOS;
    const fl = g + d.getUint16(g + 6), ll = g + d.getUint16(g + 8);
    const kernLookups = new Set<number>();
    const nf = d.getUint16(fl);
    for (let i = 0; i < nf; i++) {
      const tag = String.fromCharCode(d.getUint8(fl + 2 + i * 6), d.getUint8(fl + 3 + i * 6), d.getUint8(fl + 4 + i * 6), d.getUint8(fl + 5 + i * 6));
      if (tag !== 'kern') continue;
      const fo = fl + d.getUint16(fl + 6 + i * 6);
      const nl = d.getUint16(fo + 2);
      for (let k = 0; k < nl; k++) kernLookups.add(d.getUint16(fo + 4 + k * 2));
    }
    for (const li of [...kernLookups].sort((a, b) => a - b)) {
      const lo = ll + d.getUint16(ll + 2 + li * 2);
      let type = d.getUint16(lo);
      const ns = d.getUint16(lo + 4);
      for (let s = 0; s < ns; s++) {
        let so = lo + d.getUint16(lo + 6 + s * 2);
        if (type === 9) { const et = d.getUint16(so + 2); so = so + d.getUint32(so + 4); if (et !== 2) continue; }
        else if (type !== 2) continue;
        this.readPairPos(so);
      }
      void type;
    }
  }
  readPairPos(so: number) {
    const d = this.d;
    const fmt = d.getUint16(so);
    const cov = this.coverage(so + d.getUint16(so + 2));
    const f1 = d.getUint16(so + 4), f2 = d.getUint16(so + 6);
    const s1 = this.valueSize(f1), s2 = this.valueSize(f2);
    if (fmt === 1) {
      const nps = d.getUint16(so + 8);
      const covInv: number[] = [];
      for (const [gid, idx] of cov) covInv[idx] = gid;
      for (let i = 0; i < nps; i++) {
        const ps = so + d.getUint16(so + 10 + i * 2);
        const n = d.getUint16(ps);
        const g1 = covInv[i];
        for (let k = 0; k < n; k++) {
          const r = ps + 2 + k * (2 + s1 + s2);
          const g2 = d.getUint16(r);
          const v = this.xAdvOf(r + 2, f1);
          const key = g1 * 65536 + g2;
          if (v && !this.kern.has(key)) this.kern.set(key, v);
        }
      }
    } else if (fmt === 2) {
      const c1 = this.classDef(so + d.getUint16(so + 8)), c2 = this.classDef(so + d.getUint16(so + 10));
      const n1 = d.getUint16(so + 12), n2 = d.getUint16(so + 14);
      const vals = new Int16Array(n1 * n2);
      for (let a = 0; a < n1; a++) for (let b = 0; b < n2; b++) vals[a * n2 + b] = this.xAdvOf(so + 16 + (a * n2 + b) * (s1 + s2), f1);
      this.classKerns.push({ cov, c1, c2, n2, vals });
    }
  }
  kernPair(a: number, b: number): number {
    const v = this.kern.get(a * 65536 + b);
    if (v !== undefined) return v;
    for (const k of this.classKerns) {
      if (!k.cov.has(a)) continue;
      const x = k.vals[(k.c1.get(a) ?? 0) * k.n2 + (k.c2.get(b) ?? 0)];
      if (x) return x;
      // first subtable that covers the glyph decides (per spec), but zero allows fallthrough harmlessly
    }
    return 0;
  }

  gid(ch: number): number { return this.cmap.get(ch) ?? this.cmap.get(0x3f) ?? 0; }

  glyph(gid: number): Glyph {
    const c = this.cache.get(gid);
    if (c) return c;
    const d = this.d, loca = this.tables.loca, glyf = this.tables.glyf;
    const off = this.locaLong ? d.getUint32(loca + gid * 4) : d.getUint16(loca + gid * 2) * 2;
    const end = this.locaLong ? d.getUint32(loca + gid * 4 + 4) : d.getUint16(loca + gid * 2 + 2) * 2;
    const g: Glyph = { contours: [], adv: this.advs[gid] };
    if (end > off) {
      const o = glyf + off;
      const nc = d.getInt16(o);
      if (nc >= 0) this.simple(o, nc, g);
      else this.composite(o, g);
    }
    this.cache.set(gid, g);
    return g;
  }
  simple(o: number, nc: number, g: Glyph) {
    const d = this.d;
    const ends: number[] = [];
    for (let i = 0; i < nc; i++) ends.push(d.getUint16(o + 10 + i * 2));
    const np = nc ? ends[nc - 1] + 1 : 0;
    const il = d.getUint16(o + 10 + nc * 2);
    let p = o + 12 + nc * 2 + il;
    const flags: number[] = [];
    while (flags.length < np) {
      const f = d.getUint8(p++); flags.push(f);
      if (f & 8) { let r = d.getUint8(p++); while (r-- > 0) flags.push(f); }
    }
    const xs: number[] = [], ys: number[] = [];
    let v = 0;
    for (const f of flags) { if (f & 2) { const dx = d.getUint8(p++); v += f & 16 ? dx : -dx; } else if (!(f & 16)) { v += d.getInt16(p); p += 2; } xs.push(v); }
    v = 0;
    for (const f of flags) { if (f & 4) { const dy = d.getUint8(p++); v += f & 32 ? dy : -dy; } else if (!(f & 32)) { v += d.getInt16(p); p += 2; } ys.push(v); }
    let s = 0;
    for (const e of ends) {
      const c: { x: number; y: number; on: boolean }[] = [];
      for (let i = s; i <= e; i++) c.push({ x: xs[i], y: ys[i], on: !!(flags[i] & 1) });
      g.contours.push(c); s = e + 1;
    }
  }
  composite(o: number, g: Glyph) {
    const d = this.d;
    let p = o + 10, more = true;
    while (more) {
      const flags = d.getUint16(p), gi = d.getUint16(p + 2); p += 4;
      let dx = 0, dy = 0;
      if (flags & 1) { dx = d.getInt16(p); dy = d.getInt16(p + 2); p += 4; } else { dx = d.getInt8(p); dy = d.getInt8(p + 1); p += 2; }
      let a = 1, b = 0, c = 0, e = 1;
      if (flags & 8) { a = e = d.getInt16(p) / 16384; p += 2; }
      else if (flags & 0x40) { a = d.getInt16(p) / 16384; e = d.getInt16(p + 2) / 16384; p += 4; }
      else if (flags & 0x80) { a = d.getInt16(p) / 16384; b = d.getInt16(p + 2) / 16384; c = d.getInt16(p + 4) / 16384; e = d.getInt16(p + 6) / 16384; p += 8; }
      const sub = this.glyph(gi);
      for (const ct of sub.contours) g.contours.push(ct.map((q) => ({ x: a * q.x + c * q.y + dx, y: b * q.x + e * q.y + dy, on: q.on })));
      more = !!(flags & 0x20);
    }
  }

  // Append the outline of one glyph at (x, baseline y), scale s (px per unit).
  outline(path: Path, gid: number, x: number, y: number, s: number, skew = 0) {
    const g = this.glyph(gid);
    for (const c of g.contours) {
      if (!c.length) continue;
      const P = (q: { x: number; y: number }): Pt => [x + q.x * s + skew * q.y * s, y - q.y * s];
      // find a start on-curve point
      let start = c.findIndex((q) => q.on);
      let pts = c;
      if (start < 0) { // all off-curve: synthesize midpoint
        const m = { x: (c[0].x + c[1].x) / 2, y: (c[0].y + c[1].y) / 2, on: true };
        pts = [m, ...c.slice(1), c[0]]; start = 0;
      } else pts = [...c.slice(start), ...c.slice(0, start)];
      const p0 = P(pts[0]);
      path.moveTo(p0[0], p0[1]);
      let ctrl: { x: number; y: number } | null = null;
      for (let i = 1; i <= pts.length; i++) {
        const q = pts[i % pts.length];
        if (q.on) {
          const t = P(q);
          if (ctrl) { const cc = P(ctrl); path.quadTo(cc[0], cc[1], t[0], t[1]); ctrl = null; } else path.lineTo(t[0], t[1]);
        } else {
          if (ctrl) {
            const mid = { x: (ctrl.x + q.x) / 2, y: (ctrl.y + q.y) / 2 };
            const cc = P(ctrl), t = P(mid);
            path.quadTo(cc[0], cc[1], t[0], t[1]);
          }
          ctrl = q;
        }
      }
      path.close();
    }
  }
}

// ---------------------------------------------------------------- text
export type TextStyle = { font: Font; size: number; color: RGB; track?: number; gamma?: number; skew?: number };

export function measure(st: TextStyle, s: string): number {
  const f = st.font, k = st.size / f.upm;
  let w = 0, prev = -1;
  const chars = [...s];
  for (let i = 0; i < chars.length; i++) {
    const g = f.gid(chars[i].codePointAt(0)!);
    if (prev >= 0) w += f.kernPair(prev, g) * k;
    w += f.advs[g] * k + (i < chars.length - 1 ? (st.track ?? 0) : 0);
    prev = g;
  }
  return w;
}

export function drawText(cv: Canvas, st: TextStyle, s: string, x: number, y: number, align: 'l' | 'c' | 'r' = 'l'): number {
  const w = measure(st, s);
  if (align === 'c') x -= w / 2; else if (align === 'r') x -= w;
  const f = st.font, k = st.size / f.upm;
  const path = new Path();
  path.tol = 0.1;
  let pen = x, prev = -1;
  for (const ch of s) {
    const g = f.gid(ch.codePointAt(0)!);
    if (prev >= 0) pen += f.kernPair(prev, g) * k;
    f.outline(path, g, pen, y, k, st.skew ?? 0);
    pen += f.advs[g] * k + (st.track ?? 0);
    prev = g;
  }
  cv.fill(path, st.color, 1, st.gamma ?? 0.85);
  return w;
}

// Rich run: segments with their own styles drawn left to right.
export function drawRuns(cv: Canvas, runs: [TextStyle, string][], x: number, y: number): number {
  let pen = x;
  for (const [st, s] of runs) pen += drawText(cv, st, s, pen, y);
  return pen - x;
}
export function measureRuns(runs: [TextStyle, string][]) { let w = 0; for (const [st, s] of runs) w += measure(st, s); return w; }

export function wrap(st: TextStyle, s: string, width: number): string[] {
  const words = s.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = '';
  for (const wd of words) {
    const t = cur ? cur + ' ' + wd : wd;
    if (measure(st, t) <= width || !cur) cur = t; else { lines.push(cur); cur = wd; }
  }
  if (cur) lines.push(cur);
  return lines;
}

// Largest size (<= max) at which s fits in width.
export function fitSize(st: TextStyle, s: string, width: number, max: number, min = 6): number {
  let size = max;
  while (size > min && measure({ ...st, size }, s) > width) size -= 0.25;
  return size;
}
