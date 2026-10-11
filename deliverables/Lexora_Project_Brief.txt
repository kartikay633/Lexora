# Lexora: Project Summary and Presentation Brief

## Project overview

Lexora is a browser-based compiler-design workbench that allows students to edit or upload Lex/Flex lexer specifications, Yacc/Bison parser specifications, and program input. It compiles the selected specifications using real Flex, Bison, and GCC tools, executes the resulting program, and displays its output and diagnostics in the browser.

Lexora also includes an educational analyzer that explains a supported subset of C and arithmetic expressions through a token table, an abstract syntax tree, a symbol table, three-address code, optimized intermediate code, and basic blocks. This combination helps students relate practical Lex/Yacc experiments to concepts taught in a compiler-design course.

## Problem identification

Compiler-design laboratory work often requires students to manage lexer and parser specifications, run several terminal commands, inspect generated C files, and interpret compiler diagnostics. A successful program may print the expected answer without making its intermediate representations visible. This makes it difficult for beginners to understand how lexical analysis, parsing, symbol management, and intermediate-code generation relate to one another.

Lexora addresses this teaching problem by providing one workspace for source editing, input entry, native compilation, program output, and educational analysis. The motivation is based on the workflow the project addresses. The project does not include a formal user study measuring student learning outcomes.

## Objectives

1. Provide a browser interface for creating, editing, uploading, and selecting Lex and Yacc source files.
2. Support Lex Only, Lex + Yacc, and Yacc Only compilation modes.
3. Compile and execute user specifications through an actual native toolchain.
4. Present compiler concepts through tokens, syntax trees, scoped symbols, three-address code, optimization, and basic blocks.
5. Preserve browser drafts and allow users to download source files and program input.
6. Help students diagnose failures through stage-specific build messages, stderr, and execution status.

## Literature survey and technical foundations

| Reference | Relevant contribution | How Lexora uses it |
|---|---|---|
| Aho, Lam, Sethi, and Ullman, *Compilers: Principles, Techniques, and Tools*, second edition, 2007 | Compiler phases, intermediate representations, optimization, and control-flow concepts | Provides the conceptual organization of the educational analyzer and output views |
| Official Flex manual | Scanner generation from regular-expression rules and C actions | Flex converts a `.l` specification into `lex.yy.c` |
| Official GNU Bison manual | Parser generation from annotated context-free grammars | Bison converts a `.y` specification into parser C code and a token header |
| Official GCC manual | Preprocessing, compilation, assembly, and linking | GCC builds an executable from generated C sources |

These references establish the methods that Lexora applies. They should be described as foundational literature and tool documentation. Do not invent research papers, experimental findings, or numerical comparisons.

## Novelty and contribution

Lexora's contribution is the integration of native Lex/Yacc execution with educational compiler views in a single browser workspace. Students can edit specifications, supply input, run a real program, and inspect relevant compiler concepts without switching between several unrelated interfaces.

Additional contributions include selectable compilation targets, reusable examples, browser draft persistence, source downloads, and clear feedback when the built-in analyzer encounters unsupported input. Novelty should be stated at the application and teaching-workflow level. The project applies established algorithms and does not claim to introduce a new parsing or optimization algorithm.

## Implemented features

- A React workspace with a CodeMirror source editor and file sidebar.
- File creation, renaming, deletion, uploads, and source-target selection.
- Upload support for `.l`, `.y`, `.txt`, and `.in` files.
- Lex Only, Lex + Yacc, and Yacc Only modes.
- Bundled Calculator, Variables, and C Token Counter examples.
- Native stdout, compiler diagnostics, warnings, and compilation-stage messages.
- Token positions, syntax-tree visualization, scoped symbol information, TAC, optimization logs, and basic blocks.
- Browser draft persistence and source/input downloads.
- Light and dark interface modes.

## Architecture

The frontend uses React 19, CodeMirror 6, and Vite 8. It manages the workspace and sends the selected source contents and program input to the backend as JSON.

The backend uses Node.js and Express 5. It validates requests, creates a temporary working directory, performs input analysis, coordinates native compilation, and returns the results. During local development, Vite runs on port 3000 and proxies API requests to the backend on port 3001.

On Windows, the backend invokes compiler commands inside WSL Ubuntu. On Linux, it invokes the tools through native Bash. Flex generates the scanner, Bison generates the parser, and GCC compiles and links the generated C files.

The repository also contains Docker and Render deployment configuration for a password-protected demonstration with trusted users. Deployment availability should be verified separately before describing an online instance as currently live.

## Working flow

1. The user edits or uploads source files and enters program input.
2. The user chooses a compilation mode and selects the lexer and parser targets required by that mode.
3. The frontend sends `lexFile`, `yaccFile`, and `inputCode` to `POST /api/compile`.
4. Request validation checks field types, required source content, size limits, and null bytes.
5. The backend creates a uniquely named temporary directory and runs the built-in analysis on the input.
6. The backend writes the selected specifications and input to the temporary directory.
7. It invokes the required native generation, compilation, and execution stages.
8. It assembles stdout, diagnostics, stage information, and educational analysis into a JSON response.
9. It attempts to remove the temporary directory in a `finally` block on both success and failure.
10. The frontend displays the response through the console and analysis tabs.

