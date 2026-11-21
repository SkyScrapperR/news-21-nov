// The front page of Saturday 21 November 2026, drawn from scratch: vector type (OFL fonts parsed by gfx.ts),
// hand-coded illustrations (art.ts), a hand-made world map (world.ts) and the day's stories (news.ts).
// Node 22, standard library only, offline and deterministic. Writes /output/entry.png (or $MAKEFUN_OUTPUT_DIR).
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Canvas, Font, hex, mix, drawText, measure, wrap, fitSize, Path, type RGB, type TextStyle } from './gfx.ts';
import { LAND, WATER } from './world.ts';
import { DAY, HEROES, TILES, BRIEFS, NUMBERS, TIMELINE, DATECHECK, CORRECTIONS, REGIONS, type Story, type Badge } from './news.ts';
import { ART, TILE_ART } from './art.ts';

const F = (n: string) => new Font(new URL('./fonts/' + n, import.meta.url));
const disp = F('DMSerifDisplay-Regular.ttf'), serif = F('DMSerifText-Regular.ttf');
const sans = F('Lato-Regular.ttf'), sansB = F('Lato-Bold.ttf'), sansK = F('Lato-Black.ttf');

export const C = {
  paper: hex('#f7f2e6'), ink: hex('#1a1915'), soft: hex('#55524a'), mute: hex('#8a8576'), rule: hex('#cfc7b2'),
  red: hex('#b4231b'), panel: hex('#efe8d6'),
};
const BADGE: Record<Badge, { t: string; c: RGB }> = {
  C: { t: 'CONFIRMED', c: hex('#1f6f43') },
  O: { t: 'OFFICIAL', c: hex('#22508f') },
  R: { t: 'REPORTED', c: hex('#9a5b00') },
};
const regionColor = (r: string) => hex(REGIONS.find((x) => x.k === r)!.c);

const W = 1024, H = 1024, M = 14;
const cv = new Canvas(W, H, C.paper);
const T = (font: Font, size: number, color: RGB, track = 0): TextStyle => ({ font, size, color, track });

// ---------------------------------------------------------------- pieces
function badge(b: Badge, x: number, y: number, align: 'l' | 'r' = 'l', size = 7.5): number {
  const st = T(sansK, size, C.paper, 0.5);
  const w = measure(st, BADGE[b].t) + 8 + size;
  const bx = align === 'r' ? x - w : x;
  cv.rrect(bx, y, w, size + 5, 2, BADGE[b].c);
  // little seal: a tick for confirmed, a dot for official, a ring for reported
  const cx = bx + 4 + size * 0.42, cy = y + (size + 5) / 2;
  if (b === 'C') cv.line([[cx - 2.4, cy], [cx - 0.6, cy + 1.8], [cx + 2.6, cy - 2]], 1.3, C.paper);
  else if (b === 'O') cv.circle(cx, cy, 2.2, C.paper);
  else { cv.circle(cx, cy, 2.6, C.paper); cv.circle(cx, cy, 1.3, BADGE[b].c); }
  drawText(cv, st, BADGE[b].t, bx + 6 + size * 0.85, y + size + 1.6);
  return w;
}

function numDot(n: number, x: number, y: number, r: number, col: RGB) {
  cv.circle(x, y, r, col);
  const st = T(sansK, r * 1.15, C.paper);
  drawText(cv, st, String(n), x, y + r * 0.42, 'c');
}

function lines(st: TextStyle, s: string, x: number, y: number, w: number, max: number, lh: number): number {
  let ls = wrap(st, s, w);
  if (ls.length > max) {
    ls = ls.slice(0, max);
    let last = ls[max - 1];
    while (measure(st, last + '…') > w && last.includes(' ')) last = last.slice(0, last.lastIndexOf(' '));
    ls[max - 1] = last + '…';
  }
  ls.forEach((l, i) => drawText(cv, st, l, x, y + i * lh));
  return ls.length;
}

function kicker(s: Story, x: number, y: number, size: number) {
  const col = regionColor(s.region);
  numDot(s.n, x + size * 0.7, y - size * 0.36, size * 0.72, col);
  drawText(cv, T(sansK, size, col, 0.5), `${s.place.toUpperCase()} · ${s.cat.toUpperCase()}`, x + size * 1.75, y);
}

