# Archimatrix — animated website

Static site built from the Figma design "Archimatrix" (node `341:19761`). No build step.

```
archimatrix/
├── index.html
├── assets/css/main.css      # layout (Figma px → fluid --px unit), responsive rules, Figma Motion keyframes
├── assets/js/main.js        # all motion & interaction
├── assets/vendor/           # GSAP 3.13 (+ScrollTrigger, SplitText) and Lenis, self-hosted
├── assets/svg/              # vector assets exported from Figma
├── assets/img/              # raster images (fetch with the script below)
└── scripts/fetch-figma-assets.mjs
```

## Images

All images in `assets/img/` are rendered straight from the Figma file at design size (1×),
with the same crops as the design. To re-export the photos at 1.5–2× for extra sharpness on
retina screens (Node 18+):

```bash
FIGMA_TOKEN=figd_your_token node scripts/fetch-figma-assets.mjs
```

Token: Figma → Settings → Security → Personal access tokens (File content: read-only).

## Run locally

```bash
npx serve .        # or: python3 -m http.server
```

## Motion overview

| Section | Animation |
|---|---|
| Preloader | ARCHIMATRIX wordmark letters rise, real image-load counter, curtain wipe |
| Header | Rolling-text nav, rotating brass “+”, hides on scroll down, blurs after hero |
| Hero | Auto slideshow (clip-path wipe, Ken Burns, line-masked titles, progress bars, swipe), scroll parallax |
| The Studio | Image clip reveals + parallax, “The Studio” char rise, statement lights up word-by-word on scroll, line draws |
| Projects | Full-screen stacked panels — each pins while the next slides over it |
| Sketch → Reality | Exact Figma Motion 12s loop (keyframes from Figma), cursor lens reveals the built photo; tap/click shows it all |
| CloudTree | Discipline words slide in from opposite sides, scrubbed to scroll |
| Our Expertise | Animated accordion (height, image clip, +/– morph), drifting ornament |
| Contact | Layered parallax (sky vs. tower cutout), magnetic CTA, spinning dots |
| Footer | Curtain reveal, wordmark letters rise, magnetic back-to-top |

Also: Lenis smooth scroll, custom blend-mode cursor with “View/Reveal” labels, full mobile menu,
and `prefers-reduced-motion` support (smooth scroll and motion switched off).