## Where and how compilation happens

Compilation takes place on the backend host, outside the browser. In combined Lex + Yacc mode, the implementation performs the following operations:

```text
flex lex.l
bison -d parser.y
flex lex.l                     [regeneration after header alignment]
gcc -o compiler lex.yy.c parser.tab.c -lfl -lm
./compiler < input.txt
```

The initial Flex invocation generates `lex.yy.c`. Bison generates `parser.tab.c` and `parser.tab.h`. The backend aligns lexer references to generated parser headers, then regenerates the scanner. GCC compiles and links the generated C sources into an executable named `compiler`. The program reads `input.txt` through standard input.

Lex Only skips Bison and compiles the generated scanner. Yacc Only skips Flex, so the submitted parser source must provide its own `yylex()` and `main()` functions.

## Data storage and lifecycle

| Data | Location | Persistence |
|---|---|---|
| Source drafts, input, mode, and selected file information | Browser `localStorage` under `lexora.workspace.v2` | Survives reloads when browser storage is available, until site data is cleared |
| Theme preference | Browser `localStorage` under `lexora.theme` | Survives reloads |
| Uploaded source contents | Browser workspace state and saved draft | Becomes part of the browser workspace |
| Job sources, generated C/header files, input, and executable | `os.tmpdir()/lexora-<UUID>` on the backend host | Exists for the compilation request, followed by cleanup |
| Console output and educational results | Backend memory and frontend React state | Temporary result for the current session/run |
| Downloaded sources and input | User's download destination | Remains until the user removes it |

Lexora does not use an application database for workspace storage. Browser drafts do not automatically synchronize across browsers or devices. On Windows, WSL accesses the backend's temporary directory through a mapped path such as `/mnt/c/...`.

## Educational analysis and native execution

These are distinct computations and must be explained accurately. The native toolchain follows the uploaded Lex/Yacc specifications. The educational analyzer reads `inputCode` using Lexora's own tokenizer and recursive-descent parser for a supported C subset.

The analyzer builds an AST, tracks symbols and scopes, generates TAC, applies constant folding, constant propagation and algebraic simplification, and partitions the original TAC into basic blocks. The educational TAC does not feed GCC, and the syntax tree is not a trace of an arbitrary uploaded Bison grammar.

The analyzer supports arithmetic, assignments, numeric declarations, functions and parameters, blocks, calls, returns, comparisons, logical operators, `if/else`, `while`, and `for`, including increments, `break`, and `continue`. Unsupported constructs produce a specific analysis message while the console retains the native program's result.

## Demonstrable examples

The bundled calculator accepts `3 + 5 * 2` followed by a newline and prints `13`. The newline matters because its grammar completes an expression using an end-of-line token.

For the educational input `int x = 2 + 3 * 4;`, the AST groups multiplication before addition. The symbol table identifies `x` as an integer variable in global scope. The analyzer generates:

```text
Original TAC            Optimized TAC
t1 = 3 * 4              t1 = 12
t2 = 2 + t1             t2 = 14
x = t2                  x = 14
```

This example illustrates constant folding and propagation. The optimizer retains three assignments here, so this example does not demonstrate a reduced instruction count or a measured execution speedup. It has one basic block because it contains no branches.

## Limitations and future scope

The built-in analyzer supports an educational subset rather than the complete C language. Arrays, structures, pointer declarations, macros, casts, `switch`, and `do/while` are outside its current supported scope. Compilation accepts selected `.l` and `.y` targets rather than arbitrary projects with extra C and header files.

The current execution model is intended for trusted local or access-controlled demonstrations. Uploaded C actions run with the backend user's privileges. Temporary directories and timeouts bound jobs but do not provide a security sandbox. Public untrusted execution would require isolated workers with restricted filesystem and network access, plus resource limits.

Future work can include broader language support, additional project-file support, a dedicated execution-isolation service, and optional authenticated workspace synchronization. Present these as proposed improvements, not implemented features.

## Instructions for another AI

Create a polished academic project presentation for a teacher evaluating a compiler-design assignment. Use this brief as the factual source. Include problem identification, objectives, literature survey, novelty, architecture, a working flowchart, storage and file lifecycle, native compilation, educational analysis, a worked example, and limitations. Use complete sentences for explanatory text and concise technical labels inside diagrams. Avoid generic claims, invented metrics, fake research citations, placeholders, or statements that all visualizations come from the uploaded grammar. Use actual project screenshots where available, editable technical diagrams, consistent alignment, and readable typography. Use a restrained professional visual style with purposeful layout variety. Keep detailed explanations in speaker notes so the slides remain clear.

## Reference links

- Aho's publication list: https://www.cs.columbia.edu/~aho/books.html
- Flex manual: https://westes.github.io/flex/manual/Introduction.html
- Bison manual: https://www.gnu.org/s/bison/manual/bison.html
- GCC compilation stages: https://gcc.gnu.org/onlinedocs/gcc/Overall-Options.html

Project facts derive from the current README, frontend workspace and dependencies, API route and validator, compilation service, temporary-directory manager, native runner, and educational-analysis modules. The older curriculum notes contain some outdated architectural descriptions.
