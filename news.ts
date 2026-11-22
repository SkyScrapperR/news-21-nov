// news.ts — the stories of Saturday 21 November 2026 (UTC), in my own words, with their outlets, a verification badge
// (C = confirmed by 2+ outlets, O = on the record from an official body or result, R = one major outlet) and map
// coordinates. Researched 21–22 Nov 2026 from Al Jazeera, Anadolu, AFP, AP, Reuters, Antara, Kyodo, RNZ, ABC,
// Dawn, Taipei Times, Africanews, Daily Star, USGS and official statements. Items whose event fell on Friday 20
// November (UTC) or whose date could not be pinned down were dropped (see DATECHECK).
export type Badge = 'C' | 'O' | 'R';
export type Story = {
  n: number; place: string; region: string; cat: string; head: string; sum: string; src: string; badge: Badge;
  lon?: number; lat?: number; art: string; label?: string; fact?: string; sub?: string;
};
export const DAY = 'Saturday 21 November 2026';
// colour-blind-aware categorical palette (hues also separated by lightness)
export const REGIONS = [
  { k: 'EU', name: 'Europe', c: '#1f5fa8' },
  { k: 'ME', name: 'Middle East', c: '#c4501b' },
  { k: 'AF', name: 'Africa', c: '#1d7f52' },
  { k: 'SA', name: 'South Asia', c: '#a87400' },
  { k: 'EA', name: 'East Asia', c: '#a8457f' },
  { k: 'SEA', name: 'SE Asia', c: '#2a87b8' },
  { k: 'AM', name: 'Americas', c: '#6a3d9a' },
  { k: 'OC', name: 'Oceania', c: '#2e8b7a' },
  { k: 'GL', name: 'Global', c: '#57534a' },
];

export const HEROES: Story[] = [
  {
    n: 1, place: 'Bahrain · Hormuz', region: 'ME', cat: 'Iran war', art: 'gulf', badge: 'C',
    label: 'GULF: IRAN STRIKES', fact: '2 air bases · 2 tankers hit', sub: 'Iran hits Bahrain bases',
    head: 'Iran strikes Bahrain bases; tankers hit off Oman',
    sum: 'IRGC says it hit US radar at two bases; Bahrain says a civilian plant burned. UKMTO: two tankers struck off Khasab.',
    src: 'Al Jazeera · Anadolu · Reuters · UKMTO', lon: 50.55, lat: 26.05,
  },
  {
    n: 2, place: 'Junín, Peru', region: 'AM', cat: 'Earthquake', art: 'quake', badge: 'C',
    label: 'PERU: QUAKE 6.7', fact: '00:09 UTC · deep · no deaths', sub: 'a deep quake shakes Peru',
    head: 'Deep 6.7 earthquake shakes central Peru',
    sum: 'Centred near Ondores and felt in Lima; landslides and minor damage, no deaths and no tsunami threat.',
    src: 'USGS · IGP · AFP · Anadolu', lon: -76.3, lat: -11.0,
  },
  {
    n: 3, place: 'Antalya, Türkiye', region: 'GL', cat: 'Climate', art: 'cop', badge: 'C',
    label: 'COP31: OVERTIME', fact: 'Day 13 of a 12-day summit', sub: 'COP31 runs into overtime',
    head: 'COP31 climate talks run into overtime',
    sum: 'Talks in Antalya ran through Saturday over fossil fuels and finance; approval session set for Sunday 06:00 GMT.',
    src: 'Reuters · AFP · Anadolu', lon: 30.7, lat: 36.9,
  },
];

