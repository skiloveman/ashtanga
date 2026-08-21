# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```
npm run dev       # Vite dev server
npm run build     # production build to dist/
npm run preview   # serve the built dist/
```

No tests, linter, or TypeScript. Verify changes by loading the page (the browser-automation skill works well here; note that `page.evaluate` runs in an isolated world and cannot see the app's window globals — assert via the DOM).

## Deployment

Cloudflare Pages at ashtanga-shala.pages.dev. Every push to `main` auto-deploys — only push when the work is ready to go live.

## Architecture

Single-page Ashtanga yoga guide (Korean-first, multilingual). React 18 + Vite, **no router, no state library, no CSS files** — the entire app lives in one file, `src/ashtanga-guide.jsx` (~1700 lines), mounted by `src/main.jsx`. The file is organized top-to-bottom in this order; comments in the file are in Korean.

1. **Theming** — `THEMES` (dark/light palettes) and the mutable module-level object `C`. `applyTheme(t)` mutates `C` in place with `Object.assign`; components read colors from `C` at render time, so a theme change only takes effect because `setTheme` triggers a re-render. Never destructure/capture `C` values at module scope. Theme, and everything else styled, uses inline `style` props plus one `<style>` block inside `AshtangaGuide` (class names like `.navbtn`, `.card`, `.lvl`; mobile breakpoint at 760px).

2. **Pose visuals** — `F` is a dictionary of outlined-cartoon SVG figures in a compact element format (`{p, f}` = filled path with color key from `FIG_C`, `{c: [cx,cy,r], f}` = filled circle, `o: 0` = no outline, `{l|p, k, w}` = stroke-only line/path), rendered by `Fig` in a 100×100 viewBox with a ground line at y=90. `PoseVisual` auto-derives each pose's photo path by convention — `poseImg()` takes the Korean name (the part of `ko` before `" · "`, or SURYA_A's `name`) and looks for `public/photos/<한글이름>.jpg` (e.g. `사마스티티.jpg`, `마리챠사나 A·B.jpg`) — and falls back to the SVG figure when the file is missing or fails to load. There is no `photo`/`photoBy` field in the data; to add a photo, just drop a correctly named .jpg into `public/photos/`. PracticeMode builds its own pose objects, so it passes `photo: poseImg(...)` explicitly from the Korean source name (its `ko` is localized and must not be used for the filename).

   **Entry videos** — every pose card shows "▶ 자세잡기" and "상세 보기 →" buttons top-right (the card body itself is NOT clickable; only 상세 보기 opens the PoseDetail modal). 자세잡기 expands an inline `EntryVideo` player for `public/videos/poses/<한글이름>.mp4` (same naming convention as photos; autoplay muted, freezes on the final pose). If the file doesn't exist the player shows a "준비 중" notice via the video error event (the SPA fallback returns 200 HTML, which fails to decode) — adding a video needs no code change.

   **Videos** — `SURYA_A` entries carry a `vid` path into `public/videos/surya-a-NN.mp4` (12 AI-generated 6s transition clips, Higgsfield/minimax; NN=01..12 is the full-flow order, `SURYA_CLIPS` labels them). `PoseVisual` accepts a `video` prop (used by PracticeMode's big visual): plays the clip once, muted (set both as prop and via ref — React doesn't reliably write the `muted` attribute), no loop so it freezes on the held pose; falls back photo → SVG on error. The Surya section has a lazy full-flow player (loads nothing until opened) driven by `flowOn`/`flowClip` state in `AshtangaGuide`.

3. **i18n** — `STR` holds UI strings per language; `LANGS` is the dropdown list. Pose content exists fully in Korean (inline in the data) and English (`EN`, keyed by the pose's `sk` Sanskrit name); all other languages get English pose content via `loc()`/`lvMeta()`/`secMeta()`. Arabic switches the app to RTL. When adding a pose, add its `EN` entry too or non-Korean UIs will show Korean text.

   **URL language routing** — the first path segment selects the language (`/en/`, `/ko/`, …; country aliases like `/kr`→`ko` via `LANG_ALIASES`). `langFromPath()` wins over the localStorage `lang` on load; language changes call `syncLangPath()` (`history.replaceState`) and `syncSeoLinks()` (hreflang/canonical `<link>` tags + `<html lang>`). No router — Cloudflare Pages' automatic SPA fallback serves index.html for these paths, and `public/_redirects` 301s the country-code aliases server-side. Deep-linking anything beyond the language segment is not supported.

4. **Sequence data** — `SURYA_A` plus `LEVELS`: three levels (`primary`/`intermediate`/`advanced`) → `sections` → `poses`. A pose's completion key is `` `${section.id}-${pose.sk}` ``, so renaming a section id or `sk` orphans users' saved progress. `breath` values can be numbers or strings ("5×4", "10+", "5분+") parsed by `parseBreaths` for the practice timer. Sequence order follows the traditional teaching order — don't reorder poses for aesthetic reasons.

5. **Components** — `PoseSearch` (searches `ALL_POSES` with diacritic-insensitive `norm`), `PracticeMode` (auto-advancing breath timer), `PoseDetail` (modal with steps/mistakes/benefits), `InfoPage`/`PAGES` (about/privacy/terms/contact pages required for AdSense approval), `CookieBar`, and the root `AshtangaGuide` (scroll-spy nav via IntersectionObserver).

Persistence is localStorage only, via `lsGet`/`lsSet` (keys: `lang`, `tips`, `done`, `level`, `theme`), always wrapped in try/catch for private-mode Safari.

`vite.config.js` sets `base: "/"` and runtime asset paths (`/photos/…`, `/videos/…`) are absolute — required so assets resolve from language paths like `/en/`. Don't introduce relative asset URLs.
