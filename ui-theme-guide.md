# ZERZURA NUI Theme Guide

The visual design system for **every custom NUI in this repo**. Read this before styling any
new screen.

Scope: this is a project-level guide, not a `z-player-charcreation` document. This repo's
convention is one Next.js `web/` folder per custom resource, named `z-[category]-[resource]`
(see [AGENT.md](AGENT.md) rule 5). Any new one — `z-job-mechanic`, `z-hud-status`,
`z-phone-banking` — should look like it came from the same studio as the others. Every example
below is cited from the current reference implementation:

```
txData/Qbox_A6AE44.base/resources/[cfx-default]/[local]/z-player-charcreation/web/
```

Vendored resources (`illenium-appearance`, `qbx_core`, anything under `[qbx]`/`[ox]`/`[npwd]`)
are out of scope — this governs UI we wrote.

---

## Why this exists

The first version of this NUI looked like an AI-generated admin dashboard pasted on top of GTA.
Rounded cards, big soft drop shadows, glassy gradients, `0.34em`-tracked labels, a white
floating pill for the active tab, one big bordered panel wrapping the whole screen. In a
browser it looked fine. In-game, sitting over a live Los Santos scene with the player's ped
standing next to it, it looked like a website someone had alt-tabbed into.

The phase-5 redesign fixed that, and this document is the record of what actually fixed it.
These are not arbitrary style preferences — each rule below is here because the opposite of it
was one of the tells that made the old screen read as "not part of the game." Section 6 is a
separate category again: those are platform constraints that **silently break in-game while
working perfectly in `next dev`**, so they cannot be caught by looking at the browser.

---

## 1. Design philosophy

**The mandate: it must read as a native Rockstar-style HUD, not as a web app overlaid on one.**

A player should not be able to tell that our menu is HTML. The test is simple — screenshot it
in-game next to the pause menu or the phone. If ours is the one that looks like a website,
it's wrong.

The concrete tells that signal "web app," all of which are banned:

| Tell | Why it reads as web | What we do instead |
|---|---|---|
| **Rounded corners** | Nothing in GTA's own HUD is rounded. `border-radius` is the single loudest signal. | Zero radius, enforced globally (§2.4). |
| **Drop shadows / glow** | Elevation and soft halos are Material Design language. A HUD is painted, not stacked. | Flat fills and 1px hairline borders. No `box-shadow` except the inset focus bar. |
| **Wide letter-spacing on headers** | Airy `0.2em`+ tracking on every label is editorial/branding typography. | Headers set almost solid: `.t-display` is `0.005em`. Only `.t-eyebrow` at 10.5px keeps real tracking, because it needs it to stay legible. |
| **An enclosing card/panel around a whole screen** | A bordered box containing everything reads as a modal dialog or a form on a background. | A gapped stack of separate flat blocks (§4). |
| **Gradients, glassy fills** | Plus it's outright broken on this platform (§6.1). | Single flat colour fills. |
| **Springy 250ms+ transitions** | Page-transition feel. HUD elements snap. | `160ms ease-out` / `110ms linear` (§5.7). |

Two further invariants inherited from this project's history, both load-bearing:

1. **Nothing may paint a full-screen fill.** The page is composited over the live game world
   and the player's ped has to stay visible beside it. `<html>`/`<body>` are `background:
   transparent`, and every screen constrains itself to a fixed-width column.
2. **Panel width is load-bearing.** `CreationFlow`'s `860px` is the widest footprint on any
   screen, and `Config.PreviewCamera.screenShift` (`0.42`) in the resource's
   `client/config.lua` is tuned against exactly that number so the 3D ped clears the UI on the
   right of a 1920-wide display. Narrower is always safe; wider means retuning the camera.
   Any new resource that renders a ped/vehicle preview alongside its UI inherits this
   relationship.

---

## 2. Color system

All tokens live in the `@theme` block of `globals.css`. This project uses **Tailwind v4's
CSS-native config** — there is no `tailwind.config.js` and there should not be one. Tokens
declared as `--color-*` in `@theme` automatically become utilities (`bg-panel`,
`text-accent`, `border-hairline`, …).

### 2.1 Surfaces

Blue-tinted charcoal, not black and not neutral grey. **The slight navy cast is what stops
this reading as a generic "dark mode website."** Ordered back to front:

```css
--color-ink:          #05070b;                    /* deepest well */
--color-panel:        #11151d;                    /* standard block surface */
--color-raised:       #1b2029;
--color-raised-2:     #232936;                    /* list rows / tiles */
--color-band:         #272c38;                    /* lightest chrome — header plates */
--color-panel-border: rgba(255, 255, 255, 0.09);  /* block edge */
--color-hairline:     rgba(255, 255, 255, 0.07);  /* internal divider */
```

Applied surfaces are near-opaque, not translucent: `.panel` is `rgba(17, 21, 29, 0.93)` and
`.band` is `rgba(39, 44, 56, 0.95)`. **`0.93` is the legibility floor against a bright daytime
scene** — do not go lower to "let the game show through."

### 2.2 Accent

**One** confident accent, used for exactly four things: primary actions, active/selected state,
highlighted numbers, and selection bars. Nothing else. A second accent colour is how a palette
starts looking designed-by-committee.

```css
--color-accent:      #2ee6c8;                   /* teal */
--color-accent-soft: rgba(46, 230, 200, 0.14);  /* selected-row wash */
--color-accent-ink:  #04241f;                   /* text ON accent fill */
```

Note `--color-accent-ink`: text on a teal button is near-black, never white. Hover on a primary
button lifts to `#5cf0d9`.

### 2.3 Severity

Buttons and tags are colour-coded by severity — straight off the reference's LEAVE / DELETE /
BEGIN row:

| Severity | Token / fill | Used for |
|---|---|---|
| **Neutral** (`ghost`) | `rgba(48, 54, 68, 0.88)` | Exits, cancels, back — the default variant |
| **Danger** | `--color-danger: #ee4036` | Destructive only |
| **Primary** | `--color-accent: #2ee6c8` | The one confirming action on a screen |

`#ee4036` is a saturated signal red — **a warning light, not a pastel web-error pink**. It
replaced `#ff5566` for exactly that reason. Hover goes to `#ff5346`.

Exactly one `primary` button per screen. If two things look equally important, one of them
isn't.

### 2.4 Text

```css
--color-fg:    #eef1f5;
--color-muted: rgba(238, 241, 245, 0.58);
--color-faint: rgba(238, 241, 245, 0.32);
```

In markup, body copy commonly uses the Tailwind opacity forms — `text-white/45` for secondary
lines, `text-white/30` for hints, `text-white/25` for the faintest captions.

### 2.5 The radius reset

At the very bottom of `globals.css`, **deliberately unlayered** so it outranks every Tailwind
utility including any stray `rounded-*` someone pastes in:

```css
*,
*::before,
*::after {
  border-radius: 0;
}
```

That single property is most of what separates "in-game HUD" from "web app," so it's enforced
in CSS rather than trusted to code review. Note `*` does not match browser pseudo-elements, so
the range thumb/track and the scrollbar parts set `border-radius: 0` explicitly themselves.

**Copy this reset into every new resource's `globals.css`.**

---

## 3. Typography

### 3.1 The pairing

Two fonts, both from the **Barlow superfamily** — this matters:

| Role | Font | Weights | Used for |
|---|---|---|---|
| Display | **Barlow Condensed** | 400/500/600/700 | All headers, labels, buttons, tabs, nav rows, chips |
| Body | **Barlow** | 400/500/600/700 | Values, names, body copy, hints |

Barlow Condensed is the true condensed cut of Barlow, so these are **one type family at two
widths, not two unrelated Google fonts bolted together** — they share skeleton, terminals and
metrics, which is why the UI reads as designed rather than assembled.

