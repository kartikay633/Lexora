%{
/*
 * Mini-C compiler front end (Lex + Yacc)
 * 1. Parses a small C program (int variables, if/else, while, for, printf, return).
 * 2. Builds an abstract syntax tree and prints it.
 * 3. Interprets the tree and prints the program's output.
 * 4. Prints the symbol table with final values.
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int yylex(void);
void yyerror(const char *s);
extern int yylineno;

typedef struct Node {
    const char *kind;      /* FUNCTION, BLOCK, DECL, ASSIGN, IF, WHILE, FOR, ... */
    char *text;            /* name, operator or string literal */
    int value;             /* number literal */
    struct Node *kid[4];
    struct Node *next;     /* next statement in a list */
} Node;

Node *root = NULL;
int node_count = 0;

Node *mk(const char *kind, char *text, Node *a, Node *b, Node *c, Node *d) {
    Node *n = calloc(1, sizeof(Node));
    n->kind = kind; n->text = text;
    n->kid[0] = a; n->kid[1] = b; n->kid[2] = c; n->kid[3] = d;
    node_count++;
    return n;
}

Node *num(int v) { Node *n = mk("NUM", NULL, NULL, NULL, NULL, NULL); n->value = v; return n; }

Node *append(Node *list, Node *item) {
    if (!list) return item;
    Node *p = list;
    while (p->next) p = p->next;
    p->next = item;
    return list;
}

/* ---------- printing the tree ---------- */
void print_tree(Node *n, int depth) {
    for (; n; n = n->next) {
        for (int i = 0; i < depth; i++) printf("|   ");
        printf("|-- %s", n->kind);
        if (!strcmp(n->kind, "NUM")) printf(" %d", n->value);
        else if (n->text) printf(" %s", n->text);
        printf("\n");
        for (int i = 0; i < 4; i++) print_tree(n->kid[i], depth + 1);
    }
}

/* ---------- symbol table ---------- */
struct { char name[32]; int value; int declared; } sym[100];
int sym_count = 0;

int lookup(const char *name) {
    for (int i = 0; i < sym_count; i++) if (!strcmp(sym[i].name, name)) return i;
    return -1;
}

int declare(const char *name) {
    int i = lookup(name);
    if (i >= 0) return i;
    strncpy(sym[sym_count].name, name, 31);
    sym[sym_count].declared = 1;
    return sym_count++;
}

int *var(const char *name) {
    int i = lookup(name);
    if (i < 0) {
        printf("semantic error: variable '%s' used before declaration\n", name);
        i = declare(name);
        sym[i].declared = 0;
    }
    return &sym[i].value;
}

/* ---------- interpreter ---------- */
int returned = 0, return_value = 0, steps = 0;

int eval(Node *n) {
    if (!strcmp(n->kind, "NUM")) return n->value;
    if (!strcmp(n->kind, "VAR")) return *var(n->text);
    if (!strcmp(n->kind, "NEG")) return -eval(n->kid[0]);
    if (!strcmp(n->kind, "NOT")) return !eval(n->kid[0]);
    int a = eval(n->kid[0]);
    const char *op = n->text;
    if (!strcmp(op, "&&")) return a && eval(n->kid[1]);
    if (!strcmp(op, "||")) return a || eval(n->kid[1]);
    int b = eval(n->kid[1]);
    if (!strcmp(op, "+")) return a + b;
    if (!strcmp(op, "-")) return a - b;
    if (!strcmp(op, "*")) return a * b;
    if (!strcmp(op, "/")) return b ? a / b : 0;
    if (!strcmp(op, "%")) return b ? a % b : 0;
    if (!strcmp(op, "<")) return a < b;
    if (!strcmp(op, ">")) return a > b;
    if (!strcmp(op, "<=")) return a <= b;
    if (!strcmp(op, ">=")) return a >= b;
    if (!strcmp(op, "==")) return a == b;
    if (!strcmp(op, "!=")) return a != b;
    return 0;
}

void print_string(const char *literal, Node *arg) {
    /* literal still has its quotes; handle \n, \t and one %d */
    for (const char *p = literal + 1; *p && p[1]; p++) {
        if (*p == '\\' && p[1] == 'n') { putchar('\n'); p++; }
        else if (*p == '\\' && p[1] == 't') { putchar('\t'); p++; }
        else if (*p == '%' && p[1] == 'd' && arg) { printf("%d", eval(arg)); p++; }
        else putchar(*p);
    }
}

void run(Node *n) {
    for (; n && !returned; n = n->next) {
        if (++steps > 1000000) { printf("stopped: too many steps (infinite loop?)\n"); exit(1); }
        const char *k = n->kind;
        if (!strcmp(k, "FUNCTION") || !strcmp(k, "BLOCK")) run(n->kid[0]);
        else if (!strcmp(k, "DECL")) { int i = declare(n->text); sym[i].value = n->kid[0] ? eval(n->kid[0]) : 0; }
        else if (!strcmp(k, "ASSIGN")) *var(n->text) = eval(n->kid[0]);
        else if (!strcmp(k, "INCREMENT")) (*var(n->text))++;
        else if (!strcmp(k, "IF")) { if (eval(n->kid[0])) run(n->kid[1]); else if (n->kid[2]) run(n->kid[2]); }
        else if (!strcmp(k, "WHILE")) { while (!returned && eval(n->kid[0])) run(n->kid[1]); }
        else if (!strcmp(k, "FOR")) {
            for (run(n->kid[0]); !returned && eval(n->kid[1]); run(n->kid[2])) run(n->kid[3]);
        }
        else if (!strcmp(k, "PRINTF")) print_string(n->text, n->kid[0]);
        else if (!strcmp(k, "RETURN")) { return_value = eval(n->kid[0]); returned = 1; }
    }
}
%}

