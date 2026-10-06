%{
#include <stdio.h>
#include <string.h>

char stored_tokens[150][100];
int total_matches = 0;
%}

%%
[cC][a-zA-Z]*[tT] {
    strcpy(stored_tokens[total_matches], yytext);
    total_matches++;
}
[a-zA-Z]+ { }
[ \t]+   { }
\n       { return 0; }
.        { }
%%

int yywrap() {
    return 1;
}

int main() {
    yylex();
    printf("Words starting with C/c and ending with T/t:\n");
    int idx = 0;
    while (idx < total_matches) {
        printf("%s\n", stored_tokens[idx]);
        idx++;
    }
    printf("Total number of words = %d\n", total_matches);
    return 0;
}
