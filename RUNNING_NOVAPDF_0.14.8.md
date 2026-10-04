# Running NovaPDF 0.14.8 on Windows

1. Extract to a fresh short path such as `C:\NovaPDF-v148`.
2. Start Docker Desktop.
3. Double-click `RUN_NOVAPDF_ALL.cmd` and allow every gate to finish.
4. The runner applies the committed migration, parses TypeORM's current `[X] <order> <name>` output, and performs a second idempotency run.
5. For a later direct development run, open CMD in the project root and run `npm.cmd run dev`.

Never use `npm audit fix --force` and never delete Docker volumes for routine validation.