Barlow Condensed replaced Oswald, which was too tall/narrow and too "editorial" — its long
ascenders and open apertures read as a magazine headline face. Barlow Condensed at 600/700 is
squarer and more mechanical, much closer to the heavy condensed caps GTA uses in its own HUD,
and being narrower than Oswald at the same size it only ever gives labels *more* room.

### 3.2 Loading — a hard requirement, not a preference

Fonts are loaded with **`next/font/google`**, in `src/app/layout.tsx`:

```tsx
import { Barlow_Condensed, Barlow } from "next/font/google";

const display = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display-face",
  display: "swap",
});

const sans = Barlow({ /* …same shape… */ variable: "--font-sans-face" });

// <html className={`h-full ${display.variable} ${sans.variable}`}>
```

`next/font/google` resolves these at **build time** and emits real `.woff2` files into the
static export (`out/_next/static/media/*.woff2`), referenced from the bundled CSS by a plain
relative `url(../media/…)`. The shipped page never touches the network at runtime.

**This is not a style choice.** A NUI running in-game has no live network guarantee. A runtime
`<link href="fonts.googleapis.com">` works perfectly in `next dev` and then silently falls back
to a system font in-game — and you may not notice until a player screenshots it. Same rule for
icons: no hosted icon fonts (§5.6). See §6.2.

### 3.3 The `@theme` indirection

`next/font` injects `--font-display-face` / `--font-sans-face` onto `<html>`. The Tailwind
tokens are named **differently on purpose** so the two never fight over the same custom
property:

```css
--font-display: var(--font-display-face), "Barlow Condensed", "Arial Narrow", system-ui, sans-serif;
--font-sans:    var(--font-sans-face), "Barlow", system-ui, sans-serif;
```

### 3.4 Type scale

Three reusable classes in `@layer components`. Tracking is deliberately tight — airy tracking
on every label was the single biggest "designed by a web app" tell in the old pass.

```css
.t-display {                      /* every header, from 14px slabs to the 36px screen title */
  font-family: var(--font-display);
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 0.005em;        /* essentially solid */
  line-height: 1;
}

.t-eyebrow {                      /* tiny section kickers; the ONE place tracking is real */
  font-family: var(--font-display);
  text-transform: uppercase;
  font-weight: 600;
  font-size: 10.5px;
  letter-spacing: 0.16em;
  color: var(--color-faint);
}

.t-label {                        /* field labels, slider labels */
  font-family: var(--font-display);
  text-transform: uppercase;
  font-weight: 600;
  font-size: 12px;
  letter-spacing: 0.05em;
  color: var(--color-muted);
}

.t-num { font-variant-numeric: tabular-nums; }   /* ids, counters, slider readouts */
```

`.t-display` carries no size — the call site sets it. Sizes actually in use:

