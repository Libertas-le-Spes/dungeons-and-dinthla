import { readFileSync } from "node:fs";

const TEXT_COLOUR = /(?:^|[\s;{])(?:-webkit-text-fill-color|color|fill|stroke)\s*:\s*([^;}]+)/g;
const TOKEN = /^var\(--([\w-]+)\)$/;
const INHERITED = new Set(["inherit", "currentColor"]);

export function readStyles(file: string): string {
  return readFileSync(new URL(`../../styles/${file}`, import.meta.url), "utf8");
}

export function importedFiles(): string[] {
  return [...readStyles("index.css").matchAll(/@import "\.\/([\w-]+\.css)";/g)].map(([, file]) => file!);
}

function textColourValues(): string[] {
  const css = importedFiles().map(readStyles).join("\n");
  return [...css.matchAll(TEXT_COLOUR)].map(([, value]) => value!.trim());
}

function tokenOf(value: string): string | null {
  const token = TOKEN.exec(value);
  if (token === null) return null;
  return token[1]!;
}

function isClassified(value: string): boolean {
  if (INHERITED.has(value)) return true;
  return tokenOf(value) !== null;
}

export function textColourTokens(): Set<string> {
  const tokens = textColourValues().map(tokenOf);
  return new Set(tokens.filter((token): token is string => token !== null));
}

export function unclassifiedTextColours(): string[] {
  return textColourValues().filter((value) => !isClassified(value));
}

export function backgroundOf(file: string, selector: string): string | null {
  for (const [, ruleSelector, body] of readStyles(file).matchAll(/([^{}]+)\{([^}]*)\}/g)) {
    if (ruleSelector!.trim() !== selector) continue;
    const background = /(?:^|[\s;])background:\s*([^;]+);/.exec(body!);
    if (background !== null) return background[1]!.trim();
  }
  return null;
}
