# AGENT.md

Guidance for AI coding assistants (Claude, or any other tool) working in this repository. If you're a human dev, this is also a useful map. See [README.md](README.md) for full human-facing setup instructions — this file focuses on rules and conventions an agent should follow while making changes.

## What this repo is

A FiveM/CFX GTA5 roleplay server built on the [Qbox Project](https://github.com/Qbox-project) framework, deployed via txAdmin. See README.md for the full directory layout. The short version:

- `server/` — CFX server artifact (binaries, gitignored, never edit)
- `txData/Qbox_A6AE44.base/resources/` — all resource code, including third-party framework resources (`[qbx]`, `[ox]`, `[npwd]`, `[standalone]`, etc.) and our own custom resources under `[cfx-default]/[local]/`
- `txData/Qbox_A6AE44.base/secrets.cfg` — license key + DB connection string (gitignored, never commit, never print/log its contents)
- `database/backups/` — DB dumps (gitignored)
- `database/sql_scripts/` — schema for **our own** custom resources only (tracked in git)

## Hard rules for this repo

1. **Never commit or display the contents of `secrets.cfg`, `admins.json`, or anything under `database/backups/`.** These are gitignored on purpose. If you need the DB connection string to run a command, read the file yourself rather than echoing it into chat/output.
2. **Never touch `server/`** — it's a downloaded binary artifact, not source.
3. **Before any database schema or data change** (an `ALTER`, a manual `UPDATE`/`DELETE`, running a new script against a live DB), take a fresh backup first:
   ```bash
   "/d/Programs/MariaDB 12.3/bin/mariadb-dump.exe" -u root -p<password> --databases ZERZURA_GTA5_QBOX --routines --triggers --events --single-transaction --result-file="database/backups/ZERZURA_GTA5_QBOX_$(date +%Y-%m-%d_%H%M%S).sql"
   ```
   Do this automatically, without waiting to be asked.
4. **Never add framework/core schema files to `database/sql_scripts/`.** That folder is only for tables belonging to resources we wrote ourselves. Core Qbox/ox/npwd schema is the framework's responsibility, created by the official txAdmin recipe deploy — don't duplicate it, don't document it as something a dev must manually import.
5. **New custom Lua resources go in `resources/[cfx-default]/[local]/`**, each with its own `fxmanifest.lua`. Custom UI (NUI) lives inside the resource that owns it (a `web/` or `html/` subfolder + `ui_page` in that resource's manifest) — don't centralize UI in one place.
6. **Addon vehicles** need two things: the vehicle files (stream/meta) in their own resource, *and* a matching entry in `resources/[qbx]/qbx_core/shared/vehicles.lua` so Qbox's shops/garages/HUD recognize it.
7. **When genuinely uncertain** about a Qbox/ox/npwd API, convar, event, or export — don't guess. Check the resource's own README/fxmanifest first, then consult official docs (docs.qbox.re, coxdocs.dev for ox_lib, the resource's GitHub repo) before proposing code that touches these frameworks.

## Qbox Developer's Guide

These rules come directly from Qbox's own documentation and apply to any code written against `qbx_core` in this repo (custom resources especially). Follow them for anything you write or suggest here:

### Do not access database tables owned by core
Reading or writing `qbx_core`/`qbx_vehicles`-owned tables directly (bypassing their exports) will break if the schema changes in a future update. If the data you need isn't exposed through an export, that's a gap in the framework, not something to work around by reaching into the database — file a GitHub issue upstream instead of scripting around it.

### Do not modify core code
Don't edit files inside `resources/[qbx]/qbx_core` (or other framework resources) directly. It makes updating the framework difficult later and creates confusion when debugging whether an issue is a core bug or a local modification. If a real limitation is hit, that's a signal to file a GitHub issue upstream (asking for an event, a config value, or a redesign) rather than patching core in place.

### Do not use deprecated functions/events
Check for `@deprecated` annotations before using a function (e.g. `qbx_core/modules/utils.lua`'s `SpawnVehicle` is deprecated in favor of `qbx.spawnVehicle` in `modules/lib.lua`). Deprecated APIs are candidates for removal in future updates — don't build new code on top of them.

### Set the `vehicleid` statebag when spawning an owned vehicle
When spawning a vehicle owned by a player, set its `vehicleid` statebag to the corresponding row id from the `player_vehicles` table. This gives other resources a stable identifier to look up that vehicle in the database.

### Pass vehicle properties into `spawnVehicle`, don't set them after
Vehicle properties (mods, livery, etc.) should be passed as part of the params to `qbx.spawnVehicle`, not applied afterward via a separate call. Setting them after the vehicle already exists is an anti-pattern that can misbehave when the client isn't the entity's network owner.

### Do not rely on unversioned/unreleased resources
Don't build on a resource (or a specific function/event in one) that has no tagged release — Qbox makes no stability guarantees there, and it can change or break without warning.

## When you're not sure

Prefer, in order: (1) the resource's own README/fxmanifest.lua in this repo, (2) https://docs.qbox.re/ for Qbox-specific behavior, (3) the resource's own GitHub repo/issues for anything else (ox_lib → coxdocs.dev, oxmysql, npwd, etc.). Don't invent an export or convar name — verify it exists in the actual resource code first.
