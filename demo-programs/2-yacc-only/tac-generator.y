%{
/*
 * Three-Address Code Generator (Yacc only)
 * Parses assignment statements, prints the three-address code for each
 * one, evaluates it, and ends with the symbol table.
 * The scanner (yylex) is written by hand below, so no Lex file is needed.
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>

int yylex(void);
void yyerror(const char *s);

typedef struct { char addr[32]; int value; } Expr;

int line_no = 1, temp_count = 0, statement_count = 0, error_count = 0;

struct { char name[32]; int value; } table[100];
int table_size = 0;

int find(const char *name) {
    for (int i = 0; i < table_size; i++)
        if (strcmp(table[i].name, name) == 0) return i;
    return -1;
}

int get(const char *name) {
    int i = find(name);
    if (i < 0) {
        printf("    warning (line %d): '%s' used before assignment, using 0\n", line_no, name);
        return 0;
    }
    return table[i].value;
}

void set(const char *name, int value) {
    int i = find(name);
    if (i < 0 && table_size < 100) {
        i = table_size++;
        strcpy(table[i].name, name);
    }
    if (i >= 0) table[i].value = value;
}

Expr constant(int value) {
    Expr e;
    sprintf(e.addr, "%d", value);
    e.value = value;
    return e;
}

Expr emit(Expr a, const char *op, Expr b) {
    Expr r;
    sprintf(r.addr, "t%d", ++temp_count);
    printf("    %-4s = %s %s %s\n", r.addr, a.addr, op, b.addr);
    switch (op[0]) {
        case '+': r.value = a.value + b.value; break;
        case '-': r.value = a.value - b.value; break;
        case '*': r.value = a.value * b.value; break;
        case '/': r.value = b.value ? a.value / b.value : 0;
                  if (!b.value) printf("    warning (line %d): division by zero, using 0\n", line_no);
                  break;
        case '%': r.value = b.value ? a.value % b.value : 0; break;
    }
    return r;
}

Expr negate(Expr a) {
    Expr r;
    sprintf(r.addr, "t%d", ++temp_count);
    printf("    %-4s = -%s\n", r.addr, a.addr);
    r.value = -a.value;
    return r;
}
%}

%union {
    int num;
    char id[32];
    Expr e;
}

%token <num> NUMBER
%token <id> ID
%type <e> expr

%left '+' '-'
%left '*' '/' '%'
%right UMINUS

%%
program
    : /* empty */
    | program statement
    ;

statement
    : ID '=' { printf("Statement %d (line %d): %s = ...\n", ++statement_count, line_no, $1); }
      expr ';'
      {
          printf("    %-4s = %s\n", $1, $4.addr);
          set($1, $4.value);
          printf("    => %s = %d\n\n", $1, $4.value);
      }
    | error ';' { error_count++; yyerrok; }
    ;

expr
    : expr '+' expr          { $$ = emit($1, "+", $3); }
    | expr '-' expr          { $$ = emit($1, "-", $3); }
    | expr '*' expr          { $$ = emit($1, "*", $3); }
    | expr '/' expr          { $$ = emit($1, "/", $3); }
    | expr '%' expr          { $$ = emit($1, "%", $3); }
    | '-' expr %prec UMINUS  { $$ = negate($2); }
    | '(' expr ')'           { $$ = $2; }
    | NUMBER                 { $$ = constant($1); }
    | ID                     { strcpy($$.addr, $1); $$.value = get($1); }
    ;
%%

/* Hand-written scanner: numbers, identifiers, // comments and single-character tokens. */
int yylex(void) {
    int c;
    for (;;) {
        c = getchar();
        if (c == '\n') line_no++;
        else if (c == '/' ) {
            int next = getchar();
            if (next == '/') { while ((c = getchar()) != '\n' && c != EOF); if (c == '\n') line_no++; continue; }
            ungetc(next, stdin);
            return '/';
        }
        else if (!isspace(c)) break;
    }
    if (c == EOF) return 0;
    if (isdigit(c)) {
        int value = 0;
        while (isdigit(c)) { value = value * 10 + (c - '0'); c = getchar(); }
        ungetc(c, stdin);
        yylval.num = value;
        return NUMBER;
    }
    if (isalpha(c) || c == '_') {
        int n = 0;
        while ((isalnum(c) || c == '_') && n < 31) { yylval.id[n++] = c; c = getchar(); }
        yylval.id[n] = '\0';
        ungetc(c, stdin);
        return ID;
    }
    return c;
}

void yyerror(const char *s) {
    printf("    error (line %d): %s, skipping to next ';'\n\n", line_no, s);
}

int main(void) {
    printf("===== THREE-ADDRESS CODE =====\n\n");
    yyparse();
    printf("===== SUMMARY =====\n");
    printf("Statements      : %d\n", statement_count);
    printf("Temporaries     : %d\n", temp_count);
    printf("Syntax errors   : %d\n\n", error_count);
    printf("===== SYMBOL TABLE =====\n");
    printf("%-10s %s\n", "Variable", "Value");
    for (int i = 0; i < table_size; i++)
        printf("%-10s %d\n", table[i].name, table[i].value);
    return 0;
}
