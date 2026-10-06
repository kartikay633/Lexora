%option noyywrap
%x COMMENT
%{
#include <stdio.h>
int kw_count = 0, id_count = 0, op_count = 0, sym_count = 0;
%}
%%
^[ \t]*#[^\n]*                    { /* Skip preprocessor directives. */ }
"//"[^\n]*                        { /* Skip line comments. */ }
"/*"                              { BEGIN(COMMENT); }
<COMMENT>"*/"                     { BEGIN(INITIAL); }
<COMMENT>[^*\n]+                  { }
<COMMENT>"*"                      { }
<COMMENT>\n                       { }
<COMMENT><<EOF>>                  { fprintf(stderr, "Unclosed comment\n"); return 0; }
\"([^\"\\\n]|\\.)*\"            { /* Skip quoted strings, including escaped quotes. */ }
\'([^\'\\\n]|\\.)*\'            { /* Skip character literals. */ }
"main"|"printf"|"scanf"            { /* Keep the original counting convention. */ }
"int"|"float"|"char"|"double"|"void"|"return"|"if"|"else"|"for"|"while"|"do"|"break"|"continue" { kw_count++; }
"=="|"!="|"<="|">="|"++"|"--"|"+="|"-="|"*="|"/="|"%="|"&&"|"||" { op_count++; }
[+*/=%<>!&|~-]                    { op_count++; }
[;(),{}\[\]]                      { sym_count++; }
[a-zA-Z_][a-zA-Z0-9_]*            { id_count++; }
([0-9]+(\.[0-9]*)?|\.[0-9]+)([eE][+-]?[0-9]+)? { }
[ \t\r\n]+                       { }
.                                 { }
%%
int main(void) {
    yylex();
    printf("Number of Keywords \t= %d\n", kw_count);
    printf("Number of Identifiers \t= %d\n", id_count);
    printf("Number of Operators \t= %d\n", op_count);
    printf("Number of Special Symbols = %d\n", sym_count);
    return 0;
}
