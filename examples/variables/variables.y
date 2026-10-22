%{
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int yylex();
void yyerror(const char *s);

/* Simple symbol table for runtime evaluation */
struct Symbol {
    char name[64];
    int value;
    int is_defined;
};

static struct Symbol symtab[256];
static int sym_count = 0;

int get_symbol(const char *name) {
    for (int i = 0; i < sym_count; i++) {
        if (strcmp(symtab[i].name, name) == 0) {
            return symtab[i].value;
        }
    }
    fprintf(stderr, "Runtime Error: Undefined variable '%s'\n", name);
    return 0;
}

void set_symbol(const char *name, int val) {
    for (int i = 0; i < sym_count; i++) {
        if (strcmp(symtab[i].name, name) == 0) {
            symtab[i].value = val;
            symtab[i].is_defined = 1;
            return;
        }
    }
    if (sym_count < 256) {
        strncpy(symtab[sym_count].name, name, 63);
        symtab[sym_count].value = val;
        symtab[sym_count].is_defined = 1;
        sym_count++;
    }
}
%}

%union {
    int num;
    char *id;
}

%token <num> NUMBER
%token <id> IDENTIFIER
%token ASSIGN PLUS MINUS MULTIPLY DIVIDE LPAREN RPAREN SEMI EOL

%type <num> expression factor

%left PLUS MINUS
%left MULTIPLY DIVIDE

%%

program:
    /* empty */
    | program statement
    ;

statement:
    EOL
    | SEMI
    | IDENTIFIER ASSIGN expression EOL   { set_symbol($1, $3); free($1); }
    | IDENTIFIER ASSIGN expression SEMI  { set_symbol($1, $3); free($1); }
    | expression EOL                     { printf("%d\n", $1); }
    | expression SEMI                    { printf("%d\n", $1); }
    ;

expression:
    expression PLUS expression       { $$ = $1 + $3; }
    | expression MINUS expression    { $$ = $1 - $3; }
    | expression MULTIPLY expression { $$ = $1 * $3; }
    | expression DIVIDE expression   { $$ = ($3 != 0) ? ($1 / $3) : 0; }
    | LPAREN expression RPAREN       { $$ = $2; }
    | factor                         { $$ = $1; }
    ;

factor:
    NUMBER                           { $$ = $1; }
    | IDENTIFIER                     { $$ = get_symbol($1); free($1); }
    ;

%%

void yyerror(const char *s) {
    fprintf(stderr, "Parse error: %s\n", s);
}

int main() {
    return yyparse();
}
