%{
/*
 * Mini-C scanner: turns a small C program into tokens for minic.y.
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "minic.tab.h"
%}

%option noyywrap yylineno

%%
"//".*                          ;
"/*"([^*]|\*+[^*/])*\*+"/"      ;
^[ \t]*#.*                      ;

"int"       { return INT; }
"if"        { return IF; }
"else"      { return ELSE; }
"while"     { return WHILE; }
"for"       { return FOR; }
"return"    { return RETURN; }
"printf"    { return PRINTF; }

"=="        { return EQ; }
"!="        { return NE; }
"<="        { return LE; }
">="        { return GE; }
"&&"        { return AND; }
"||"        { return OR; }
"++"        { return INC; }

[0-9]+                  { yylval.num = atoi(yytext); return NUM; }
[a-zA-Z_][a-zA-Z0-9_]*  { yylval.str = strdup(yytext); return ID; }
\"([^"\\\n]|\\.)*\"     { yylval.str = strdup(yytext); return STRING; }

[-+*/%<>=!;,(){}]       { return yytext[0]; }
[ \t\r\n]+              ;
.                       { fprintf(stderr, "line %d: unexpected character '%s'\n", yylineno, yytext); }
%%
