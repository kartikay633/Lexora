%{
#include <stdio.h>
int kw_count = 0, id_count = 0, op_count = 0, sym_count = 0;
%}
%%
#include<[^>]+>|#include[ ]*<[^>]+> { }
\"[^\"]*\" { }
"main"|"printf"|"scanf" { }
"int"|"float"|"char"|"double"|"void"|"return"|"if"|"else"|"for"|"while"|"do"|"break"|"continue" { kw_count++; }
[+\-*/=%] { op_count++; }
[;(),] { sym_count++; }
"}" { return 0; }
[a-zA-Z_][a-zA-Z0-9_]* { id_count++; }
[0-9]+ { }
[ \t\n]+ { }
. { }
%%
int yywrap(void) { return 1; }
int main(void) {
    yylex();
    printf("Number of Keywords \t= %d\n", kw_count);
    printf("Number of Identifiers \t= %d\n", id_count);
    printf("Number of Operators \t= %d\n", op_count);
    printf("Number of Special Symbols = %d\n", sym_count);
    return 0;
}
