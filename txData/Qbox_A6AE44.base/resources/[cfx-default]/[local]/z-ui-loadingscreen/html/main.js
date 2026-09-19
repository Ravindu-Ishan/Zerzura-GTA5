// Zerzura loading screen.
//
// FiveM's loadscreen contract is NOT the usual NUI fetch/callback bridge every other resource in
// this repo uses (see lib/nui.ts in z-player-charcreation) - it's a plain `window.addEventListener
// ('message', ...)` where the engine itself posts events keyed by `data.eventName`. Verified
// against the real, working reference implementation shipped in this repo at
// resources/[standalone]/loadscreen/html/js/main.js rather than guessed from memory - that
// resource listens for `loadProgress` ({ loadFraction: 0..1 }) and `onLogLine` ({ message }),
// so this does too. Everything else that resource tracks (data files, init functions, a
// secondary bar) is left out on purpose - we only ever show one bar.

(function () {
  'use strict';

  var pctEl = document.getElementById('pct');
  var fillEl = document.getElementById('fill');
  var statusEl = document.getElementById('status');

  function setProgress(fraction) {
    var pct = Math.max(0, Math.min(100, Math.round(fraction * 100)));
    fillEl.style.width = pct + '%';
    pctEl.textContent = pct + '%';
    if (pct >= 100) {
      statusEl.textContent = 'Finishing up…';
    }
  }

  var handlers = {
    loadProgress: function (data) {
      setProgress(data.loadFraction || 0);
    },
    onLogLine: function (data) {
      // Real engine status text (e.g. "Loading server data") is useful but quite technical -
      // shown small and muted so it reads as a detail line, not the primary message.
      if (data.message) statusEl.textContent = data.message;
    },
  };

  window.addEventListener('message', function (event) {
    var data = event.data || {};
    var handler = handlers[data.eventName];
    if (handler) handler(data);
  });

  // window.invokeNative only exists inside the game's own CEF browser, never in a plain browser
  // tab - same detection method as lib/nui.ts elsewhere in this repo. Used here purely so this
  // page is still previewable/screenshottable outside the game, since a real loadProgress event
  // will never arrive in a plain browser.
  var isEnvBrowser = !window.invokeNative;
  if (isEnvBrowser) {
    var fake = 0;
    setInterval(function () {
      fake = (fake + 0.01) % 1;
      setProgress(fake);
    }, 80);
  }

  // ---------- Background audio ----------
  // No track ships with this resource - drop a licensed/royalty-free file in as
  // html/audio/theme.mp3 (or .ogg). Missing file / blocked autoplay both fail silently rather
  // than throwing, since a loading screen erroring over optional music would be worse than no
  // music at all.

  var audio = document.getElementById('bgAudio');
  var muteBtn = document.getElementById('muteBtn');
  var iconOn = document.getElementById('iconOn');
  var iconOff = document.getElementById('iconOff');

  audio.volume = 0.5;
  audio.play().catch(function () {
    /* autoplay blocked or no audio file present yet - not an error */
  });

  muteBtn.addEventListener('click', function () {
    audio.muted = !audio.muted;
    muteBtn.setAttribute('aria-pressed', String(audio.muted));
    iconOn.hidden = audio.muted;
    iconOff.hidden = !audio.muted;
  });
})();