%union {
    int num;
    char *str;
    struct Node *node;
}

%token <num> NUM
%token <str> ID STRING
%token INT IF ELSE WHILE FOR RETURN PRINTF EQ NE LE GE AND OR INC

%type <node> function block statements statement simple expr

%nonassoc LOWER_THAN_ELSE
%nonassoc ELSE
%left OR
%left AND
%left EQ NE
%left '<' '>' LE GE
%left '+' '-'
%left '*' '/' '%'
%right '!' UMINUS

%%
program
    : function                          { root = $1; }
    ;

function
    : INT ID '(' ')' block              { $$ = mk("FUNCTION", $2, $5, NULL, NULL, NULL); }
    ;

block
    : '{' statements '}'                { $$ = mk("BLOCK", NULL, $2, NULL, NULL, NULL); }
    ;

statements
    : /* empty */                       { $$ = NULL; }
    | statements statement              { $$ = append($1, $2); }
    ;

statement
    : INT ID ';'                        { $$ = mk("DECL", $2, NULL, NULL, NULL, NULL); }
    | INT ID '=' expr ';'               { $$ = mk("DECL", $2, $4, NULL, NULL, NULL); }
    | simple ';'                        { $$ = $1; }
    | IF '(' expr ')' statement %prec LOWER_THAN_ELSE
                                        { $$ = mk("IF", NULL, $3, $5, NULL, NULL); }
    | IF '(' expr ')' statement ELSE statement
                                        { $$ = mk("IF", NULL, $3, $5, $7, NULL); }
    | WHILE '(' expr ')' statement      { $$ = mk("WHILE", NULL, $3, $5, NULL, NULL); }
    | FOR '(' simple ';' expr ';' simple ')' statement
                                        { $$ = mk("FOR", NULL, $3, $5, $7, $9); }
    | PRINTF '(' STRING ')' ';'         { $$ = mk("PRINTF", $3, NULL, NULL, NULL, NULL); }
    | PRINTF '(' STRING ',' expr ')' ';'
                                        { $$ = mk("PRINTF", $3, $5, NULL, NULL, NULL); }
    | RETURN expr ';'                   { $$ = mk("RETURN", NULL, $2, NULL, NULL, NULL); }
    | block                             { $$ = $1; }
    ;

simple
    : ID '=' expr                       { $$ = mk("ASSIGN", $1, $3, NULL, NULL, NULL); }
    | ID INC                            { $$ = mk("INCREMENT", $1, NULL, NULL, NULL, NULL); }
    ;

expr
    : expr '+' expr     { $$ = mk("BINOP", "+", $1, $3, NULL, NULL); }
    | expr '-' expr     { $$ = mk("BINOP", "-", $1, $3, NULL, NULL); }
    | expr '*' expr     { $$ = mk("BINOP", "*", $1, $3, NULL, NULL); }
    | expr '/' expr     { $$ = mk("BINOP", "/", $1, $3, NULL, NULL); }
    | expr '%' expr     { $$ = mk("BINOP", "%", $1, $3, NULL, NULL); }
    | expr '<' expr     { $$ = mk("BINOP", "<", $1, $3, NULL, NULL); }
    | expr '>' expr     { $$ = mk("BINOP", ">", $1, $3, NULL, NULL); }
    | expr LE expr      { $$ = mk("BINOP", "<=", $1, $3, NULL, NULL); }
    | expr GE expr      { $$ = mk("BINOP", ">=", $1, $3, NULL, NULL); }
    | expr EQ expr      { $$ = mk("BINOP", "==", $1, $3, NULL, NULL); }
    | expr NE expr      { $$ = mk("BINOP", "!=", $1, $3, NULL, NULL); }
    | expr AND expr     { $$ = mk("BINOP", "&&", $1, $3, NULL, NULL); }
    | expr OR expr      { $$ = mk("BINOP", "||", $1, $3, NULL, NULL); }
    | '-' expr %prec UMINUS { $$ = mk("NEG", NULL, $2, NULL, NULL, NULL); }
    | '!' expr          { $$ = mk("NOT", NULL, $2, NULL, NULL, NULL); }
    | '(' expr ')'      { $$ = $2; }
    | NUM               { $$ = num($1); }
    | ID                { $$ = mk("VAR", $1, NULL, NULL, NULL, NULL); }
    ;
%%

void yyerror(const char *s) {
    fprintf(stderr, "Syntax error at line %d: %s\n", yylineno, s);
}

int main(void) {
    if (yyparse() != 0) return 1;

    printf("========== SYNTAX TREE (built by Yacc) ==========\n");
    print_tree(root, 0);
    printf("(%d nodes)\n\n", node_count);

    printf("========== PROGRAM OUTPUT ==========\n");
    run(root);
    printf("\n%s returned %d\n\n", root->text, return_value);

    printf("========== SYMBOL TABLE ==========\n");
    printf("%-12s %-6s %s\n", "Name", "Type", "Final value");
    for (int i = 0; i < sym_count; i++)
        printf("%-12s %-6s %d%s\n", sym[i].name, "int", sym[i].value, sym[i].declared ? "" : "  (undeclared)");
    return 0;
}
