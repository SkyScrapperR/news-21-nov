// Front page of Saturday 21 November 2026 — type sample stage.
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Canvas, Font, hex, drawText } from './gfx.ts';

const F = (n: string) => new Font(new URL('./fonts/' + n, import.meta.url));
const disp = F('DMSerifDisplay-Regular.ttf'), text = F('DMSerifText-Regular.ttf');
const sans = F('Lato-Regular.ttf'), sansB = F('Lato-Bold.ttf'), sansK = F('Lato-Black.ttf');
const ink = hex('#1b1a17'), paper = hex('#f6f1e4'), red = hex('#b3261e');

const cv = new Canvas(1024, 1024, paper);
drawText(cv, { font: disp, size: 92, color: ink }, 'Saturday 21 November 2026', 512, 100, 'c');
drawText(cv, { font: text, size: 26, color: ink }, 'Climate summit agrees deal after overnight talks', 20, 160);
drawText(cv, { font: text, size: 18, color: ink }, 'Quake shakes Peru · Kyiv under fire · Junín, Türkiye', 20, 195);
let y = 230;
for (const s of [16, 13, 12, 11, 10, 9]) {
  drawText(cv, { font: sans, size: s, color: ink }, `Lato ${s}px: The deep quake near Carhuamayo was felt in Lima and along the coast (AFP, Reuters).`, 20, y);
  y += s + 8;
}
for (const s of [14, 12, 11, 10]) {
  drawText(cv, { font: sansB, size: s, color: red, track: 0.6 }, `ANTALYA · CLIMATE · ${s}px bold tracked`, 20, y);
  y += s + 8;
}
drawText(cv, { font: sansK, size: 30, color: red }, '$58,983  6.7  146  Day 13', 20, y + 30);
writeFileSync(join(process.env.MAKEFUN_OUTPUT_DIR ?? '/output', 'entry.png'), cv.png());