export const TILES: Story[] = [
  { n: 4, place: 'Gulf of Finland', region: 'EU', cat: 'Security', art: 'ship', badge: 'C', lon: 26.8, lat: 60.0,
    head: 'Drones hit Russian ship off Finland', sum: 'Crew evacuated; Finland suspects Ukraine.', src: 'Finnish MoD · Reuters · Anadolu' },
  { n: 5, place: 'Geneva', region: 'GL', cat: 'Arms control', art: 'robot', badge: 'C', lon: 6.1, lat: 46.2,
    head: '128 nations back killer-robot talks', sum: 'US, Russia, Israel opposed binding rules.', src: 'AFP · Anadolu · Al Jazeera' },
  { n: 6, place: 'Sinaloa, Mexico', region: 'AM', cat: 'Crime', art: 'wanted', badge: 'C', lon: -108.5, lat: 25.6,
    head: 'Mexico captures cartel boss Chapo Isidro', sum: 'FBI most-wanted; seized in Guasave.', src: 'AP · Al Jazeera · Mexican defence ministry' },
  { n: 7, place: 'Indonesia–EU', region: 'SEA', cat: 'Trade', art: 'trade', badge: 'O', lon: 106.8, lat: -6.2,
    head: 'Indonesia and EU sign trade pact', sum: 'Signed in Brussels; in force from 2027.', src: 'Antara · Indonesian government' },
  { n: 8, place: 'Basra, Iraq', region: 'ME', cat: 'Disaster', art: 'plant', badge: 'C', lon: 47.8, lat: 30.5,
    head: 'Basra power-station fire kills 4', sum: '800 MW Hartha plant shut; 35 injured.', src: 'INA · Anadolu · Al Jazeera' },
  { n: 9, place: 'Taipei', region: 'EA', cat: 'Markets', art: 'chart', badge: 'O', lon: 121.5, lat: 25.0,
    head: 'Taiwan curbs short-selling after rout', sum: 'FSC acts after worst week since 1991.', src: 'Financial Supervisory Commission · Taipei Times' },
  { n: 10, place: 'London', region: 'EU', cat: 'Rugby', art: 'rugby', badge: 'O', lon: -0.3, lat: 51.5,
    head: 'England beat All Blacks 37-12', sum: 'New Zealand’s heaviest loss to England.', src: 'RNZ · match result' },
  { n: 11, place: 'Abuja', region: 'AF', cat: 'Football', art: 'ballot', badge: 'O', lon: 7.5, lat: 9.1,
    head: 'All 54 CAF members back Infantino', sum: 'FIFA vote set for March 2027 in Rabat.', src: 'CAF assembly · AFP' },
  { n: 12, place: 'Mastung, Pakistan', region: 'SA', cat: 'Security', art: 'peaks', badge: 'O', lon: 66.8, lat: 29.8,
    head: 'Pakistan says 15 militants killed', sum: 'Balochistan raid; hideouts destroyed.', src: 'Pakistani state media · Dawn' },
  { n: 13, place: 'Las Vegas', region: 'AM', cat: 'Formula 1', art: 'f1', badge: 'O', lon: -115.2, lat: 36.2,
    head: 'Verstappen takes pole in Las Vegas', sum: 'Antonelli docked 5 places; Russell 2nd.', src: 'AP · Al Jazeera · F1 timing' },
];

export const BRIEFS: Story[] = [
  { n: 14, place: 'Gaza City', region: 'ME', head: 'Drone strike on food-aid van kills three', src: 'AJ, Reuters', badge: 'C', lon: 34.45, lat: 31.5 },
  { n: 15, place: 'Hormuz', region: 'ME', head: 'IRGC says it downed a US MQ-9; no US comment', src: 'AJ, Reuters', badge: 'R', lon: 56.3, lat: 26.6 },
  { n: 16, place: 'Tehran', region: 'ME', head: 'Iran recalls 168 killed in US strike on a school', src: 'Anadolu', badge: 'R', lon: 51.4, lat: 35.7 },
  { n: 17, place: 'Paris', region: 'EU', head: '82,500 march on living costs; Lisbon too', src: 'AJ, ministry', badge: 'O', lon: 2.35, lat: 48.85 },
  { n: 18, place: 'Zagreb', region: 'EU', head: 'Thousands protest over hospital death', src: 'AJ', badge: 'R', lon: 16.0, lat: 45.8 },
  { n: 19, place: 'Pas-de-Calais', region: 'EU', head: 'Floods swamp 850 homes; 85 roads shut', src: 'Anadolu', badge: 'O', lon: 2.3, lat: 50.6 },
  { n: 20, place: 'Newcastle', region: 'EU', head: 'Arsenal held 2-2; Chelsea lose 4-1 to Leeds', src: 'AJ', badge: 'O', lon: -1.6, lat: 55.0 },
  { n: 21, place: 'Dublin', region: 'EU', head: 'Ireland edge South Africa 20-17', src: 'RNZ', badge: 'O', lon: -6.3, lat: 53.3 },
  { n: 22, place: 'Cardiff', region: 'OC', head: 'Wallabies end losing run, beat Wales 29-26', src: 'ABC', badge: 'O', lon: -3.2, lat: 51.5 },
  { n: 23, place: 'Washington', region: 'AM', head: 'Trump appears to confirm FBI database breach', src: 'AJ, NBC', badge: 'R', lon: -77.0, lat: 38.9 },
  { n: 24, place: 'Cleveland', region: 'AM', head: 'Harden passes Bryant on NBA 50-point list', src: 'AP, AJ', badge: 'O', lon: -81.7, lat: 41.5 },
  { n: 25, place: 'Melbourne', region: 'OC', head: 'Cricket Australia backs Cummins as captain', src: 'AFP', badge: 'O', lon: 145.0, lat: -37.8 },
  { n: 26, place: 'Melbourne', region: 'OC', head: 'Australia beat England by 3 wickets in T20', src: 'AJ', badge: 'O', lon: 147.5, lat: -35.0 },
  { n: 27, place: 'Doha', region: 'AF', head: 'Cameroon lose U17 World Cup opener 2-1', src: 'Africanews', badge: 'O', lon: 51.5, lat: 25.3 },
  { n: 28, place: 'Blue Nile', region: 'AF', head: 'Sudan army says it is restoring security', src: 'Anadolu', badge: 'R', lon: 34.4, lat: 11.8 },
  { n: 29, place: 'S. Ethiopia', region: 'AF', head: 'About 700,000 displaced by conflict', src: 'Africanews', badge: 'R', lon: 38.0, lat: 6.0 },
  { n: 30, place: 'Dhaka', region: 'SA', head: 'Five more deaths with measles symptoms', src: 'Daily Star', badge: 'R', lon: 90.4, lat: 23.8 },
  { n: 31, place: 'New Delhi', region: 'SA', head: 'Congress vows more protests against Meta', src: 'Dawn', badge: 'R', lon: 77.2, lat: 28.6 },
  { n: 32, place: 'SCO forum', region: 'SA', head: 'Pakistan minister calls climate an enemy', src: 'Dawn', badge: 'R', lon: 78.8, lat: 26.8 },
  { n: 33, place: 'Lahore', region: 'SA', head: 'Pakistan drop Rizwan, Masood from contracts', src: 'AJ', badge: 'O', lon: 74.3, lat: 31.5 },
  { n: 34, place: 'Fukushima', region: 'EA', head: 'Snow strands ~1,500; 700 homes lose power', src: 'Kyodo', badge: 'R', lon: 140.0, lat: 37.6 },
  { n: 35, place: 'Bali', region: 'SEA', head: 'Russian Interpol fugitive refused entry', src: 'Antara', badge: 'O', lon: 115.2, lat: -8.7 },
].map((b) => ({ ...b, cat: '', sum: '', art: '', badge: b.badge as Badge }));