// ---------------------------------------------------------------- 1. top line + masthead
const regionsUsed = new Set([...HEROES, ...TILES, ...BRIEFS].map((s) => s.region));
const total = HEROES.length + TILES.length + BRIEFS.length;
cv.rect(0, 0, W, 20, C.ink);
drawText(cv, T(sansK, 9.5, C.paper, 1.2), 'THE WORLD IN ONE DAY', M, 13.5);
drawText(cv, T(sansK, 9.5, hex('#f3c9a0'), 1.0), `${total} STORIES · ${regionsUsed.size} REGIONS · EVERY ONE DATED ${DAY.toUpperCase()}`, W - M, 13.5, 'r');

const mast = `${DAY}`;
const ms = fitSize(T(disp, 90, C.ink), mast, W - 2 * M - 8, 90);
drawText(cv, T(disp, ms, C.ink), mast, W / 2, 92, 'c');
cv.hline(M, W - M, 104, 2.2, C.ink);
cv.hline(M, W - M, 108, 0.8, C.ink);
drawText(cv, { font: serif, size: 15.5, color: C.soft, skew: 0.18 }, HEROES.map((h) => h.sub).join('  ·  '), W / 2, 126, 'c');

// ---------------------------------------------------------------- 2. the day in UTC
let y = 134;
{
  const h = 44;
  cv.rect(M, y, W - 2 * M, h, C.panel);
  cv.rect(M, y, 76, h, C.ink);
  drawText(cv, T(sansK, 9, C.paper, 0.8), 'THE DAY', M + 38, y + 17, 'c');
  drawText(cv, T(sansK, 9, C.paper, 0.8), 'IN UTC', M + 38, y + 29, 'c');
  drawText(cv, T(sans, 7.5, hex('#d9d2bf')), '00:00 → 24:00', M + 38, y + 39, 'c');
  const ax0 = M + 90, ax1 = W - M - 14, ay = y + 13;
  cv.hline(ax0, ax1, ay, 1.4, C.ink);
  for (let hh = 0; hh <= 24; hh += 3) {
    const x = ax0 + ((ax1 - ax0) * hh) / 24;
    cv.vline(x, ay - 3, ay + 3, 1, C.ink);
    drawText(cv, T(sansB, 7, C.mute), String(hh).padStart(2, '0'), x, ay - 5, 'c');
  }
  const slot = (ax1 - ax0) / TIMELINE.length;
  TIMELINE.forEach((e, i) => {
    const [hh, mm] = e.t.split(':').map(Number);
    const x = ax0 + ((ax1 - ax0) * (hh + mm / 60)) / 24;
    const col = regionColor(e.region);
    cv.circle(x, ay, 4, col);
    const lx = ax0 + slot * i + 2;
    cv.line([[x, ay + 4], [lx + 2, ay + 9]], 0.8, col);
    drawText(cv, T(sansK, 8.5, col), e.t, lx, ay + 18);
    drawText(cv, T(sansB, 8.2, C.ink), e.label, lx + measure(T(sansK, 8.5, col), e.t) + 4, ay + 18);
    drawText(cv, T(sans, 7.8, C.soft), e.sub, lx, ay + 28);
  });
  y += h + 4;
}

// ---------------------------------------------------------------- 3. numbers strip
{
  const h = 40, n = NUMBERS.length, cw = (W - 2 * M) / n;
  NUMBERS.forEach((k, i) => {
    const x = M + i * cw;
    cv.rect(x, y, 3, h, regionColor(k.region));
    drawText(cv, T(disp, 24, C.red), k.v, x + 9, y + 21);
    lines(T(sans, 8.3, C.soft), k.cap, x + 9, y + 31, cw - 16, 2, 9);
  });
  y += h + 4;
}

// ---------------------------------------------------------------- 4. region bar
{
  const h = 14;
  const counts = REGIONS.map((r) => ({ ...r, n: [...HEROES, ...TILES, ...BRIEFS].filter((s) => s.region === r.k).length })).filter((r) => r.n > 0);
  const sum = counts.reduce((a, b) => a + b.n, 0);
  let x = M;
  const avail = W - 2 * M - (counts.length - 1) * 2;
  const minW = 72;
  const extra = avail - minW * counts.length;
  for (const r of counts) {
    const w = minW + (extra * r.n) / sum;
    cv.rect(x, y, w, h, hex(r.c));
    drawText(cv, T(sansK, 8.2, C.paper, 0.3), `${r.name} ${r.n}`, x + w / 2, y + 10, 'c');
    x += w + 2;
  }
  y += h + 6;
}

