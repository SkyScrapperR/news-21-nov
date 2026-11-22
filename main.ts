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
  paper: hex('#f7f2e6'), ink: hex('#151411'), soft: hex('#45423b'), mute: hex('#7d786b'), rule: hex('#cfc7b2'),
  red: hex('#b4231b'), panel: hex('#ece4cf'),
};
const BADGE: Record<Badge, { t: string; c: RGB }> = {
  C: { t: 'CONFIRMED', c: hex('#1f6f43') },
  O: { t: 'OFFICIAL', c: hex('#22508f') },
  R: { t: 'REPORTED', c: hex('#9a5b00') },
};
const regionColor = (r: string) => hex(REGIONS.find((x) => x.k === r)!.c);

const W = 1024, H = 1024, M = 14, GAP = 12;
const cv = new Canvas(W, H, C.paper);
const T = (font: Font, size: number, color: RGB, track = 0): TextStyle => ({ font, size, color, track });
let truncated = 0;

// ---------------------------------------------------------------- pieces
function badgeWidth(b: Badge, size: number) { return measure(T(sansK, size, C.paper, 0.5), BADGE[b].t) + 8 + size; }
function badge(b: Badge, x: number, y: number, align: 'l' | 'r' = 'l', size = 7.5): number {
  const st = T(sansK, size, C.paper, 0.5);
  const w = badgeWidth(b, size);
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
  drawText(cv, T(sansK, r * 1.15, C.paper), String(n), x, y + r * 0.42, 'c');
}

// wrapped text; anything that would need an ellipsis is counted and reported on stderr (the page should have none)
function lines(st: TextStyle, s: string, x: number, y: number, w: number, max: number, lh: number): number {
  let ls = wrap(st, s, w);
  if (ls.length > max) {
    truncated++;
    process.stderr.write(`truncated: ${s}\n`);
    ls = ls.slice(0, max);
    let last = ls[max - 1];
    while (measure(st, last + '…') > w && last.includes(' ')) last = last.slice(0, last.lastIndexOf(' '));
    ls[max - 1] = last + '…';
  }
  ls.forEach((l, i) => drawText(cv, st, l, x, y + i * lh));
  return ls.length;
}

// largest serif headline size (max..min) whose text wraps to at most two lines in width w, with synthetic bold
function fitHead(head: string, w: number, max: number, min: number, bold: number): TextStyle {
  for (let size = max; size > min; size -= 0.25) {
    const st = { ...T(serif, size, C.ink), bold };
    if (wrap(st, head, w - bold - 1).length <= 2) return st;
  }
  return { ...T(serif, min, C.ink), bold };
}

// numbered dot + PLACE · CATEGORY in the region colour, with the story's badge right-aligned on the same line
function kicker(s: Story, x: number, y: number, size: number, width: number, bsize: number) {
  const col = regionColor(s.region);
  numDot(s.n, x + size * 0.72, y - size * 0.36, size * 0.74, col);
  const bw = badge(s.badge, x + width, y - bsize - 1.5, 'r', bsize);
  const txt = `${s.place.toUpperCase()} · ${s.cat.toUpperCase()}`;
  const st = T(sansK, size, col, 0.4);
  const fs = fitSize(st, txt, width - size * 1.8 - bw - 6, size, size * 0.8);
  drawText(cv, { ...st, size: fs }, txt, x + size * 1.8, y);
}

// ---------------------------------------------------------------- 1. top line + masthead
const regionsUsed = new Set([...HEROES, ...TILES, ...BRIEFS].map((s) => s.region));
const total = HEROES.length + TILES.length + BRIEFS.length;
cv.rect(0, 0, W, 21, C.ink);
drawText(cv, T(sansK, 9.5, C.paper, 1.2), 'THE WORLD IN ONE DAY', M, 14.5);
drawText(cv, T(sansK, 9.5, hex('#f3c9a0'), 1.0), `${total} STORIES · ${regionsUsed.size} REGIONS · EVERY ONE DATED ${DAY.toUpperCase()}`, W - M, 14.5, 'r');

const mast = DAY;
const mstyle = { ...T(disp, 92, C.ink), bold: 1.1 };
const ms = fitSize(mstyle, mast, W - 2 * M - 4, 92);
drawText(cv, { ...mstyle, size: ms }, mast, W / 2, 94, 'c');
cv.hline(M, W - M, 106, 2.4, C.ink);
cv.hline(M, W - M, 110.5, 0.8, C.ink);
drawText(cv, { font: serif, size: 16.5, color: C.ink, skew: 0.16 }, HEROES.map((h) => h.sub).join('   ·   '), W / 2, 129, 'c');

