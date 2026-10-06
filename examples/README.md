# Lexora Examples

## Calculator

A simple arithmetic calculator that demonstrates the Lex/Yacc pipeline.

### Files
- `calculator.l` — Flex lexer: recognizes numbers, operators, parentheses
- `calculator.y` — Bison parser: arithmetic grammar with operator precedence
- `input.txt` — Sample input: `3 + 5 * 2`

### Expected Output
```
13
```

### Manual Compilation (WSL)
```bash
cd examples/calculator
flex calculator.l
bison -d calculator.y
gcc -o calculator lex.yy.c calculator.tab.c -lfl
echo "3 + 5 * 2" | ./calculator
```
