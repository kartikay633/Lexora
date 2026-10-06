%option noyywrap
%{
#include <stdio.h>

int total_matches = 0;
%}

%%
[cC][a-zA-Z]*[tT] {
    /* Print each match directly: no fixed-size storage to overflow. */
    printf("%s\n", yytext);
    total_matches++;
}
[a-zA-Z]+ { /* Skip other alphabetic words, including catapults. */ }
[ \t\r\n]+ { /* Continue across all lines until EOF. */ }
. { }
%%

int main(void) {
    printf("Words starting with C/c and ending with T/t:\n");
    yylex();
    printf("Total number of words = %d\n", total_matches);
    return 0;
}
