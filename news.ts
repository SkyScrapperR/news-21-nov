// news.ts — the stories of Saturday 21 November 2026 (layout stub; replaced by the researched set).
export type Badge = 'C' | 'O' | 'R';
export type Story = {
  n: number; place: string; region: string; cat: string; head: string; sum: string; src: string; badge: Badge;
  lon?: number; lat?: number; art: string; label: string; fact: string; sub: string; utc?: string; data?: number[];
};
export const DAY = 'Saturday 21 November 2026';
export const REGIONS = [
  { k: 'EU', name: 'Europe', c: '#1f5fa8' },
  { k: 'ME', name: 'Middle East', c: '#c4501b' },
  { k: 'AF', name: 'Africa', c: '#1d8a5a' },
  { k: 'SA', name: 'South Asia', c: '#b07a00' },
  { k: 'EA', name: 'East Asia', c: '#a8457f' },
  { k: 'SEA', name: 'SE Asia', c: '#2a87b8' },
  { k: 'AM', name: 'Americas', c: '#6a3d9a' },
  { k: 'OC', name: 'Oceania', c: '#2e8b7a' },
  { k: 'GL', name: 'Global', c: '#57534a' },
];
const S = (n: number, region: string, lon: number, lat: number): Story => ({
  n, place: 'Placeville', region, cat: 'Politics', head: 'A placeholder headline that runs to two lines here', sum: 'A one-line summary of what happened on the day, in plain words.',
  src: 'Reuters, AP', badge: (['C', 'O', 'R'] as Badge[])[n % 3], lon, lat, art: 'blank', label: 'LABEL', fact: 'Fact chip', sub: 'Lead story',
});
export const HEROES = [S(1, 'EU', 10, 50), S(2, 'ME', 45, 30), S(3, 'AM', -75, -10)];
export const TILES = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((n, i) => S(n, REGIONS[i % 9].k, -120 + i * 30, 40 - i * 8));
export const BRIEFS = Array.from({ length: 22 }, (_, i) => ({ ...S(14 + i, REGIONS[i % 9].k, -100 + i * 12, 50 - i * 4), head: 'Short one-line brief of the event' }));
export const NUMBERS = Array.from({ length: 6 }, (_, i) => ({ v: ['6.7', '146', '$59k', '13', '3', '124*'][i], cap: 'caption of the number on two lines here', region: REGIONS[i].k }));
export const TIMELINE = Array.from({ length: 7 }, (_, i) => ({ t: `${String(i * 3 + 1).padStart(2, '0')}:15`, label: 'Event', sub: 'what happened', region: REGIONS[i].k }));
export const DATECHECK = { left: 'Items dated Friday 20 November are left out.', future: 'Items expected on Sunday 22 November are not shown.' };
export const CORRECTIONS = 'Corrections: none so far.';
