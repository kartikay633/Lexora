%{
#include <stdio.h>
#include <stdlib.h>
int yylex();
void yyerror(const char *s);
%}

%token NUMBER PLUS MINUS MULTIPLY DIVIDE LPAREN RPAREN EOL

%left PLUS MINUS
%left MULTIPLY DIVIDE

%%

program:
    program expression EOL  { printf("%d\n", $2); }
    | /* empty */
    ;

expression:
    expression PLUS expression       { $$ = $1 + $3; }
    | expression MINUS expression    { $$ = $1 - $3; }
    | expression MULTIPLY expression { $$ = $1 * $3; }
    | expression DIVIDE expression   { $$ = $1 / $3; }
    | LPAREN expression RPAREN       { $$ = $2; }
    | NUMBER                         { $$ = $1; }
    ;

%%

void yyerror(const char *s) {
    fprintf(stderr, "Parse error: %s\n", s);
}

int main() {
    return yyparse();
}
