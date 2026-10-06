# Lexora — Compiler Pipeline Documentation

## 1. Overview of Compilation Stages

Lexora demonstrates the standard classical phases of a compiler as taught in computer science curricula:

```text
Source Code (.l, .y, input.txt)
       │
       ▼
[Phase 1: Lexical Analysis]       ──▶  Tokens (Type, Lexeme, Line, Pos)
       │
       ▼
[Phase 2: Syntax Analysis]        ──▶  Parse Tree / Abstract Syntax Tree (AST)
       │
       ▼
[Phase 3: Semantic Analysis]      ──▶  Symbol Table & Type/Scope Checks
       │
       ▼
[Phase 4: Intermediate Code Gen]  ──▶  Three-Address Code (Quadruples)
       │
       ▼
[Phase 5: Machine-Indep. Opt]    ──▶  Optimized TAC (Constant Folding, Simplification)
       │
       ▼
[Phase 6: Code Partitioning]      ──▶  Basic Blocks & Leader Identification
       │
       ▼
[Phase 7: Native Machine Build]   ──▶  GCC Executable Binary & Program Execution
```

---

## 2. Phase-by-Phase Detail

### Phase 1: Lexical Analysis (Flex)
- **Input**: Flex lexer specification (`.l`) + source input (`input.txt`).
- **Mechanism**: The user specifies regular expressions associated with semantic actions. In WSL, `flex lex.l` generates the C source file `lex.yy.c`, which contains the Deterministic Finite Automaton (DFA) transition tables and the `yylex()` lexical scanner.
- **Visualization**: `tokenExtractor.js` parses the input stream into structured tokens `{ type, lexeme, line, position }` displayed in the interactive Token Table.

### Phase 2: Syntax Analysis (Bison)
- **Input**: Bison grammar specification (`.y`).
- **Mechanism**: Bison processes Context-Free Grammars (CFG) in Backus-Naur Form (BNF) using an LALR(1) shift-reduce parsing algorithm. Running `bison -d parser.y` produces:
  - `parser.tab.c`: C parser implementation with shift/reduce state tables.
  - `parser.tab.h`: Token definitions and union value structures.
- **Visualization**: `astGenerator.js` applies recursive-descent parsing to produce an Abstract Syntax Tree representing the hierarchical parent-child relationships and operator precedence.

### Phase 3: Semantic Analysis & Symbol Table
- **Mechanism**: The AST is traversed to track identifiers, verify variable declarations, and check types.
- **Rules Verified**:
  - Declaration before usage: Flag variables referenced without an assignment.
  - Runtime division safety: Detect literal division by zero.
- **Visualization**: Symbol Table listing all identified variables, their inferred type, scope, declaration state, and reference history.

### Phase 4: Intermediate Code Generation (Three-Address Code)
- **Mechanism**: Syntax-Directed Translation walks the AST nodes and produces Three-Address Code (TAC) where every instruction contains at most one operator and at most three address references.
- **Data Structure**: Standard textbook quadruples:
  ```json
  { "op": "*", "arg1": "5", "arg2": "2", "result": "t1" }
  ```
- **Representation**: Displayed both as linear assignments (`t1 = 5 * 2`) and formal tabular quadruples `(op, arg1, arg2, result)`.

### Phase 5: Machine-Independent Code Optimization
- **Transformations Implemented**:
  1. **Constant Folding**: Evaluates constant expressions at compile-time:
     `t1 = 2 + 3` → `t1 = 5`
  2. **Algebraic Simplification**: Applies mathematical identities:
     - `x + 0` → `x`
     - `x * 1` → `x`
     - `x * 0` → `0`
     - `x - x` → `0`
  3. **Constant Propagation**: Substitutes known constant temporary values forward into subsequent expressions.
- **Visualization**: Side-by-side comparison of original TAC vs. optimized TAC with highlighted diffs and an audit log of applied optimization passes.

### Phase 6: Basic Block Partitioning
- **Leader Detection Rules (Aho, Lam, Sethi, Ullman)**:
  1. The first statement in the TAC is a leader.
  2. Any statement that is the target of a conditional or unconditional goto is a leader.
  3. Any statement that immediately follows a conditional or unconditional goto is a leader.
- **Partitioning**: A basic block consists of a sequence of consecutive statements starting with a leader and ending just before the next leader.
- **Visualization**: Visual card layout showing Basic Blocks `B1`, `B2`..., highlighted leaders, and successor links.

### Phase 7: Native Machine Code Compilation & Execution
- **Pipeline Execution**:
  ```bash
  gcc -o compiler lex.yy.c parser.tab.c -lfl -lm
  cat input.txt | ./compiler
  ```
- **Output**: Captures standard output and runtime diagnostic messages, returning them to the user's browser console in real time.