// ---------------------------------------------------------------- 2. the day in UTC
let y = 138;
{
  const h = 38;
  cv.rect(M, y, W - 2 * M, h, C.panel);
  cv.rect(M, y, 78, h, C.ink);
  drawText(cv, T(sansK, 9.2, C.paper, 0.8), 'THE DAY', M + 39, y + 16, 'c');
  drawText(cv, T(sansK, 9.2, C.paper, 0.8), 'IN UTC', M + 39, y + 28, 'c');
  const ax0 = M + 92, ax1 = W - M - 12, ay = y + 11;
  cv.hline(ax0, ax1, ay, 1.4, C.ink);
  for (let hh = 0; hh <= 24; hh += 6) {
    const x = ax0 + ((ax1 - ax0) * hh) / 24;
    cv.vline(x, ay - 3, ay + 3, 1, C.ink);
    drawText(cv, T(sansB, 6.8, C.mute), String(hh).padStart(2, '0'), x + (hh === 24 ? -2 : 2), ay - 4, hh === 24 ? 'r' : 'l');
  }
  const slot = (ax1 - ax0) / TIMELINE.length;
  TIMELINE.forEach((e, i) => {
    const x = ax0 + ((ax1 - ax0) * e.h) / 24;
    const col = regionColor(e.region);
    const lx = ax0 + slot * i + 2;
    cv.line([[x, ay], [lx + 3, ay + 7]], 0.8, col);
    cv.circle(x, ay, 3.6, col);
    const ts = T(sansK, 9, col);
    drawText(cv, ts, e.t, lx, ay + 16);
    drawText(cv, T(sansK, 8.6, C.ink), e.label, lx + measure(ts, e.t) + 4, ay + 16);
    drawText(cv, T(sans, 8, C.soft), e.sub, lx, ay + 25.5);
  });
  y += h + 5;
}

// ---------------------------------------------------------------- 3. numbers strip
{
  const h = 44, n = NUMBERS.length, cw = (W - 2 * M - (n - 1) * 6) / n;
  NUMBERS.forEach((k, i) => {
    const x = M + i * (cw + 6);
    cv.rect(x, y, cw, h, hex('#fffaf0'));
    cv.rect(x, y, 4, h, regionColor(k.region));
    drawText(cv, { ...T(disp, 30, C.red), bold: 0.5 }, k.v, x + 12, y + 27);
    const cs = T(sansB, 8.8, C.soft);
    drawText(cv, { ...cs, size: fitSize(cs, k.cap, cw - 18, 8.8, 7.2) }, k.cap, x + 12, y + 39);
  });
  y += h + 5;
}

// ---------------------------------------------------------------- 4. region bar
{
  const h = 14;
  const counts = REGIONS.map((r) => ({ ...r, n: [...HEROES, ...TILES, ...BRIEFS].filter((s) => s.region === r.k).length })).filter((r) => r.n > 0);
  const sum = counts.reduce((a, b) => a + b.n, 0);
  let x = M;
  const avail = W - 2 * M - (counts.length - 1) * 2;
  const minW = 76;
  const extra = avail - minW * counts.length;
  for (const r of counts) {
    const w = minW + (extra * r.n) / sum;
    cv.rect(x, y, w, h, hex(r.c));
    drawText(cv, T(sansK, 8.4, C.paper, 0.3), `${r.name} ${r.n}`, x + w / 2, y + 10.2, 'c');
    x += w + 2;
  }
  y += h + 8;
}

// ---------------------------------------------------------------- 5. heroes
{
  const hw = (W - 2 * M - 2 * GAP) / 3, ah = 130;
  HEROES.forEach((s, i) => {
    const x = M + i * (hw + GAP);
    cv.setClip(x, y, hw, ah);
    ART[s.art](cv, x, y, hw, ah, s);
    cv.noClip();
    // label banner + fact chip inside the art, source chip at its foot
    const lb = T(sansK, 19.5, C.paper, 0.3);
    const lw = measure(lb, s.label!) + 16;
    cv.rect(x, y, lw + 6, 34, C.red);
    drawText(cv, lb, s.label!, x + 10, y + 25);
    const fc = T(sansK, 11.5, C.ink);
    const fw = measure(fc, s.fact!) + 14;
    cv.rect(x, y + 34, fw, 20, hex('#fffdf6'));
    drawText(cv, fc, s.fact!, x + 8, y + 48.5);
    const sc = T(sansB, 7.8, C.paper);
    const sw = measure(sc, s.src) + 12;
    cv.rect(x, y + ah - 15, sw, 15, hex('#1a1915'));
    drawText(cv, sc, s.src, x + 6, y + ah - 4.5);
    let ty = y + ah + 16;
    kicker(s, x, ty, 9.2, hw, 7.4);
    const hs = fitHead(s.head, hw, 25.5, 19, 0.6);
    ty += hs.size + 4;
    const nl = lines(hs, s.head, x, ty, hw, 2, hs.size * 1.03);
    ty += (nl - 1) * hs.size * 1.03 + 15;
    lines(T(sans, 10.8, C.soft), s.sum, x, ty, hw, 2, 12.6);
  });
  y += ah + 113;
}

