# Lexora — Faculty Review Notes & Viva Q&A Guide

## 1. Review Milestones Summary

| Review Milestone | Key Deliverables & Demonstrable Items | Relevant Syllabus Outcomes |
|---|---|---|
| **Review 1** | Working Flex → Bison → GCC → Run pipeline inside WSL Ubuntu, file editor, live compilation logs, execution output, error capture, calculator example. | CO1 (Lex), CO2 (Yacc/Bison) |
| **Review 2** | Token table with types and positions, hierarchical AST / Parse tree visualization, Symbol Table with scope & declaration checks, Three-Address Code (TAC) generation in quadruple format. | CO1 (Tokens), CO2 (Parse Tree), CO3 (Semantic Analysis), CO4 (TAC) |
| **Review 3** | Constant folding, algebraic simplification, constant propagation, side-by-side optimization diff view, leader-based Basic Block partitioning, full demo flow and test suite. | CO5 (Optimization & Basic Blocks) |

---

## 2. Likely Viva Questions & Answers for Students

### Q1: What is the role of Flex in this workbench?
**Answer**: Flex is a lexical analyzer generator. It reads the regular expressions and semantic rules in the `.l` file and translates them into a C program (`lex.yy.c`) representing a Deterministic Finite Automaton (DFA). When executed, it groups raw input characters into meaningful lexical tokens.

### Q2: What parsing algorithm does Bison use?
**Answer**: Bison is an LALR(1) (Look-Ahead Left-to-right, Rightmost derivation with 1 lookahead) parser generator. It reads context-free grammar rules from the `.y` file and creates shift-reduce parsing tables in `parser.tab.c`.

### Q3: Why is Three-Address Code (TAC) used as an Intermediate Representation?
**Answer**: Three-Address Code simplifies code analysis and optimization because every instruction contains at most one operator and at most three addresses (two operands and one result). It is machine-independent, making optimizations like constant folding and common subexpression elimination straightforward before emitting target architecture instructions.

### Q4: How are basic blocks partitioned?
**Answer**: Using leader identification rules:
1. The first instruction is always a leader.
2. The target of any conditional or unconditional jump is a leader.
3. Any instruction immediately following a jump is a leader.
A basic block starts at a leader and contains all instructions up to (but excluding) the next leader.

### Q5: How does constant folding differ from constant propagation?
**Answer**:
- **Constant Folding**: Evaluates constant arithmetic expressions at compile-time (e.g., `t1 = 2 + 3` becomes `t1 = 5`).
- **Constant Propagation**: Takes a known constant assigned to a variable and substitutes that constant value in subsequent instructions where the variable is referenced (e.g., substituting `t1` with `5` in `t2 = t1 * 4`).
Together, they simplify expressions across basic blocks.
