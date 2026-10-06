export const starter = `%option noyywrap
%{
#include <stdio.h>
%}
%%
[0-9]+       { printf("NUMBER  %s\\n", yytext); }
[a-zA-Z]+    { printf("WORD    %s\\n", yytext); }
[ \\t\\r\\n]+  ;
.            { printf("SYMBOL  %s\\n", yytext); }
%%
int main(void) { yylex(); return 0; }
`;
export async function readUploads(list) {
  return Promise.all(Array.from(list).map(async file => {
    if (!/\.(l|y|txt|in)$/i.test(file.name)) throw new Error(`${file.name}: use .l, .y, .txt, or .in files.`);
    if (file.size > 102400) throw new Error(`${file.name} exceeds the 100 KB limit.`);
    const content = await file.text();
    if (content.includes('\0')) throw new Error(`${file.name} is not a text file.`);
    return { id: crypto.randomUUID(), name: file.name.replace(/\.[^.]+$/, ext => ext.toLowerCase()), content };
  }));
}
export function download(name, content) {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
