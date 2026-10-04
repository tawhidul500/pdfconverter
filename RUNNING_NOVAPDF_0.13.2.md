# Running NovaPDF v0.13.2 on Windows

## One-click method

Extract the source package, then double-click:

```text
RUN_NOVAPDF_ALL.cmd
```

The file must remain in the NovaPDF project root beside `package.json`, `docker-compose.yml`, and the `backend` folder.

It automatically starts infrastructure, installs and validates root/backend dependencies, checks the migration, opens Web/API/Worker CMD windows, runs health/routes/local E2E, opens browser pages, and stores logs under `validation-logs`.

Main URLs:

```text
http://localhost:3000
http://localhost:3000/sign-pdf
http://localhost:3000/edit-pdf
http://localhost:4000/api/v1/health/live
http://localhost:4000/api/v1/health/ready
http://localhost:4000/api/docs
http://localhost:8025
http://localhost:9001
```

Keep the Web, API, and Worker CMD windows open during testing. Close them with `Ctrl+C` when finished.

The runner preserves Docker volumes and existing `backend\.env`, uses public npm registry URLs only, and never runs a forced audit fix.

Full behavior, expected gates, failure handling, and manual acceptance are documented in `WINDOWS_VALIDATION_STEP_13_2.md`.
