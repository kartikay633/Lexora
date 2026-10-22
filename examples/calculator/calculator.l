%{
#include "parser.tab.h"
#include <stdlib.h>
%}

%option yylineno

%%
[0-9]+    { yylval = atoi(yytext); return NUMBER; }
"+"       { return PLUS; }
"-"       { return MINUS; }
"*"       { return MULTIPLY; }
"/"       { return DIVIDE; }
"("       { return LPAREN; }
")"       { return RPAREN; }
"\n"      { return EOL; }
[ \t]     { /* skip whitespace */ }
.         { fprintf(stderr, "Unexpected character: %s\n", yytext); }
%%

int yywrap() { return 1; }
