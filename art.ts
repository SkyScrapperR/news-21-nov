// art.ts — the hand-coded illustrations (stub stage).
import { Canvas, hex } from './gfx.ts';
import type { Story } from './news.ts';
type Art = (cv: Canvas, x: number, y: number, w: number, h: number, s: Story) => void;
const blank: Art = (cv, x, y, w, h) => { cv.vgrad(x, y, w, h, hex('#d8e2e6'), hex('#b9c9cf')); };
export const ART: Record<string, Art> = { blank };
export const TILE_ART: Record<string, Art> = { blank };