// ---------------------------------------------------------------- 5. heroes
{
  const gap = 12, hw = (W - 2 * M - 2 * gap) / 3, ah = 122;
  HEROES.forEach((s, i) => {
    const x = M + i * (hw + gap);
    cv.setClip(x, y, hw, ah);
    ART[s.art](cv, x, y, hw, ah, s);
    cv.noClip();
    // label banner + fact chip inside the art
    const lb = T(sansK, 15, C.paper, 0.4);
    const lw = measure(lb, s.label) + 14;
    cv.rect(x + 6, y + 6, lw, 23, C.red);
    drawText(cv, lb, s.label, x + 13, y + 23);
    const fc = T(sansK, 10, C.ink);
    const fw = measure(fc, s.fact) + 12;
    cv.rect(x + 6, y + 33, fw, 17, hex('#fffdf6'));
    drawText(cv, fc, s.fact, x + 12, y + 45.5);
    const sc = T(sansB, 7.6, C.paper);
    const sw = measure(sc, s.src) + 10;
    cv.rect(x + 6, y + ah - 16, sw, 13, mix(C.ink, C.paper, 0.05));
    drawText(cv, sc, s.src, x + 11, y + ah - 6.5);
    badge(s.badge, x + hw - 6, y + ah - 17, 'r', 7.5);
    let ty = y + ah + 15;
    kicker(s, x, ty, 9);
    ty += 22;
    const hs = T(serif, 19.5, C.ink);
    const nl = lines(hs, s.head, x, ty, hw, 2, 21);
    ty += (nl - 1) * 21 + 15;
    lines(T(sans, 10.6, C.soft), s.sum, x, ty, hw, 2, 12.6);
  });
  y += ah + 104;
}

// ---------------------------------------------------------------- 6. tiles
{
  cv.hline(M, W - M, y - 4, 1, C.ink);
  const cols = 5, gap = 10, tw = (W - 2 * M - (cols - 1) * gap) / cols, ah = 58, th = 132;
  TILES.forEach((s, i) => {
    const x = M + (i % cols) * (tw + gap), ty0 = y + 4 + Math.floor(i / cols) * (th + 6);
    cv.setClip(x, ty0, tw, ah);
    TILE_ART[s.art](cv, x, ty0, tw, ah, s);
    cv.noClip();
    badge(s.badge, x + tw - 4, ty0 + ah - 15, 'r', 6.8);
    let ty = ty0 + ah + 13;
    kicker(s, x, ty, 7.6);
    ty += 17;
    const nl = lines(T(serif, 14.2, C.ink), s.head, x, ty, tw, 2, 15.2);
    ty += (nl - 1) * 15.2 + 13;
    lines(T(sans, 9.2, C.soft), s.sum, x, ty, tw, 1, 10);
    drawText(cv, T(sansB, 7.6, C.mute), s.src, x, ty + 11);
  });
  y += 4 + 2 * th + 6 + 2;
}

