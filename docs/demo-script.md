# Lexora — Step-by-Step Faculty Demonstration Script

This script provides an exact, step-by-step walkthrough to present during faculty evaluations.

---

### Step 1: Open the Application
1. Ensure the servers are running:
   - Backend on `http://localhost:3001`
   - Frontend on `http://localhost:3000`
2. Open `http://localhost:3000` in Google Chrome or Edge.
3. Point out:
   - Dark theme developer workspace.
   - Left Sidebar: Workspace files (`calculator.l`, `calculator.y`, `input.txt`) and compiler pipeline flow.
   - Center: CodeMirror 6 code editor with line numbers and syntax highlighting.
   - Right: Tabbed output analysis panel.

---

### Step 2: Review 1 Demonstration (Flex + Bison + GCC Execution)
1. Show that the default example loaded is **Calculator**.
2. Briefly highlight:
   - `calculator.l`: Regular expression rules (`[0-9]+` → `NUMBER`, operators `+`, `-`, `*`, `/`).
   - `calculator.y`: Context-free grammar rules with operator precedence (`%left PLUS MINUS`, `%left MULTIPLY DIVIDE`).
   - `input.txt`: Expression `3 + 5 * 2`.
3. Click the **▶ Compile** button (or press `Ctrl+Enter`).
4. Show the **Console & Logs** tab:
   - Program Output displays: `13`.
   - Pipeline Log confirms each native step:
     ```text
     flex → lex.yy.c ✓
     bison → parser.tab.c ✓
     gcc → compiler ✓
     execution ✓
     ```
   - Execution time badge (e.g. `~1200ms`).

---

### Step 3: Review 2 Demonstration (Lexical, Syntax, Semantic, IR)
1. Click the **Tokens (CO1)** tab:
   - Show the 5 structured tokens: `NUMBER (3)`, `PLUS (+)`, `NUMBER (5)`, `MULTIPLY (*)`, `NUMBER (2)`.
   - Demonstrate filtering tokens with the search box.
2. Click the **Syntax Tree (CO2)** tab:
   - Point out that `*` (multiplication) is grouped deeper in the tree than `+` (addition), demonstrating operator precedence.
   - Toggle to **JSON AST** view to show structured data representation.
3. Click the **Semantic / Symbols (CO3)** tab:
   - Switch example in the top dropdown to **Variables**.
   - Show input:
     ```text
     x = 10
     y = x + 5
     y * 2
     ```
   - Click **Compile**.
   - Output shows `30`.
   - The Symbol Table now displays both `x` and `y` with global scope, declared `Yes`, and referenced `Yes`.
   - Zero semantic errors detected.
4. Click the **3-Address Code (CO4)** tab:
   - Show the generated linear TAC:
     ```text
     x = 10
     t1 = x + 5
     y = t1
     t2 = y * 2
     ```
   - Toggle to **Quadruples Table** view to show textbook quadruple format `(op, arg1, arg2, result)`.

---

### Step 4: Review 3 Demonstration (Optimization & Basic Blocks)
1. Click the **Optimization (CO5)** tab:
   - Show the side-by-side comparison:
     - **Before**: `t1 = x + 5`, `t2 = y * 2`
     - **After**: `t1 = 15`, `t2 = 30`
   - Point out the **Optimization Transformations Log**:
     - Constant Propagation on `x = 10`
     - Constant Folding on `10 + 5 → 15`
     - Constant Propagation on `y = 15`
     - Constant Folding on `15 * 2 → 30`
2. Click the **Basic Blocks (CO5)** tab:
   - Explain the leader identification rules displayed at the top.
   - Point out Block `B1` and its highlighted leader instruction.

---

### Step 5: Error Handling Demonstration
1. Switch to `input.txt` in the File Panel.
2. Change the input to:
   ```text
   3 + * 5
   ```
3. Click **Compile**.
4. Show that Lexora catches the syntax error gracefully, displaying:
   `Parse error: syntax error` in red with zero server crashes.
5. Click the "Reset" button in the File Panel to restore the valid example.
