%{
#include "parser.tab.h"
#include <stdlib.h>
#include <string.h>

void yyerror(const char *s);
%}

%option yylineno

%%
[0-9]+                 { yylval.num = atoi(yytext); return NUMBER; }
[a-zA-Z_][a-zA-Z0-9_]* { yylval.id = strdup(yytext); return IDENTIFIER; }
"="                    { return ASSIGN; }
"+"                    { return PLUS; }
"-"                    { return MINUS; }
"*"                    { return MULTIPLY; }
"/"                    { return DIVIDE; }
"("                    { return LPAREN; }
")"                    { return RPAREN; }
";"                    { return SEMI; }
"\n"                   { return EOL; }
[ \t\r]                { /* ignore whitespace */ }
.                      { fprintf(stderr, "Unexpected character: %s\n", yytext); }
%%

int yywrap() { return 1; }
