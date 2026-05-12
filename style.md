# Style Guide — Inspired by Jasper.ai

Extracted from https://www.jasper.ai/ via Playwright on 2026-05-12.

---

## Typography

### Font Families

| Role | Font Stack |
|---|---|
| **Body / UI** | `"Inter", "ABC ROM", Arial, sans-serif` |
| **Headings / Display** | `"Playfair Display", "Feature", Georgia, sans-serif` |
| **Monospace (editor)** | `"Fira Code", "Cascadia Code", Consolas, monospace` |

> Jasper uses proprietary fonts "ABC ROM" (body) and "Feature" (headings). We substitute with **Inter** and **Playfair Display** which carry the same design intent — clean sans for UI, editorial serif for headings.

### Font Weights

| Token | Value |
|---|---|
| `--font-regular` | 450 |
| `--font-medium` | 500 |
| `--font-thin` (serif) | 400 |

### Font Sizes

| Token | Value |
|---|---|
| `--text-tiny` | 0.75rem |
| `--text-small` | 0.875rem |
| `--text-main` | 1rem |
| `--text-large` | 1.125rem |
| `--h6` | 1rem |
| `--h5` | 1.25rem |
| `--h4` | 1.5rem |
| `--h3` | 1.75rem |
| `--h2` | 2.375rem |
| `--h1` | clamp(2.375rem, ~1.99rem + 1.54vw, 3.375rem) |
| `--display` | clamp(2.5rem, ~1.53rem + 3.86vw, 5rem) |

### Line Heights

| Token | Value |
|---|---|
| `--leading-tight` | 1 |
| `--leading-snug` | 1.05 |
| `--leading-normal` | 1.1 |
| `--leading-relaxed` | 1.4 |

### Letter Spacing

| Token | Value |
|---|---|
| `--tracking-tight` | -0.03em |
| `--tracking-normal` | -0.01em |
| `--tracking-loose` | 0em |

---

## Color Palette

### Brand Colors

| Name | Hex | Usage |
|---|---|---|
| **Navy** | `#00063d` | Primary text, dark backgrounds, borders |
| **Flame** | `#fa4028` | Primary CTA buttons, links, accent |
| **Flame Hover** | `#801a10` | Button hover state |
| **Flame Light** | `#fffdfc` | Flame text hover, very light tint |
| **Flame Pale** | `#fff7f5` | Subtle flame-tinted background |

### Light Surface Colors

| Name | Hex | Usage |
|---|---|---|
| **White** | `#ffffff` | Primary background |
| **Surface 50** | `#f9f9f9` | Subtle cards |
| **Surface 100** | `#f2f2f3` | Secondary background, nav hover |
| **Surface 150** | `#ededed` | Dividers |
| **Surface 200** | `#e0e0e1` | Borders |
| **Surface 300** | `#cfcfd0` | Disabled borders |

### Dark Surface Colors (for editor chrome)

| Name | Hex | Usage |
|---|---|---|
| **Dark 900** | `#262627` | Dark sections, footer |
| **Dark 800** | `#515052` | — |
| **Dark 700** | `#5e5d5f` | — |
| **Dark 600** | `#7d7d7e` | — |
| **Dark 500** | `#9b9b9b` | Muted text |

### Accent / Semantic Colors

| Name | Hex | Usage |
|---|---|---|
| **Blue 800** | `#00063d` | Same as Navy |
| **Blue 700** | `#0011a7` | Secondary button bg/hover |
| **Blue 600** | `#0043d3` | — |
| **Blue 500** | `#0095ff` | Info |
| **Blue 400** | `#81cbff` | Light info |
| **Blue 300** | `#ceebff` | Info tint |
| **Green 600** | `#45ff00` | Success bright |
| **Green 800** | `#103a00` | Success dark text |
| **Yellow 500** | `#fffbb7` | Warning bg |
| **Violet 600** | `#7c5ac4` | — |
| **Pink 600** | `#ff80c8` | — |

---

## Buttons

### Primary (Flame CTA)

```
background: #fa4028
color: white
border: 1px solid #fa4028
border-radius: 100vw  (pill shape)
font-weight: 450
padding: 0.75rem 1.5rem

hover:
  background: #801a10
  border-color: #801a10
  color: #fffdfc
```

### Secondary (Outlined Navy)

```
background: transparent
color: #00063d
border: 1px solid #00063d
border-radius: 100vw

hover:
  background: #00063d
  color: white
```

### Tertiary (Filled Navy)

```
background: #00063d
color: white
border: 1px solid #00063d
border-radius: 100vw

hover:
  background: #0011a7
  border-color: #0011a7
```

---

## Border Radius

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | 0.5rem | Small elements, chips |
| `--radius-md` | 1rem | Cards, panels |
| `--radius-pill` | 100vw | Buttons, badges |

---

## Spacing (Section-level)

| Token | Value |
|---|---|
| `--space-xs` | 0.5rem |
| `--space-sm` | 0.75rem |
| `--space-md` | 1rem |
| `--space-lg` | 1.5rem |
| `--space-xl` | 2rem |
| `--space-2xl` | 3rem |
| `--space-3xl` | 4rem |
| `--section-sm` | clamp(3rem, ~2.14rem + 4.29vw, 6rem) |
| `--section-md` | clamp(4rem, ~3.14rem + 4.29vw, 7rem) |
| `--section-lg` | clamp(7rem, ~5.79rem + 6.07vw, 11.25rem) |

---

## Layout

- Max site width: `90rem` (1440px)
- Grid: 12 columns
- Gutter: `clamp(1rem, ~0.42rem + 2.31vw, 2.5rem)`
- Container max: `min(90rem, 100vw) - gutter * 2`

---

## Selection

```
background: #fa4028
color: white
```

---

## Application to CodeCraft

Since CodeCraft is a dark-mode code editor, we adapt Jasper's palette to dark surfaces:

| Role | Value |
|---|---|
| **App bg** | `#00050f` (near-navy-black) |
| **Surface 1** | `#0a0a1a` (panel backgrounds) |
| **Surface 2** | `#12121e` (nested surfaces) |
| **Surface 3** | `#1a1a2e` (hover state) |
| **Border** | `rgba(255,255,255,0.06)` |
| **Text primary** | `#ffffff` |
| **Text secondary** | `#9b9b9b` (Dark 500) |
| **Text muted** | `#5e5d5f` (Dark 700) |
| **Accent (CTA)** | `#fa4028` (Flame) |
| **Accent hover** | `#801a10` (Flame 700) |
| **Link** | `#fa4028` |
| **Success** | `#45ff00` |
| **Error** | `#fa4028` / `#fa7560` |
| **Info** | `#0095ff` |

---

## Fonts to Load (Google Fonts)

Add to `layout.tsx`:

```
Inter: weights 400, 450, 500, 600
Playfair Display: weights 400, 500
Fira Code: weights 400, 500 (for code editor)
```

URL: `https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:wght@400;500&family=Fira+Code:wght@400;500&display=swap`
