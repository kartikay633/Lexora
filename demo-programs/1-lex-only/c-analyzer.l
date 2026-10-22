%option noyywrap yylineno
%x COMMENT

%{
/*
 * C Lexical Analyzer
 * Prints every token with its line number and class, skips comments,
 * then reports a summary and the table of unique identifiers.
 */
#include <stdio.h>
#include <string.h>

int keywords = 0, identifiers = 0, integers = 0, floats = 0;
int operators = 0, punctuation = 0, strings = 0, comments = 0, directives = 0;

char symbols[100][32];
int symbol_uses[100];
int symbol_count = 0;

void remember(const char *name) {
    for (int i = 0; i < symbol_count; i++) {
        if (strcmp(symbols[i], name) == 0) { symbol_uses[i]++; return; }
    }
    if (symbol_count < 100) {
        strncpy(symbols[symbol_count], name, 31);
        symbols[symbol_count][31] = '\0';
        symbol_uses[symbol_count++] = 1;
    }
}

void show(const char *type) {
    printf("%-5d %-13s %s\n", yylineno, type, yytext);
}
%}

DIGIT    [0-9]
LETTER   [a-zA-Z_]

%%
^[ \t]*#.*                 { directives++; show("DIRECTIVE"); }
"/*"                       { comments++; BEGIN(COMMENT); }
<COMMENT>"*/"              { BEGIN(INITIAL); }
<COMMENT>.|\n              ;
"//".*                     { comments++; }
\"([^"\\\n]|\\.)*\"        { strings++; show("STRING"); }

"int"|"float"|"char"|"double"|"void"|"if"|"else"|"while"|"for"|"return"|"break"|"continue" {
                             keywords++; show("KEYWORD"); }

{LETTER}({LETTER}|{DIGIT})* { identifiers++; remember(yytext); show("IDENTIFIER"); }
{DIGIT}+"."{DIGIT}+        { floats++; show("FLOAT"); }
{DIGIT}+                   { integers++; show("INTEGER"); }

"=="|"!="|"<="|">="|"&&"|"||"|"++"|"--"|"+="|"-=" { operators++; show("OPERATOR"); }
[-+*/%=<>!]                { operators++; show("OPERATOR"); }
[;,(){}]                   { punctuation++; show("PUNCTUATION"); }
[ \t\r\n]+                 ;
.                          { show("UNKNOWN"); }
%%

int main(void) {
    printf("LINE  TOKEN         LEXEME\n");
    printf("--------------------------------------\n");
    yylex();

    printf("\n========== SUMMARY ==========\n");
    printf("Keywords            : %d\n", keywords);
    printf("Identifiers         : %d\n", identifiers);
    printf("Integer constants   : %d\n", integers);
    printf("Float constants     : %d\n", floats);
    printf("Operators           : %d\n", operators);
    printf("Punctuation         : %d\n", punctuation);
    printf("String literals     : %d\n", strings);
    printf("Comments skipped    : %d\n", comments);
    printf("Preprocessor lines  : %d\n", directives);
    printf("Total lines         : %d\n", yylineno - 1);

    printf("\n======= SYMBOL TABLE ========\n");
    printf("%-4s %-15s %s\n", "No.", "Identifier", "Uses");
    for (int i = 0; i < symbol_count; i++) {
        printf("%-4d %-15s %d\n", i + 1, symbols[i], symbol_uses[i]);
    }
    return 0;
}
