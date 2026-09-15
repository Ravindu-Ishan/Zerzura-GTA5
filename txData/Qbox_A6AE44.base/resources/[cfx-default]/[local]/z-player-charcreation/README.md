# z-player-charcreation

Fully custom character select + creation flow, replacing qbx_core's built-in one
(`useExternalCharacters = true` in `qbx_core/config/client.lua`). Talks to qbx_core's
server callbacks directly (`getCharacters`/`createCharacter`/`loadCharacter`/`deleteCharacter`)
- nothing in qbx_core itself is modified.

## Status: phase 4 of 4 complete

- [x] Phase 1: character list/create/delete wired to real `qbx_core` callbacks, spawns into the world
- [x] Phase 2: Details tab + Face & Body + Face Adjustments sliders, live native preview, save into illenium-appearance's schema
- [x] Phase 3: Hair & Eyes, Overlays, and Tattoos tabs
- [x] Phase 4: visual polish pass (dark-glass panels, condensed type, teal accent)

All customization tabs apply live via illenium-appearance's own exported setters
(`setPedHeadBlend`, `setPedFaceFeatures`, `setPedHair`, `setPedHeadOverlays`, `setPedEyeColor`,
`setPedTattoos`) rather than raw natives - guaranteed schema-consistent with its own editor.
Final submit reads the finished look back via its exported `getPedAppearance` and saves it
through `illenium-appearance:server:saveAppearance`, so future logins and barbershop/tattoo
shop visits keep working normally.

**Note:** `client/tattoos.lua` is a static copy of illenium-appearance's `shared/tattoos.lua`
(869 entries) - no export exists to *read* that catalog cross-resource (only `setPedTattoos` to
*apply* it), so this needs manual re-syncing if illenium-appearance ever updates its tattoo pack.

## Design system (phase 4)

Theme tokens and every component class live in `web/src/app/globals.css`, inside
`@layer components` so Tailwind utilities can still override them inline. One accent
(`--color-accent`, teal `#2ee6c8`) carries primary actions, active/selected state and
highlighted numbers; everything else is neutral dark glass.

Type is Oswald (condensed display) + Barlow (UI), loaded through `next/font/google` in
`web/src/app/layout.tsx`. That resolves at **build** time and emits real `.woff2` files
into `web/out/_next/static/media/`, referenced by a relative `url(../media/...)` - so the
shipped page never hits the network. Never swap this for a `fonts.googleapis.com` `<link>`:
the game client has no internet guarantee and it would silently fall back to a system font.

The page is composited over the live game world, so `html`/`body` stay transparent and
nothing paints a full-screen fill - the panels' own large soft drop shadow is what keeps the
UI readable against a bright scene.

Shared UI lives in `web/src/components/ui/` (`Icon`, `Button`, `ScreenFrame`, `TabLayout` +
`SectionNav`). Every slider-heavy creation tab uses `TabLayout`'s left category rail so no
tab is ever one long undifferentiated list of sliders.

**Known gap:** the bottom-left camera legend in `CreationFlow.tsx` (`CAMERA_HINTS`) advertises
orbit/zoom/focus controls that `client/main.lua`'s `setupPreviewCam` does not implement yet -
it creates one static camera with no input handling. Either wire those controls up or set
`SHOW_CAMERA_HINTS = false`.

## Dev workflow

The Next.js project lives in `web/` as a normal app - only its **built, static-exported**
output (`web/out/`) is what the game actually loads (see `ui_page` in `fxmanifest.lua`).

```bash
cd web
npm run dev     # hot-reload in a real browser - see web/src/lib/nui.ts for the mock/bridge split
npm run build   # static export to web/out/, restart the resource in-game to test for real
```

`web/node_modules` and `web/.next` are gitignored at the repo root already; `web/out` is
tracked (it's the deployed artifact, same pattern as illenium-appearance's own `web/dist`).
