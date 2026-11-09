import { readFileSync } from "node:fs";

export function readStyles(file: string): string {
  return readFileSync(new URL(`../../styles/${file}`, import.meta.url), "utf8");
}

export function importedFiles(): string[] {
  return [...readStyles("index.css").matchAll(/@import "\.\/([\w-]+\.css)";/g)].map(([, file]) => file!);
}

export function textColourTokens(): Set<string> {
  const css = importedFiles().map(readStyles).join("\n");
  return new Set([...css.matchAll(/(?:^|[\s;{])color:\s*var\(--([\w-]+)\)/g)].map(([, token]) => token!));
}

export function backgroundOf(file: string, selector: string): string | null {
  for (const [, ruleSelector, body] of readStyles(file).matchAll(/([^{}]+)\{([^}]*)\}/g)) {
    if (ruleSelector!.trim() !== selector) continue;
    const background = /(?:^|[\s;])background:\s*([^;]+);/.exec(body!);
    if (background !== null) return background[1]!.trim();
  }
  return null;
}
