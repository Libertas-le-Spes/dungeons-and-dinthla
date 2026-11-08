import { readFileSync } from "node:fs";
import { parseColour, type Colour } from "./css-colour";

export interface ThemeContext {
  dark: boolean;
  follow: boolean;
  obsidian: Record<string, string>;
}

interface Rule {
  selector: string;
  declarations: Map<string, string>;
}

function readRules(file: string): Rule[] {
  const css = readFileSync(new URL(`../../styles/${file}`, import.meta.url), "utf8");
  return [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)].map(([, selector, body]) => {
    const declarations = new Map<string, string>();
    for (const [, name, value] of body!.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) declarations.set(name!, value!.trim());
    return { selector: selector!.trim(), declarations };
  });
}

function applies(selector: string, { dark, follow }: ThemeContext): boolean {
  const known: Record<string, boolean> = {
    ".dd-root": true,
    ".theme-dark .dd-root": dark,
    "body:not(.dd-follow-theme) .dd-root": !follow,
    ".dd-follow-theme.theme-dark .dd-root": follow && dark,
    ".dd-follow-theme.theme-light .dd-root": follow && !dark,
    ".dd-follow-theme .dd-root": follow,
  };
  const applied = known[selector];
  if (applied === undefined) throw new Error(`The contrast test doesn't know the selector ${selector}`);
  return applied;
}

export function tokensFor(context: ThemeContext): (token: string) => Colour {
  const tokens = new Map<string, string>();
  for (const rule of [...readRules("tokens.css"), ...readRules("follow-theme.css")]) {
    if (!applies(rule.selector, context)) continue;
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
  return (token) => parseColour(resolve(`var(--${token})`));
}
