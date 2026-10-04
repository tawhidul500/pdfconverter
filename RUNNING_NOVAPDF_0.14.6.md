# Running NovaPDF 0.14.6 on Windows

Extract to a fresh short path such as `C:\NovaPDF-v146`, start Docker Desktop, and double-click `RUN_NOVAPDF_ALL.cmd`. Let the full sequence finish, then complete `WINDOWS_VALIDATION_STEP_14_6.md`.

The migration stage is intentionally idempotent: it applies a pending migration, verifies `[X]`, and confirms there are no remaining migrations. The runner preserves Docker volumes and never applies an automatic npm audit fix.
