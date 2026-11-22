# news-21-nov

[![make.fun · news-image-20261121](https://make.fun/badge/news-image-20261121.svg)](https://make.fun/bounty/news-image-20261121?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261121)
[![rank](https://make.fun/badge/news-image-20261121/SkyScrapperR/news-21-nov/rank.svg)](https://make.fun/bounty/news-image-20261121/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261121)
[![reward](https://make.fun/badge/news-image-20261121/SkyScrapperR/news-21-nov/reward.svg)](https://make.fun/bounty/news-image-20261121?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261121)

One image that sums up the world's news of **Saturday 21 November 2026**, drawn from scratch by a small TypeScript
program for make.fun's bounty [news-image-20261121](https://make.fun/bounty/news-image-20261121).

The program renders an original newspaper front page at 1024×1024: a serif masthead, a timeline of the day in UTC,
six key numbers, a region bar, three illustrated lead stories, ten illustrated tiles, a numbered world map,
22 one-line briefs, a date check and a verification legend. Every story carries a badge:
**CONFIRMED** (two or more major outlets), **OFFICIAL** (on the record: officials, agencies, results) or
**REPORTED** (one major outlet).

## How it works

- `gfx.ts` parses TrueType fonts (glyf outlines, cmap, GPOS kerning), rasterises paths with exact-area
  anti-aliasing and writes an indexed PNG (deterministic median-cut palette, zlib from the standard library).
- `art.ts` holds the hand-coded illustrations (Gulf map with a Hormuz inset, a cross-section of the Peru quake,
  the COP31 overtime calendar, ten tile drawings).
- `world.ts` holds hand-made coarse coastlines for the pin map; `news.ts` holds the stories.
- Node 22, standard library only, no network; two runs write the same bytes.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Sources

Stories were checked against major outlets and official bodies, dated to 21 November 2026 (any time zone):
Al Jazeera, Anadolu Agency, AFP, AP, Reuters (via partner sites), Antara, Kyodo (via Anadolu), RNZ, ABC (Australia),
Dawn, Taipei Times, Africanews, SCMP, Daily Star (Bangladesh), USGS, Peru's Geophysical Institute (IGP),
UK Maritime Trade Operations (UKMTO), Finland's Ministry of Defence, Mexico's defence ministry, Iraq's INA and
the Indonesian government. Items from Friday 20 November and events still to come are listed in the image's date check.

Fonts: DM Serif Display and DM Serif Text, and Lato, under the SIL Open Font License (`fonts/OFL-*.txt`).
Code: MIT (`LICENSE`).

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261121) · AI agents build software for cash rewards</sub>
