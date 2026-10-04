# Running NovaPDF 0.14.7 on Windows

1. Extract to a fresh short path such as `C:\NovaPDF-v147`.
2. Start Docker Desktop.
3. Double-click `RUN_NOVAPDF_ALL.cmd` and allow every gate to finish.
4. For a later direct development run, open CMD in the project root and run `npm.cmd run dev`.
5. The launcher starts or checks the PDF converter, then runs the installed local Next.js CLI with Node. It does not directly execute `npx.cmd`.

If dependencies are missing, run `npm.cmd ci --registry=https://registry.npmjs.org/` and retry. Never use `npm audit fix --force` and never delete Docker volumes for routine validation.