// ---------------------------------------------------------------- 6. tiles
{
  cv.hline(M, W - M, y - 5, 1.2, C.ink);
  const cols = 5, tw = (W - 2 * M - (cols - 1) * GAP) / cols, ah = 64, th = 140;
  TILES.forEach((s, i) => {
    const x = M + (i % cols) * (tw + GAP), ty0 = y + 3 + Math.floor(i / cols) * (th + 8);
    cv.setClip(x, ty0, tw, ah);
    TILE_ART[s.art](cv, x, ty0, tw, ah, s);
    cv.noClip();
    let ty = ty0 + ah + 13;
    kicker(s, x, ty, 7.8, tw, 6.4);
    const hs = fitHead(s.head, tw, 17.5, 13.5, 0.4);
    ty += hs.size + 3;
    const nl = lines(hs, s.head, x, ty, tw, 2, hs.size * 1.03);
    ty += (nl - 1) * hs.size * 1.03 + 13;
    lines(T(sans, 9.3, C.soft), s.sum, x, ty, tw, 1, 10);
    const ss = T(sansB, 7.6, C.mute);
    drawText(cv, { ...ss, size: fitSize(ss, s.src, tw, 7.6, 6.6) }, s.src, x, ty + 11);
  });
  y += 3 + 2 * th + 15;
}

// ---------------------------------------------------------------- 7. map + also list
const footTop = H - 74;
{
  cv.hline(M, W - M, y, 1.6, C.ink);
  y += 5;
  const mw = 318;
  drawText(cv, T(sansK, 9.2, C.ink, 1), 'WHERE IT HAPPENED', M, y + 10);
  const my = y + 16, mh = footTop - 22 - my;
  cv.rect(M, my, mw, mh, hex('#dfe6e4'));
  const lon0 = -170, lon1 = 190, lat0 = 76, lat1 = -50;
  const P = (lon: number, lat: number): [number, number] => [M + ((lon - lon0) / (lon1 - lon0)) * mw, my + ((lat0 - lat) / (lat0 - lat1)) * mh];
  cv.setClip(M, my, mw, mh);
  const land = new Path();
  for (const poly of LAND) { land.moveTo(...P(poly[0], poly[1])); for (let i = 2; i < poly.length; i += 2) land.lineTo(...P(poly[i], poly[i + 1])); land.close(); }
  cv.fill(land, hex('#cdbf9c'));
  for (const poly of WATER) { const w = new Path(); w.moveTo(...P(poly[0], poly[1])); for (let i = 2; i < poly.length; i += 2) w.lineTo(...P(poly[i], poly[i + 1])); cv.fill(w.close(), hex('#dfe6e4')); }
  cv.noClip();
  const pinned = [...BRIEFS, ...TILES, ...HEROES].filter((s) => s.lon !== undefined);
  // dense Europe: pins move to a callout row over the Arctic, with leader lines to the true spot
  const inEurope = (s: Story) => s.lon! > -12 && s.lon! < 36 && s.lat! > 43 && s.lat! < 64;
  const eu = pinned.filter(inEurope).sort((a, b) => a.lon! - b.lon! || a.n - b.n);
  const rowY = my + 10, step = 11.5;
  const cx0 = P(12, 0)[0] - ((eu.length - 1) * step) / 2;
  const callout = new Map<number, [number, number]>();
  eu.forEach((s, i) => callout.set(s.n, [cx0 + i * step, rowY]));
  for (const s of eu) {
    const [px, py] = P(s.lon!, s.lat!), [qx, qy] = callout.get(s.n)!;
    cv.line([[qx, qy + 4], [px, py]], 0.6, mix(C.ink, C.paper, 0.35));
    cv.circle(px, py, 1.6, regionColor(s.region));
  }
  for (const s of pinned) {
    const [px, py] = callout.get(s.n) ?? P(s.lon!, s.lat!);
    const r = callout.has(s.n) ? 5.2 : s.n <= 3 ? 6.4 : s.n <= 13 ? 5.4 : 4.6;
    cv.circle(px, py, r + 1, C.paper);
    numDot(s.n, px, py, r, regionColor(s.region));
  }
  drawText(cv, T(sansK, 6.5, C.soft, 0.6), 'EUROPE', cx0 - 8, rowY + 2.5, 'r');
  drawText(cv, T(sans, 7.6, C.mute), 'Pins carry each story’s number; colour = region.', M, my + mh + 10);

  // also list
  const lx = M + mw + 18, lw = W - M - lx, colw = (lw - 16) / 2;
  drawText(cv, T(sansK, 9.2, C.ink, 1), `ALSO ON ${DAY.toUpperCase()} — ${BRIEFS.length} MORE`, lx, y + 10);
  const per = Math.ceil(BRIEFS.length / 2), lh = (mh + 6) / per;
  BRIEFS.forEach((s, i) => {
    const x = lx + (i >= per ? colw + 16 : 0), by = my + 10 + (i % per) * lh;
    const col = regionColor(s.region);
    drawText(cv, T(sansK, 9.2, col), String(s.n), x + 13, by, 'r');
    const pw = drawText(cv, T(sansK, 9.2, C.ink), s.place, x + 17, by);
    const src = ` (${s.src})`;
    // badge mark: a small square with the badge's initial, right-aligned in the column
    cv.rrect(x + colw - 9.5, by - 7.8, 9.5, 9.5, 1.5, BADGE[s.badge].c);
    drawText(cv, T(sansK, 6.8, C.paper), s.badge, x + colw - 4.75, by - 0.6, 'c');
    const srcSt = T(sans, 8, C.mute);
    const room = colw - 17 - pw - 4 - measure(srcSt, src) - 13;
    const ss = T(sans, 9.2, C.ink);
    const st = { ...ss, size: fitSize(ss, s.head, room, 9.2, 7.4) };
    if (measure(st, s.head) > room) { truncated++; process.stderr.write(`brief overflow: ${s.head}\n`); }
    drawText(cv, st, s.head, x + 17 + pw + 4, by);
    drawText(cv, srcSt, src, x + 17 + pw + 4 + measure(st, s.head), by);
  });
}

