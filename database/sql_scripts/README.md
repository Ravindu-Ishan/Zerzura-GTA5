# Custom SQL scripts

This folder is **only** for tables/migrations belonging to our own custom resources — not the Qbox/ox/framework resources.

Core framework schema (qbx_core, qbx_vehicles, qbx_properties, Renewed-Banking, npwd, etc.) is created automatically when a server is deployed through the official Qbox txAdmin recipe, so it isn't tracked here.

## Convention

When a custom resource needs its own tables, add a script here named after the resource:

```
database/sql_scripts/<your_resource_name>.sql
```

After deploying the core server (via the recipe), run any `.sql` files in this folder against the database once, e.g.:

```bash
mysql -u root -p ZERZURA_GTA5_QBOX < database/sql_scripts/your_resource_name.sql
```

If a script changes an existing table rather than creating a new one, name it to make that clear (e.g. `your_resource_name_migrate_2026-09-14.sql`) and note in this file what it does and when it needs to be run, since these won't run themselves.
