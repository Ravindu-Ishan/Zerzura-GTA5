# ZERZURA-GTA5 (Qbox)

A FiveM/CFX GTA5 roleplay server built on the [Qbox Project](https://github.com/Qbox-project) framework.

## Prerequisites

| Requirement | Notes |
|---|---|
| **CFX server artifact** | Windows build `v1.0.0.35945` (or newer *recommended* build) — see below |
| **MariaDB** (or MySQL 8+) | Local or remote instance you control credentials for |
| **A personal FiveM license key** | Free from [Keymaster](https://keymaster.fivem.net/) — do **not** reuse someone else's, see Security notes |
| Git | To clone/pull this repo |

### Getting the CFX server artifact

This repo does **not** include the server binaries (`server/` is gitignored — it's a large, platform-specific, re-downloadable build). Download it yourself from the official artifact server:

- Windows: https://runtime.fivem.net/artifacts/fivem/build_server_windows/master/
- Linux: https://runtime.fivem.net/artifacts/fivem/build_proot_linux/master/

Grab build **35945** to match what this project was built/tested against, or any newer build under the "recommended" channel — Qbox tracks recent CFX builds closely. Extract it into a `server/` folder at the project root (sibling to `txData/`).

> Note: this is different from `sv_enforceGameBuild 3258` in `server.cfg`, which pins the **GTA V game build** players must be on — not the CFX server artifact version.

## Project layout

```
GTA5_ZERZURA_QBOX/
├── server/                          # CFX server artifact (gitignored — download separately, see above)
└── txData/                         # txAdmin data directory
    ├── admins.json                 # txAdmin panel logins (gitignored — generated on first run)
    └── default/                    # txAdmin core state: config.json, logs/, data/ (gitignored)
        └── ... (created by txAdmin itself)
    └── Qbox_A6AE44.base/            # the actual server instance txAdmin manages
        ├── server.cfg               # main config (license key, DB connection, convars)
        ├── ox.cfg / misc.cfg / voice.cfg / permissions.cfg
        └── resources/                # all resource code — this is the part you develop in
            ├── [qbx]/                # Qbox gameplay resources (qbx_core, qbx_vehicleshop, ...)
            ├── [ox]/                 # overextended framework libs (ox_lib, ox_inventory, ox_target, ...)
            ├── [npwd]/ [npwd-apps]/  # in-game phone + its apps
            ├── [standalone]/         # third-party standalone resources
            ├── [voice]/ [assets]/
            └── [cfx-default]/[local]/  # <- reserved for YOUR custom resources
```

## Setup

1. **Clone this repo.**
2. **Download the CFX server artifact** (above) into `server/` at the project root.
3. **Create the database** in MariaDB:
   ```sql
   CREATE DATABASE ZERZURA_GTA5_QBOX CHARACTER SET utf8mb4;
   ```
4. **Deploy the core server through the official [Qbox txAdmin recipe](https://docs.qbox.re/)** if you haven't already — this creates all the core framework tables (qbx_core, qbx_vehicles, qbx_properties, Renewed-Banking, npwd, etc.) automatically as part of that process. You don't need to import anything by hand for the core framework.
5. **Run our custom scripts**, if any exist yet, from [database/sql_scripts/](database/sql_scripts/) — see that folder's README for the convention. This is the *only* schema you need to apply manually; it's on top of what the recipe already set up.
6. **Set up your secrets file** (this is per-machine and gitignored — never committed):
   ```bash
   cp "txData/Qbox_A6AE44.base/secrets.cfg.example" "txData/Qbox_A6AE44.base/secrets.cfg"
   ```
   Then edit `secrets.cfg` and fill in:
   - `sv_licenseKey` — put in **your own** Keymaster license key (never share one key across multiple server operators/machines)
   - `mysql_connection_string` — point it at your local MariaDB user/password/database
7. **Edit `txData/Qbox_A6AE44.base/server.cfg`** for your own machine:
   - `add_principal identifier.fivem:XXXXXXXX group.admin` — replace with your own FiveM identifier to get admin in-game
8. **Start the server**: run `server/FXServer.exe`. On first run it opens the txAdmin setup wizard at `http://localhost:40120` — create your own local admin account (this is why `admins.json` is gitignored, it's per-machine) and point it at the existing `Qbox_A6AE44.base` profile if prompted, then hit Start.
9. **Connect** from the FiveM client via `connect 127.0.0.1:30120` (or F8 console).

## Database

```
database/
├── backups/       # timestamped mariadb-dump.exe backups (gitignored — local only)
└── sql_scripts/   # OUR custom tables only — see its README for the convention
```

Unlike an ORM with auto-DDL (e.g. Hibernate/JPA), nothing here creates core framework tables on every boot. Those tables (qbx_core, qbx_vehicles, qbx_properties, Renewed-Banking, npwd, etc.) are created once, automatically, when the server is deployed through the official Qbox txAdmin recipe — that's the framework's concern, not something this repo needs to script or track.

`database/sql_scripts/` is reserved for tables belonging to *our own* custom resources, layered on top of the core install. Run any scripts found there once, after the core recipe setup — see [database/sql_scripts/README.md](database/sql_scripts/README.md).

**Backups:** before any database schema/data change, a fresh dump is taken into `database/backups/` (via `mariadb-dump.exe`, gitignored — never committed since it contains player data).

## Development workflow

**Adding a custom Lua resource:** create a new folder under `resources/[cfx-default]/[local]/your_resource/` with its own `fxmanifest.lua` (see any existing resource for the format), then add `ensure your_resource` to `server.cfg`.

**Adding custom UI (NUI):** UI lives inside the resource that owns it, in a `web/` or `html/` subfolder (`index.html` + css/js), declared via `ui_page 'web/index.html'` in that resource's `fxmanifest.lua`. See `resources/[ox]/ox_doorlock/web/` or `resources/[npwd-apps]/npwd_qbx_mail/web/` for working examples.

**Adding modded/addon vehicles:**
1. Create a new resource, e.g. `resources/[vehicles]/mycar/`, with the vehicle's `stream/` files (`.ytd`/`.yft`) and meta files (`vehicles.meta`, `carcols.meta`, `carvariations.meta`, `handling.meta`), declared via `data_file`/`file` in its `fxmanifest.lua` — this part is standard FiveM, unrelated to Qbox.
2. Register it in Qbox so shops/garages/HUD recognize it: add an entry to `resources/[qbx]/qbx_core/shared/vehicles.lua` (`name`, `brand`, `price`, `category`, `type`, `hash`).

## Security notes

- `sv_licenseKey` and `mysql_connection_string` live in `secrets.cfg`, which is gitignored — `server.cfg` only does `exec secrets.cfg` to pull them in. **Never commit** a real `secrets.cfg`; only `secrets.cfg.example` (placeholder values) is tracked.
- `admins.json`, txAdmin logs, and the `cache/` folder are per-machine and gitignored — don't try to commit or share them.
- The `server/` artifact folder is gitignored on purpose; each developer downloads their own copy (see above).
