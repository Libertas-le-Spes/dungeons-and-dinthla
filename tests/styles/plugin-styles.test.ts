import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const PLUGIN_FOLDER = new URL("../../styles/plugin/", import.meta.url);
const THEME = new URL("../../styles/obsidian/theme.css", import.meta.url);
const PLUGIN_PREFIX = "dd-";
const SET_BY_CODE = ["dd-campaign-picture"];

const OBSIDIAN_CLASSES_STILL_STYLED: Record<string, string[]> = {
  "campaign-background.css": ["cm-scroller", "markdown-preview-view", "markdown-reading-view", "markdown-source-view"],
  "campaign.css": ["is-floating-nav", "is-hidden-nav", "is-phone"],
  "dialog.css": ["setting-item-control"],
  "new-names.css": ["setting-item-description"],
  "session-notes.css": ["mod-warning"],
};

interface PluginSheet {
  readonly name: string;
  readonly text: string;
}

function withoutComments(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, "");
}

function pluginSheets(): PluginSheet[] {
  const sheets: PluginSheet[] = [];
  for (const name of readdirSync(PLUGIN_FOLDER).sort()) sheets.push({ name, text: withoutComments(readFileSync(new URL(name, PLUGIN_FOLDER), "utf8")) });
  return sheets;
}

function variablesUsedIn(text: string): string[] {
  const used: string[] = [];
  for (const [, name] of text.matchAll(/var\(--([\w-]+)/g)) used.push(name!);
  return used;
}

function variablesDefinedIn(text: string): string[] {
  const defined: string[] = [];
  for (const [, name] of text.matchAll(/(?:^|[\s;{])--([\w-]+)\s*:/g)) defined.push(name!);
  return defined;
}

function classesIn(text: string): Set<string> {
  const classes = new Set<string>();
  for (const [, selector] of text.matchAll(/([^{}]+)\{/g)) {
    if (selector!.trim().startsWith("@")) continue;
    for (const [, name] of selector!.matchAll(/\.([a-zA-Z][\w-]*)/g)) classes.add(name!);
  }
  return classes;
}

function otherClassesBySheet(): Record<string, string[]> {
  const found: Record<string, string[]> = {};
  for (const sheet of pluginSheets()) {
    const other: string[] = [];
    for (const name of classesIn(sheet.text)) {
      if (!name.startsWith(PLUGIN_PREFIX)) other.push(name);
    }
    if (other.length > 0) found[sheet.name] = other.sort();
  }
  return found;
}

describe("the plugin's own styles", () => {
  it("use only the plugin's own variables, never Obsidian's", () => {
    const foreign: string[] = [];
    for (const sheet of pluginSheets()) {
      for (const name of variablesUsedIn(sheet.text)) {
        if (!name.startsWith(PLUGIN_PREFIX)) foreign.push(`${sheet.name}: --${name}`);
      }
    }
    expect(foreign).toEqual([]);
  });

  it("style only the plugin's own classes, but for the Obsidian pieces still listed, which may only leave", () => {
    expect(otherClassesBySheet()).toEqual(OBSIDIAN_CLASSES_STILL_STYLED);
  });

  it("use only variables the plugin's styles or Obsidian's theme mapping define, or the plugin's code sets", () => {
    const defined = new Set<string>([...variablesDefinedIn(readFileSync(THEME, "utf8")), ...SET_BY_CODE]);
    for (const sheet of pluginSheets()) for (const name of variablesDefinedIn(sheet.text)) defined.add(name);
    const undefinedUses: string[] = [];
    for (const sheet of pluginSheets()) {
      for (const name of variablesUsedIn(sheet.text)) {
        if (!defined.has(name)) undefinedUses.push(`${sheet.name}: --${name}`);
      }
    }
    expect(undefinedUses).toEqual([]);
  });
});

describe("Obsidian's theme mapping", () => {
  it("only maps one plugin variable to one of Obsidian's per line", () => {
    const lines = readFileSync(THEME, "utf8").trim().split("\n");
    expect(lines.at(0)).toBe(".dd-tokens {");
    expect(lines.at(-1)).toBe("}");
    for (const line of lines.slice(1, -1)) expect(line).toMatch(/^ {2}--dd-[\w-]+: var\(--(?!dd-)[\w-]+\);$/);
  });
});