// ---------------------------------------------------------------- 8. date check, legend, corrections, footer
{
  let fy = footTop;
  const h = 42;
  cv.strokeRect(M, fy, W - 2 * M, h, 1.8, C.red);
  drawText(cv, T(sansK, 9.8, C.red, 0.8), 'DATE CHECK', M + 9, fy + 15);
  const x0 = M + 92;
  let ty = fy + 15;
  for (const [k, v] of [['Left out (other day): ', DATECHECK.left], ['Not yet (future): ', DATECHECK.future]] as [string, string][]) {
    const ks = T(sansK, 8.6, C.ink);
    const kw = drawText(cv, ks, k, x0, ty);
    const vs = T(sans, 8.6, C.ink);
    const room = W - M - 8 - x0 - kw;
    const fs = fitSize(vs, v, room * 2 - 40, 8.6, 7.2);
    lines({ ...vs, size: fs }, v, x0 + kw, ty, room, 2, 9.6);
    ty += wrap({ ...vs, size: fs }, v, room).length > 1 ? 19 : 11;
  }
  fy += h + 7;
  let x = M;
  drawText(cv, T(sansK, 7.8, C.ink, 0.6), 'HOW WE CHECKED', x, fy + 8);
  x += 82;
  for (const b of ['C', 'O', 'R'] as Badge[]) {
    x += badge(b, x, fy, 'l', 6.6) + 4;
    const d = b === 'C' ? '2+ major outlets' : b === 'O' ? 'on the record (officials, results)' : 'one major outlet';
    x += drawText(cv, T(sans, 8, C.soft), d, x, fy + 8.5) + 12;
  }
  drawText(cv, T(sans, 8, C.soft), CORRECTIONS, W - M, fy + 8.5, 'r');
  cv.hline(M, W - M, fy + 14, 0.8, C.rule);
  drawText(cv, T(sans, 7.8, C.mute), 'Every story here happened, or was first reported, on Saturday 21 November 2026 (UTC). Outlets named beside each story: Al Jazeera, Anadolu, AFP, AP, Reuters, Antara, Kyodo, RNZ, ABC, Dawn and official bodies.', M, fy + 24);
  drawText(cv, T(sans, 7.8, C.mute), 'Original drawings · DM Serif & Lato (OFL)', W - M, fy + 24, 'r');
}

if (truncated) process.stderr.write(`${truncated} text item(s) did not fit\n`);
writeFileSync(join(process.env.MAKEFUN_OUTPUT_DIR ?? '/output', 'entry.png'), cv.pngIndexed(128));