export const NUMBERS = [
  { v: '6.7', cap: 'Peru quake magnitude (USGS)', region: 'AM' },
  { v: '2', cap: 'tankers hit off Khasab (UKMTO)', region: 'ME' },
  { v: '128', cap: 'nations backing Geneva robot-arms talks', region: 'GL' },
  { v: '90.4%', cap: 'tariff lines duty-free (IEU-CEPA)', region: 'SEA' },
  { v: '82,500', cap: 'marchers in France (ministry)', region: 'EU' },
  { v: '37–12', cap: 'England over New Zealand', region: 'EU' },
];

// UTC times as stated by outlets or schedules; '≈' marks a report time, not an event time.
export const TIMELINE = [
  { t: '00:09', h: 0.15, label: 'Peru quake', sub: 'M6.7, Junín (USGS)', region: 'AM' },
  { t: '02:15', h: 2.25, label: 'Finland', sub: 'restricts Gulf airspace', region: 'EU' },
  { t: '04:00', h: 4.0, label: 'Las Vegas', sub: 'qualifying: Verstappen P1', region: 'AM' },
  { t: '05:00', h: 5.0, label: 'Tanker hit', sub: '11 nm N of Khasab', region: 'ME' },
  { t: '05:50', h: 5.83, label: '2nd tanker', sub: '17 nm E (UKMTO)', region: 'ME' },
  { t: '≈15:30', h: 15.5, label: 'Antara', sub: 'reports EU pact signed', region: 'SEA' },
  { t: '17:30', h: 17.5, label: 'Newcastle', sub: 'v Arsenal kicks off: 2-2', region: 'EU' },
];

export const DATECHECK = {
  left: 'Kyiv bridge barrage and missiles in Poland, the Kryvyi Rih strike, Kane’s injury, the Tocumwal lightning, Denmark’s expulsion of a Russian attaché, the EU–UK summit, the Riemann proof claim, Manipur’s alcohol toll and the TAIEX’s 6% fall were all Friday 20 November (UTC).',
  future: 'COP31 approval session (Sun 06:00 GMT), Las Vegas GP race (Sun 04:00 UTC), Liverpool v Man United (Sun). Unconfirmed when drawn, so not shown: the Copa Sudamericana final score.',
};
export const CORRECTIONS = 'Corrections: none. Peru quake depth differs by agency: USGS 108 km, IGP 129 km.';