// ---------------------------------------------------------------- 7. map + also list
{
  cv.hline(M, W - M, y, 1.6, C.ink);
  y += 4;
  const mw = 318, mh = 168;
  drawText(cv, T(sansK, 9, C.ink, 1), 'WHERE IT HAPPENED', M, y + 10);
  const my = y + 15;
  cv.rect(M, my, mw, mh, hex('#dfe6e4'));
  const lon0 = -170, lon1 = 190, lat0 = 76, lat1 = -50;
  const P = (lon: number, lat: number): [number, number] => [M + ((lon - lon0) / (lon1 - lon0)) * mw, my + ((lat0 - lat) / (lat0 - lat1)) * mh];
  cv.setClip(M, my, mw, mh);
  const land = new Path();
  for (const poly of LAND) { land.moveTo(...P(poly[0], poly[1])); for (let i = 2; i < poly.length; i += 2) land.lineTo(...P(poly[i], poly[i + 1])); land.close(); }
  cv.fill(land, hex('#cdbf9c'));
  for (const poly of WATER) { const w = new Path(); w.moveTo(...P(poly[0], poly[1])); for (let i = 2; i < poly.length; i += 2) w.lineTo(...P(poly[i], poly[i + 1])); cv.fill(w.close(), hex('#dfe6e4')); }
  cv.noClip();
  // pins, larger stories on top
  const pinned = [...BRIEFS, ...TILES, ...HEROES].filter((s) => s.lon !== undefined);
  for (const s of pinned) {
    const [px, py] = P(s.lon!, s.lat!);
    const r = s.n <= 3 ? 6.2 : s.n <= 13 ? 5.2 : 4.4;
    cv.circle(px, py, r + 1, C.paper);
    numDot(s.n, px, py, r, regionColor(s.region));
  }
  drawText(cv, T(sans, 7.6, C.mute), 'Each pin carries the number of its story on this page; colour = region.', M, my + mh + 10);

  // also list
  const lx = M + mw + 16, lw = W - M - lx, colw = (lw - 14) / 2;
  drawText(cv, T(sansK, 9, C.ink, 1), `ALSO ON ${DAY.toUpperCase().replace(/^SATURDAY /, 'SATURDAY ')} — ${BRIEFS.length} MORE`, lx, y + 10);
  const per = Math.ceil(BRIEFS.length / 2), lh = (mh + 8) / per;
  BRIEFS.forEach((s, i) => {
    const x = lx + (i >= per ? colw + 14 : 0), by = my + 9 + (i % per) * lh;
    const col = regionColor(s.region);
    const ns = T(sansK, 9, col);
    drawText(cv, ns, String(s.n), x + 12, by, 'r');
    const ps = T(sansK, 9, C.ink);
    const pw = drawText(cv, ps, s.place, x + 16, by);
    const ss = T(sans, 9, C.ink);
    const src = ` (${s.src})`;
    const room = colw - 16 - pw - 4 - measure(T(sans, 8, C.mute), src);
    let t = s.head;
    const st = { ...ss, size: fitSize(ss, t, room, 9, 7.6) };
    drawText(cv, st, t, x + 16 + pw + 4, by);
    drawText(cv, T(sans, 8, C.mute), src, x + 16 + pw + 4 + measure(st, t), by);
  });
  y = my + mh + 16;
}

// ---------------------------------------------------------------- 8. date check, legend, corrections, footer
{
  const h = 44;
  cv.strokeRect(M, y, W - 2 * M, h, 1.6, C.red);
  drawText(cv, T(sansK, 9.5, C.red, 0.8), 'DATE CHECK', M + 8, y + 14);
  const st = T(sans, 8.8, C.ink);
  let ty = y + 14;
  const parts: [string, string][] = [['Left out (other day): ', DATECHECK.left], ['Not yet (future): ', DATECHECK.future]];
  const x0 = M + 82;
  for (const [k, v] of parts) {
    const kw = drawText(cv, T(sansK, 8.8, C.ink), k, x0, ty);
    lines(st, v, x0 + kw, ty, W - 2 * M - 92 - kw, 2, 10.5);
    ty += 21;
  }
  y += h + 6;
  let x = M;
  drawText(cv, T(sansK, 7.8, C.ink, 0.6), 'HOW WE CHECKED', x, y + 8);
  x += 82;
  for (const b of ['C', 'O', 'R'] as Badge[]) {
    x += badge(b, x, y, 'l', 6.6) + 4;
    const d = b === 'C' ? '2+ major outlets' : b === 'O' ? 'on the record (officials, agencies)' : 'one major outlet';
    x += drawText(cv, T(sans, 8, C.soft), d, x, y + 8.5) + 12;
  }
  drawText(cv, T(sans, 8, C.soft), CORRECTIONS, W - M, y + 8.5, 'r');
  cv.hline(M, W - M, y + 14, 0.8, C.rule);
  drawText(cv, T(sans, 7.8, C.mute), 'Every story here happened, or was first reported, on Saturday 21 November 2026 (UTC times). Sources: Reuters, AP, AFP, BBC, Al Jazeera, Anadolu, Kyodo, Antara and official statements, named beside each story.', M, y + 24);
  drawText(cv, T(sans, 7.8, C.mute), 'All drawings original · type: DM Serif & Lato (OFL)', W - M, y + 24, 'r');
}

writeFileSync(join(process.env.MAKEFUN_OUTPUT_DIR ?? '/output', 'entry.png'), cv.png());
