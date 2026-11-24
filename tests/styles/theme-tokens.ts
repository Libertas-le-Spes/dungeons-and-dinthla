import { parseColour, type Colour } from "./css-colour";
import { importedFiles, readStyles } from "./style-files";

export interface ThemeContext {
  obsidian: Record<string, string>;
}

interface Rule {
  selector: string;
  declarations: Map<string, string>;
}

function readRules(file: string): Rule[] {
  const css = readStyles(file);
  if (css.includes("@media") || css.includes("@supports")) throw new Error(`The contrast test can't read conditional rules in ${file}`);
  return [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)].map(([, selector, body]) => {
    const declarations = new Map<string, string>();
    for (const [, name, value] of body!.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) declarations.set(name!, value!.trim());
    return { selector: selector!.trim(), declarations };
  });
}

function applies(selector: string): boolean {
  if (selector !== ".dd-tokens") throw new Error(`The contrast test doesn't know the selector ${selector}`);
  return true;
}

function tokenRules(): Rule[] {
  return importedFiles()
    .flatMap(readRules)
    .filter((rule) => rule.declarations.size > 0 && rule.selector.includes(".dd-tokens"));
}

export function tokensFor(context: ThemeContext): (token: string) => Colour {
  const tokens = new Map<string, string>();
  for (const rule of tokenRules()) {
    if (!applies(rule.selector)) continue;
    for (const [name, value] of rule.declarations) tokens.set(name, value);
  }
  const resolve = (value: string): string =>
    value.replace(/var\((--[\w-]+)\)/g, (_whole, name: string) => {
      const own = tokens.get(name);
      if (own !== undefined) return resolve(own);
      const obsidian = context.obsidian[name];
      if (obsidian !== undefined) return resolve(obsidian);
      throw new Error(`Nothing defines ${name}`);
    });
  return (token) => parseColour(resolve(`var(--dd-${token})`));
}
