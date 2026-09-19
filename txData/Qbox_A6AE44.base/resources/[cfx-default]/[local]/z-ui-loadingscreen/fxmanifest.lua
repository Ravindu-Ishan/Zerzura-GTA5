fx_version 'cerulean'
game 'gta5'

author 'Zerzura'
description 'Zerzura custom loading screen - plain HTML/CSS/JS, no framework needed for a single static page'
version '1.0.0'

-- Plain files, not a Next.js build: this screen has no interactivity complex enough to need
-- React, and FiveM's loadscreen contract (window 'message' events, not the usual NUI fetch
-- bridge) is different from every other NUI in this repo anyway. See ui-theme-guide.md for the
-- design tokens this hand-writes instead of inheriting from a shared globals.css.
files {
    'html/**',
}

loadscreen 'html/index.html'

-- We never auto-hide: z-player-charcreation's own boot sequence calls ShutdownLoadingScreen()/
-- ShutdownLoadingScreenNui() once its preview ped is actually standing (see that resource's
-- client/main.lua). Without this, FiveM would tear the loading screen down the instant scripts
-- finish starting, well before the character screen is ready to be looked at.
loadscreen_manual_shutdown 'yes'

-- Needed for the mute toggle to be clickable.
loadscreen_cursor 'yes'
