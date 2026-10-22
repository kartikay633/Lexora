# Lexora

A local Lex/Yacc playground: edit or upload a Flex lexer (`.l`), a Bison parser (`.y`), and program input, then compile and run them.

## Setup

Use Node.js 22.12+ (or 24+). On Windows, install WSL with Ubuntu and the compiler tools:

```powershell
wsl -d Ubuntu -- bash -c "sudo apt-get update && sudo apt-get install -y flex bison gcc coreutils"
npm run install:all
npm run dev
```

Open http://localhost:3000. The backend runs on 127.0.0.1:3002; to use another port, set `PORT` before starting (PowerShell: `$env:PORT=3005; npm run dev`) and the frontend proxy follows it. On Linux, install the same compiler tools and run the same npm commands. Set `WSL_DISTRO` if your Windows distribution has a different name. The toolbar reports whether the server and compiler tools are available.

## Use

- The initial workspace contains a runnable word/number lexer. Press **Compile**, or **Ctrl/Cmd + Enter**.
- Choose **Lex Only**, **Lex + Yacc**, or **Yacc Only**. Yacc-only source must supply its own `yylex` and `main` functions. A standalone lexer may supply `main`, or use Flex's library entry point.
- Upload `.l`, `.y`, `.txt`, or `.in` files (100 KB per file). Text/input files populate stdin. Source files are added without replacing your edits. Duplicate names are rejected with a visible message. Upload a matching lexer/parser pair together to select both.
- The file sidebar supports creating, renaming, deleting, and selecting compilation targets. Under **Compile targets**, choose the lexer (`.l`) and parser (`.y`) independently for **Lex + Yacc**, or click **Use** beside a file to make it the target. Opening a file changes the editor without changing the selected targets. Your choices persist after refresh. Only the selected `.l` and/or `.y` are compiled; extra C/header files are not supported.
- Calculator and Variables examples add files to the workspace and select them without deleting existing sources.
- Input is passed exactly as typed, including trailing newlines. The bundled calculators expect a newline after each expression.
- Drafts are saved in this browser. **Save file** downloads the selected source; **Save input** downloads stdin. Source/target changes clear previous results.
- Console shows real stdout, diagnostics, stderr warnings, and build stages. Each build stage and program execution has a 10-second timeout and a 1 MB output limit. Temporary directories are cleaned after each request.

## Educational analysis

Tokens, syntax trees, symbol tables, TAC, optimization, and basic blocks analyze **program input** using Lexora's built-in parser. They are separate from the behavior of your uploaded lexer/parser. A token-counting lexer does not itself construct a syntax tree or generate TAC.

Supported input includes arithmetic expressions, assignments, numeric declarations, function definitions and parameters, blocks, calls, return statements, comparisons, logical operators, `if/else`, `while`, and `for` loops with increments, break and continue. Preprocessor lines and comments are skipped; quoted literals are recognized. Symbols track function/block scopes. Shadowed variables get distinct TAC names (for example `x@2`). This is an educational C subset, not a complete C frontend: arrays, structs, pointer declarations, macros, casts, switch and do/while are unsupported. Unsupported input shows a specific analysis message and retains observed identifiers without claiming semantic checks passed. Empty input asks for stdin. A constant such as `42` produces a visible TAC result.

The tree fits the panel by default; zoom controls enlarge it for inspection. The **C Token Counter** example includes a corrected standalone lexer and C input so all analysis views can be inspected. It skips comments/quoted literals, scans past closing braces, and counts multi-character operators as one occurrence. To preserve the supplied lexer's convention, `main`, `printf`, and `scanf` are excluded from identifier counts.

The console remains authoritative for your compiled program.

The `examples/words-ct/words-ct.l` scanner finds alphabetic words starting with C/c and ending with T/t, across every input line. Upload it and `examples/words-ct/input.txt` to try it. A rule such as `\n { return 0; }` exits `yylex()` at the first newline; a single call from `main` will therefore scan only the first line. Skip whitespace with `[ \t\r\n]+ { }` to scan until EOF. Flex chooses the longest match, then the first rule on a tie: the fallback `[a-zA-Z]+` skips a whole word like `catapults` instead of accepting its `cat` prefix.


## Commands

```sh
npm run dev          # start frontend and backend together
npm run dev:frontend
npm run dev:backend
npm run build        # production frontend bundle
npm test             # native toolchain and analysis regression checks
npm --prefix frontend run lint
```

Tests need the compiler tools installed. The suite covers standalone Lex and Yacc, combined compilation, CRLF sources, custom generated-header names, errors with stdout, invalid requests, timeouts, parsing, semantic analysis, and optimization.

## Execution boundary

This is a **trusted local workbench**, not a sandbox for a public website. Uploaded C actions execute with the backend user's filesystem/network privileges. The API binds to loopback and accepts browser compilation requests only from the local frontend. Timeouts and temporary folders do not isolate hostile programs. Public deployment requires an isolated per-job execution service with restricted filesystem/network access and CPU/memory/process limits before accepting untrusted submissions.

For an online classroom demo, see [the free Render deployment guide](docs/deploy-render.md). The included Dockerfile installs the native compiler tools and serves the frontend and backend together. The demo opens without a password by default. Set `DEMO_AUTH_ENABLED=true` with `DEMO_USERNAME` and `DEMO_PASSWORD` to restore password protection. Classroom access does not provide a code sandbox.

## Structure

- `frontend/src/App.jsx`: workspace, file handling, persistence, examples, compilation
- `frontend/src/components`: editor, files, console, educational views
- `backend/services/compiler.js`: compilation and analysis orchestration
- `backend/services/wslRunner.js`: bounded WSL/native execution and tool discovery
- `backend/regression.test.js`: regression tests
- `examples`: bundled calculator and variable programs

Older curriculum notes under `docs/` describe the original educational prototype; this README describes the current behavior.
