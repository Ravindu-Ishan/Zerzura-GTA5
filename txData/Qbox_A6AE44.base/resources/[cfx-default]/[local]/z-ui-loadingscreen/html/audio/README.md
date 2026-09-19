# Background music

Drop a licensed or royalty-free track here, named exactly:

- `theme.mp3`, and/or
- `theme.ogg` (used as a fallback if the browser can't play mp3 - CEF can, so this is optional)

`index.html`'s `<audio>` element already points at both. No code changes needed once the file
exists - `main.js` calls `.play()` on load and fails silently if nothing's here yet.

**Do not add a copyrighted commercial track** (a game soundtrack, a song you don't hold the
rights to, etc.) - this repo is public, so anything committed here gets redistributed under
this repo's own visibility. Use something you composed yourself, or a properly
royalty-free/Creative-Commons-licensed piece.
