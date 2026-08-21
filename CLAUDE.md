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

   **Entry videos** — every pose card shows "▶ 동영상 보기" and "상세 보기 →" buttons top-right (the card body itself is NOT clickable; only 상세 보기 opens the PoseDetail modal), with a "수련 마침" label + check button at the card's bottom-right. 동영상 보기 expands an inline `EntryVideo` player for `public/videos/poses/<한글이름>.mp4` (same naming convention as photos; autoplay muted, freezes on the final pose). If the file doesn't exist the player shows a "준비 중" notice via the video error event (the SPA fallback returns 200 HTML, which fails to decode) — adding a video needs no code change.

   **Videos** — `SURYA_A` entries carry a `vid` path into `public/videos/surya-a-NN.mp4` (12 AI-generated 6s transition clips, Higgsfield/minimax; NN=01..12 is the full-flow order, `SURYA_CLIPS` labels them). `PoseVisual` accepts a `video` prop (used by PracticeMode's big visual): plays the clip once, muted (set both as prop and via ref — React doesn't reliably write the `muted` attribute), no loop so it freezes on the held pose; falls back photo → SVG on error. The Surya section has a lazy full-flow player (loads nothing until opened) driven by `flowOn`/`flowClip` state in `AshtangaGuide`.

3. **i18n** — `STR` holds UI strings per language; `LANGS` is the dropdown list. Pose content exists fully in Korean (inline in the data) and English (`EN`, keyed by the pose's `sk` Sanskrit name); all other languages get English pose content via `loc()`/`lvMeta()`/`secMeta()`. Arabic switches the app to RTL. When adding a pose, add its `EN` entry too or non-Korean UIs will show Korean text.

   **URL language routing** — the first path segment selects the language (`/en/`, `/ko/`, …; country aliases like `/kr`→`ko` via `LANG_ALIASES`). `langFromPath()` wins over the localStorage `lang` on load; language changes call `syncLangPath()` (`history.replaceState`) and `syncSeoLinks()` (hreflang/canonical `<link>` tags + `<html lang>`). No router — Cloudflare Pages' automatic SPA fallback serves index.html for these paths, and `public/_redirects` 301s the country-code aliases server-side. Deep-linking anything beyond the language segment is not supported.

4. **Sequence data** — `SURYA_A` plus `LEVELS`: three levels (`primary`/`intermediate`/`advanced`) → `sections` → `poses`. A pose's completion key is `` `${section.id}-${pose.sk}` ``, so renaming a section id or `sk` orphans users' saved progress. `breath` values can be numbers or strings ("5×4", "10+", "5분+") parsed by `parseBreaths` for the practice timer. Sequence order follows the traditional teaching order — don't reorder poses for aesthetic reasons.

5. **Components** — `PoseSearch` (searches `ALL_POSES` with diacritic-insensitive `norm`), `PracticeMode` (auto-advancing breath timer), `PoseDetail` (modal with steps/mistakes/benefits), `InfoPage`/`PAGES` (about/privacy/terms/contact pages required for AdSense approval), `CookieBar`, and the root `AshtangaGuide` (scroll-spy nav via IntersectionObserver).

Persistence is localStorage only, via `lsGet`/`lsSet` (keys: `lang`, `tips`, `done`, `level`, `theme`), always wrapped in try/catch for private-mode Safari.

`vite.config.js` sets `base: "/"` and runtime asset paths (`/photos/…`, `/videos/…`) are absolute — required so assets resolve from language paths like `/en/`. Don't introduce relative asset URLs.

## 프로젝트 현황 (2026-08-21 기준)

이 섹션은 세션 간 이어달리기용 상태 기록이다. 작업이 진행되면 갱신할 것.

**완료된 것**
- 수리야 나마스카라 A: 전통 빈야사 카운트 11단계 카드 그리드(산스크리트 카운트·들숨/날숨 색 구분·범례), 전체 흐름 플레이어(12클립)에 오른쪽 단계별 설명 리스트(클릭 이동, 현재 단계 강조). 12클립 + 전 단계 실사 스틸 완비.
- 자세 콘텐츠: 76개 전 자세의 desc(ko)/d(EN)를 2~3문장 상세 설명으로 확장. 시퀀스 순서·드리쉬티·호흡 수 전통 기준 검증 완료.
- 레벨 탭: 비한국어 UI는 시리즈 명칭(Primary/初级序列/プライマリー 등). 한국어는 초보자/중급자/상급자 유지.
- URL 언어 라우팅(/en/, /ko/, 별칭 /kr 등) + hreflang/canonical. 헤더는 한 줄(로고·탭·검색·언어·테마).
- 카드 UI: 우측 상단 [동영상 보기 ▶][상세 보기 →](앰버 배경, 동영상 보기는 열림 토글), 본문 클릭으로는 모달 안 열림. 하단 행 = 도움말(제목 라인 정렬, 글자 폭) + 수련 마침 라벨/체크.
- 사진: 수리야 스틸 전체 + 웃티타 트리코나사나(AI 생성, 사마스티티 스틸 레퍼런스로 nano_banana_pro 2크레딧/장 — 파이프라인 검증됨). 인물 중심 정사각 크롭 적용.

**진행 중 / 다음 할 일**
- **자세 동영상(우선)**: 사용자가 클로드 데스크탑에서 직접 제작해 유튜브 병행 게시 예정. 스펙·76개 파일명 체크리스트는 `video-production-guide.md`. 받은 파일은 `public/videos/poses/<한글이름>.mp4`로 넣고 커밋·푸시만 하면 활성화. 사용자가 "받은 영상 사이트에 넣어줘"라고 하면 파일명 검증→배치→배포 처리.
- 남은 자세 사진: 스탠딩 10장 등 (동영상 마지막 프레임 추출로 대체 가능 — 아르다 우타나사나 때 브라우저 캔버스 추출 기법 검증됨).
- Higgsfield 계정: 트라이얼이 2026-08-23 종료 후 Plus 월간(월 1,000크레딧) 자동 전환. 7일 무제한 Kling 3.0은 연간 플랜 한정, 2026-08-24까지 구매분, "웹에서 사용" 조건.
- 파사사나.jpg는 일러스트라 실사 교체 대상.