| Context | Size |
|---|---|
| Screen title (`SelectScreen` header plate) | `36px` |
| Screen title (`CreationFlow` header plate) | `28px` |
| Wordmark (`ScreenFrame`) | `24px`, `tracking-[0.12em]` (the one tracked display item — it's a logotype) |
| Pane title (`TabLayout`) | `20px` |
| Row title (character name) | `20px` |
| Inline tile title | `14px` |
| Body / values | `12.5px`–`14px` (Barlow, not condensed) |
| Hints, captions | `10.5px`–`11.5px` |

`<body>` sets `font-feature-settings: "tnum" 1` globally, so numbers align in columns without
per-element work. `.t-num` is for places that need it stated explicitly (ids, counters).

---

## 4. Layout pattern: a gapped stack of flat blocks

**The single most important structural rule in this system.**

### 4.1 The rule

A screen is **a vertical stack of separate flat blocks with real gaps between them and nothing
wrapping the lot** — a header plate, then content blocks, then an action row. It is *not* one
bordered panel containing regions.

### 4.2 Why

The old `CreationFlow` wrapped the entire character creator in one `.panel`. That enclosure is
precisely what made it read as **a form with a background** / a modal pasted over the game.
An outer border tells the eye "this is a document, and everything inside it is one object,
separate from the world behind it." Discrete blocks instead read as **a set of stamped HUD
plates** laid onto the scene — the same way the game's own HUD elements sit independently in
the corners of the screen rather than inside a shared frame.

The history, readable in the source: **`SelectScreen` was always built this way**; **`CreationFlow`
was rebuilt to match it**, and `globals.css` / both components carry comments saying so. If you
need a model for a new screen, `SelectScreen` is the canonical one.

Consequences of removing the enclosure, all deliberate:

- The old 232px right-hand detail aside is gone — its content (citizen id, gender) moved into
  each row's own subtitle line. Nothing lost, and the panel narrowed from 716px to **520px**.
- The initials-avatar tile is gone. The 3D ped preview beside the UI is a far better picture of
  the character than a coloured circle with letters in it.
- `.well` (a translucent recessed rail) was deleted outright. It only worked *inside* an
  enclosure, where it had a solid surface to be recessed into. With no enclosure, a 0.3-alpha
  black rail sitting straight on the game world is unreadable — so the nav rail became a real
  `.panel` block like everything else.

**The standard gap is `gap-2.5` (10px)**, used both for the vertical stack and for
`TabLayout`'s two columns, so the whole screen shares one rhythm.

### 4.3 The three building blocks

```css
.panel {                                    /* ONE standalone flat block. A block, NOT an enclosure. */
  position: relative;
  border: 1px solid var(--color-panel-border);
  background: rgba(17, 21, 29, 0.93);
}

.band {                                     /* lighter navy chrome — header plates, action bars */
  background: rgba(39, 44, 56, 0.95);
}

.band-underline {                           /* the short lighter strip under a header plate */
  height: 5px;
  background: rgba(255, 255, 255, 0.16);
}
```

`.band-underline` is **not a border** — it's its own separate bar, which is exactly what makes a
header read as a stamped HUD plate rather than an `<h1>` with a rule under it. Always pair
`.band` with it:

```tsx
<div className="shrink-0">
  <div className="band px-6 py-5">
    <h1 className="t-display text-[36px] leading-none text-white">Select Character</h1>
  </div>
  <div className="band-underline" />
</div>
```

### 4.4 `ScreenFrame` — the outer furniture

`components/ui/ScreenFrame.tsx`. The persistent chrome that sits *around* a screen's blocks:
wordmark top-left, status chips top-right, camera/control hints bottom-left. Reuse it rather
than re-implementing a header.

```tsx
interface ScreenFrameProps {
  chips?: ReactNode;      // top-right status chips
  hints?: Hint[];         // bottom-left control legend: { icon, label, keys }
  children: ReactNode;
}
```

It lays out `justify-between` over `h-full` with `p-6 xl:p-9`, and **paints no fill of its
own** — everything in it is text, a small chip, or the screen's own blocks. Children are
`items-stretch`, so a screen wanting full height just says `h-full` (`CreationFlow`), and a
short screen opts out with `self-center` (`SelectScreen`).

The children slot is left-aligned and **nothing in it may grow to fill the frame**, or the ped
preview ends up behind the UI.

### 4.5 `TabLayout` — the two-pane working area

`components/ui/TabLayout.tsx`. A left category rail plus a right detail pane, for any screen
with more controls than fit in one list. Every slider-heavy tab uses it, so the eye always
lands in the same two places — pick a group on the left, tune it on the right — instead of
scrolling one undifferentiated list of 20+ sliders.

```tsx
<TabLayout
  nav={<SectionNav header="Feature Groups" items={GROUPS} active={group} onSelect={setGroup} />}
  title="Identity"
  description="This is the paperwork — the name on your licence…"
  action={/* right-aligned counters or per-group actions */}
  sticky={/* rendered under the header, OUTSIDE the scroll area — search fields */}
>
  {/* scrolling content */}
</TabLayout>
```

Crucially, **the rail and the pane are two separate flat blocks with a real gap**, each carrying
its own `.panel` surface and padding — not two regions carved out of one enclosing panel:

```tsx
<div className="grid min-h-0 flex-1 gap-2.5"
     style={{ gridTemplateColumns: nav ? "204px minmax(0,1fr)" : "minmax(0,1fr)" }}>
```

The rail is `204px`; `nav` is optional and the grid collapses to a single column without it
(`DetailsTab` uses it that way). `SectionNav` is exported from the same file and renders
`.navrow` buttons with an optional `badge` counter or `dot` ("changed from default").

---

## 5. Component patterns

All shared primitives live in `web/src/components/ui/`. Component classes are defined inside
`@layer components` **on purpose**: Tailwind v4 declares `@layer theme, base, components,
utilities`, and unlayered CSS outranks every layered rule — leaving them bare would make
`.field` beat `pl-9` and `.t-display` beat `tracking-[…]`. Inside the layer, utilities can
still override them inline, which is what every call site assumes.

### 5.1 Buttons

`ui/Button.tsx` — three severity variants, two sizes, optional leading/trailing icon.

```tsx
type Variant = "primary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;      // default "ghost"
  size?: "md" | "sm";     // default "md"
  icon?: IconName;        // leading
  iconAfter?: IconName;   // trailing
}
```

```tsx
<Button variant="ghost"   icon="power" onClick={quit}>Leave</Button>
<Button variant="danger"  icon="trash" onClick={confirm}>Delete</Button>
<Button variant="primary" icon="play"  disabled={busy} className="min-w-[160px]">Begin</Button>
```

`.btn` is solid, hard-edged and colour-coded: `height: 40px`, `padding: 0 20px`, `border: 0`,
display font at `700`/`14px`/`0.055em`. **No borders, no radius, no shadow — the fill is the
whole button.** `.btn-sm` is `30px`/`0 12px`/`12px`. Disabled is `opacity: 0.35`.

Icons auto-size with the button (`15px` at `md`, `13px` at `sm`) — don't pass sized icons as
children.

**Action-row pattern** (both reference screens): neutral on the left, destructive next to it,
a spacer, then the single primary hard against the right edge. The buttons sit straight on the
game world with no bar behind them — they're solid self-contained blocks already. Only a
status/error line needs a surface, because a 12px sentence over a bright scene is unreadable,
so it gets a height-matched `.panel`:

```tsx
<div className="flex shrink-0 items-center gap-2.5">
  <p className="panel flex h-10 min-w-0 flex-1 items-center px-4 text-[12.5px] text-white/45">…</p>
  <Button variant="ghost" icon="x" onClick={cancel}>Cancel</Button>
  <Button variant="primary" icon="check" disabled={!ok} className="min-w-[200px]">Create Character</Button>
</div>
```

The error state of that line adds `border-l-[3px] border-danger` and `text-danger` — a leading
severity bar, which is this system's general "this block is an alert" device.

### 5.2 Tabs

Was: rounded pills with a floating white active fill. Now: flat segments with an accent
underline, which is how in-game menus mark a section.

```css
.tab { height: 38px; padding: 0 16px; border-bottom: 2px solid transparent;
       font-family: var(--font-display); text-transform: uppercase;
       font-weight: 600; font-size: 13.5px; letter-spacing: 0.045em;
       color: rgba(255, 255, 255, 0.45); }
.tab[data-active="true"] { background: rgba(46, 230, 200, 0.1);
                           border-bottom-color: var(--color-accent);
                           color: var(--color-accent); }
```

Active state is driven by a **`data-active` attribute, not a conditional class string** — that's
the convention across `.tab`, `.card` and `.navrow`. Keep it.

```tsx
<div className="panel scroll-thin flex shrink-0 items-center overflow-x-auto px-3">
  {TABS.map((t) => (
    <button key={t.id} className="tab" data-active={tab === t.id} onClick={() => setTab(t.id)}>
      <Icon name={t.icon} size={14} />
      {t.label}
      {needsAttention(t) && <span className="ml-0.5 h-[5px] w-[5px] shrink-0 bg-danger" />}
    </button>
  ))}
</div>
```

The tab strip is **its own block**, not a rule drawn inside an enclosure.

### 5.3 Selectable rows and nav rows

`.card` — list rows and selectable tiles. Selection is a **hard 3px accent bar on the leading
edge plus a flat accent wash**: no glow, no border-colour change, no lift.

```css
.card { border-left: 3px solid transparent; background: rgba(35, 41, 54, 0.86);
        transition: background 110ms linear, border-color 110ms linear; }
.card:hover { background: rgba(51, 59, 76, 0.9); }
.card[data-active="true"] { border-left-color: var(--color-accent);
                            background: rgba(46, 230, 200, 0.14); }
```

`.navrow` is the same idea for a `SectionNav` rail — full width, `9px 11px`, `13px` display
font, same 3px leading accent bar when active.

Status markers are **flat 5px squares, never glowing dots**: `<span className="h-[5px]
w-[5px] shrink-0 bg-accent" />`.

### 5.4 Chips

Small status tags for `ScreenFrame`'s top-right slot. `27px` tall, 1px border, display font at
`11.5px`/`0.06em`, near-opaque fill.

```tsx
<span className="chip"><Icon name="user" size={13} />Roster</span>
<span className={`chip ${canCreate ? "chip-accent" : ""}`}>
  <span className="t-num">{pad(count)} / {pad(max)}</span> Slots
</span>
```

`.chip-accent` is the "good/active" variant: accent text, `rgba(46,230,200,0.4)` border,
`0.14` accent fill.

### 5.5 Form fields

```css
.field { width: 100%; height: 40px; padding: 0 12px;
         border: 1px solid var(--color-panel-border);
         background: rgba(0, 0, 0, 0.35); color: var(--color-fg); font-size: 14px;
         outline: none; }
.field:focus { border-color: rgba(46, 230, 200, 0.45); background: rgba(0, 0, 0, 0.5);
               box-shadow: inset 0 -2px 0 0 var(--color-accent); }
```

Focus is a **hard 2px accent bar along the bottom edge**, `inset` so it doesn't change the
element's box — replacing the old soft glow ring. This is the only `box-shadow` in the system.

The label pattern (from `DetailsTab`'s local `Field`) is a `.t-label` with a `4px` danger square
when the field is empty-but-required:

```tsx
<label className="block">
  <span className="t-label mb-1.5 flex items-center gap-1.5">
    {label}
    {!filled && <span className="h-[4px] w-[4px] shrink-0 bg-danger" />}
  </span>
  <input className="field" placeholder="Jane" maxLength={32} value={v} onChange={…} />
  {hint && <span className="mt-1 block text-[11px] text-white/25">{hint}</span>}
</label>
```

Two CEF-specific field fixes worth carrying forward:

- `select.field` draws its chevron from an **inline `data:` SVG URI** — no runtime asset fetch.
  `select.field option` needs an explicit `background: #11151d`, or CEF renders the dropdown
  list white-on-white.
- `input[type="date"].field::-webkit-calendar-picker-indicator` needs `filter: invert(1)` —
  CEF renders the native glyph almost black on our dark field.
- `<body>` carries `select-none` so dragging a slider never paints a text selection across the
  panel, so `input, textarea` get `user-select: text` back explicitly in `@layer base` or text
  entry becomes unselectable in CEF.

### 5.6 Sliders

`components/Slider.tsx` + the `.range` class. A **square notch thumb on a square track** — a
round thumb with a soft halo was pure Material Design and read as web UI at a glance.

The filled portion is painted without a wrapper element: the component sets a `--fill`
custom property inline and the track is a hard-stop gradient against it.

```tsx
const fill = span > 0 ? ((value - min) / span) * 100 : 0;

<input type="range" className="range" min={min} max={max} step={step} value={value}
       onChange={(e) => onChange(parseFloat(e.target.value))}
       style={{ "--fill": `${fill}%` } as React.CSSProperties} />
```

```css
.range::-webkit-slider-runnable-track {
  height: 6px; border-radius: 0;
  background: linear-gradient(to right,
    var(--color-accent) 0%, var(--color-accent) var(--fill, 0%),
    rgba(255,255,255,.12) var(--fill, 0%), rgba(255,255,255,.12) 100%);
}
.range::-webkit-slider-thumb { width: 5px; height: 18px; margin-top: -6px;
                               border-radius: 0; background: #ffffff; }
.range:hover::-webkit-slider-thumb { width: 7px; background: var(--color-accent); }
```

The readout above the track uses `.t-num` + display font at `14px`/bold, and turns accent-
coloured only when the value has been **touched** (moved off its neutral) — so at a glance you
can see what you've actually changed. `neutral` is a separate prop rather than assumed to equal
`min`, because bipolar sliders run `-1..1` with neutral at `0`.

Only `-webkit-` pseudo-elements are styled. That's fine and intentional: CEF is Chromium.

### 5.7 Icons

`ui/Icon.tsx` is a **hand-rolled stroke icon set**, deliberately not an icon package. This
bundle is loaded off disk by the game's CEF browser, so every dependency is weight shipped for
no reason — and inline paths can never turn into a runtime network request the way a hosted
icon font would (§6.2).

All icons are on a 24×24 grid, stroke-only, `currentColor`, default `strokeWidth={1.8}`.

```tsx
<Icon name="alert" size={17} className="shrink-0 text-danger" />
```

Adding an icon means adding a path to the `PATHS` record; `IconName` is derived from its keys,
so it stays type-safe. **Do not add `lucide-react` or similar to a NUI resource.**

### 5.8 Motion and scrollbars

Short and linear-ish. The old 260ms spring-eased rise felt like a web page transition; HUD
elements snap in.

```css
.anim-rise { animation: zx-rise 160ms ease-out both; }   /* opacity + 6px translateY */
.anim-fade { animation: zx-fade 140ms linear both; }
@media (prefers-reduced-motion: reduce) { .anim-rise, .anim-fade { animation: none; } }
```

Component transitions are uniformly `110ms linear`. `.anim-rise` goes on the screen's block
stack; `.anim-fade` on things that swap in place (chips, tab bodies, inline alerts).

`.scroll-thin` — 6px, `rgba(255,255,255,0.18)` thumb going accent on hover. Put it on every
scrollable region; the default CEF scrollbar is a chunky light-grey web scrollbar.

---

## 6. Hard platform constraints (FiveM NUI)

**These are not style preferences.** Every one of them works fine in `next dev` and silently
breaks or renders wrong once the page is running as NUI in-game. You cannot catch these in a
browser.

### 6.1 Never use `backdrop-filter` / blur

FiveM's NUI runs in an **off-screen-rendered CEF layer with no real pixels behind it to
sample**. A backdrop blur has nothing to blur, so it renders **solid black** instead of frosted
glass. This is not a subtle degradation — it's an opaque black rectangle over your UI.

Fake "glass" with a **near-opaque solid fill or gradient** instead. That's what every surface
here does: `.panel` at `0.93` alpha, `.band` at `0.95`, `.chip` at `0.9`. Separation from a
bright game scene comes from the panel's own fill, and it looks better anyway.

> **Note for future edits to `globals.css`:** Tailwind v4's candidate scanner reads the
> stylesheet itself, so writing that effect's four-letter CSS function name as a bare word
> anywhere in the file — *even inside a comment* — makes the build emit a dead filter utility
> rule into the shipped CSS. Spell it out as two words in comments, as the existing file does.

### 6.2 Fonts and assets must resolve at build time

There is **no live network** once the page is running as NUI. Anything fetched at runtime from
a CDN silently fails and falls back — invisibly in dev, visibly in-game.

- Fonts: `next/font/google` only (§3.2). Never a `<link href="fonts.googleapis.com">`.
- Icons: inline SVG paths (§5.7). Never a hosted icon font.
- Small decorative assets: inline `data:` URIs, as `select.field`'s chevron does.
- `next.config.ts` sets `images: { unoptimized: true }` — there's no image optimizer at
  runtime.

### 6.3 Static export, Client Components only

`next.config.ts`:

```ts
const nextConfig: NextConfig = {
  output: "export",
  // NUI is loaded from a local file, not a real domain - relative asset paths are required.
  assetPrefix: "./",
  images: { unoptimized: true },
};
```

There is no live server at NUI runtime, so: **no server actions, no API routes, no ISR, no
server-side data fetching, no middleware.** Every component in the tree is `"use client"`. All
data comes from Lua over the NUI bridge (§6.4).

`assetPrefix: "./"` is required because the page is loaded off disk via the resource's
`ui_page`, not from a domain root — absolute `/_next/…` paths resolve to nothing.

One build gotcha specific to this setup, at the top of `globals.css`:

```css
@source not "../../out";
```

Tailwind v4 auto-detects source files by walking the project and skipping whatever
`.gitignore` excludes — but `out/` is the resource's **tracked, deployed artifact**, so it is
not ignored and gets scanned. That makes the build feed on its own output: a class emitted by
one build is found as a candidate by the next and re-emitted forever, even after the markup
using it is gone. Any new resource that tracks its `out/` needs this line.

### 6.4 Detecting real game CEF vs. browser dev mode

`window.invokeNative` **only exists inside the game's CEF browser**, never in a normal browser.
Its *absence* is the dev-mode check. From `lib/nui.ts`:

```ts
export function isEnvBrowser(): boolean {
  return !(window as unknown as { invokeNative?: unknown }).invokeNative;
}
```

`fetchNui` uses it to return mock data in `next dev` instead of issuing a real `fetch()` that
would just hang:

```ts
export async function fetchNui<T = unknown>(eventName: string, data: object = {}, mockData?: T): Promise<T> {
  if (isEnvBrowser()) {
    if (mockData !== undefined) return mockData;
    console.log(`[nui mock] ${eventName}`, data);
    return {} as T;
  }
  const response = await fetch(`https://${resourceName()}/${eventName}`, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=UTF-8" },
    body: JSON.stringify(data),
  });
  return response.json() as Promise<T>;
}
```

The resource name comes from `window.GetParentResourceName?.()` with the resource's own name as
the fallback — **change that fallback string when copying `nui.ts` into a new resource.**

Inbound messages use `useNuiEvent(action, handler)`, a hook over `window.addEventListener
("message", …)` filtered on `event.data.action`, matching Lua's `SendNUIMessage`.

Copy `lib/nui.ts` wholesale into any new NUI resource. It is the standard FiveM pattern and
there is no reason to write a second version of it.

---

## Checklist for a new `z-*` NUI resource

- [ ] Copy `globals.css` (tokens, `@layer components`, the unlayered radius reset, `@source not
      "../../out"`), `lib/nui.ts` (update the fallback resource name), and `components/ui/`.
- [ ] `next.config.ts`: `output: "export"`, `assetPrefix: "./"`, `images.unoptimized`.
- [ ] Fonts via `next/font/google` in `layout.tsx`; `<body>` transparent.
- [ ] Compose the screen as a **gapped stack of flat blocks** (`gap-2.5`) inside `ScreenFrame`
      — no single wrapper `.panel`.
- [ ] Header = `.band` plate + `.band-underline`.
- [ ] Action row: neutral left, destructive next, spacer, **one** primary right.
- [ ] Active state via `data-active`, not conditional class strings.
- [ ] No rounded corners, no shadows, no blur, no gradients, no wide-tracked headers.
- [ ] If the screen sits beside a 3D preview, keep it narrow and check the camera's
      `screenShift`.
- [ ] Screenshot it **in-game**, not in `next dev`, before calling it done.
