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

function declaredIn(body: string, property: string): string | null {
  const declared = new RegExp(`(?:^|[\\s;])${property}:\\s*([^;]+);`).exec(body);
  if (declared === null) return null;
  return declared[1]!.trim();
}

function layersOf(body: string): string | null {
  const shorthand = declaredIn(body, "background");
  if (shorthand !== null) return shorthand;
  const colour = declaredIn(body, "background-color");
  const image = declaredIn(body, "background-image");
  if (colour === null) return image;
  if (image === null) return colour;
  return `${image}, ${colour}`;
}

export function backgroundOf(file: string, selector: string): string | null {
  for (const [, ruleSelector, body] of readStyles(file).matchAll(/([^{}]+)\{([^}]*)\}/g)) {
    if (ruleSelector!.trim() !== selector) continue;
    const layers = layersOf(body!);
    if (layers !== null) return layers;
  }
  return null;
}

export function declarationOf(file: string, selector: string, property: string): string | null {
  for (const [, ruleSelector, body] of readStyles(file).matchAll(/([^{}]+)\{([^}]*)\}/g)) {
    if (ruleSelector!.trim() !== selector) continue;
    const value = declaredIn(body!, property);
    if (value !== null) return value;
  }
  return null;
}
