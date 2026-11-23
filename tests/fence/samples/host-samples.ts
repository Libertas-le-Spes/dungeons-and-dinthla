export const HOST_SAMPLES = [
  'import type { TFile } from "obsidian";\nexport const name = (file: TFile) => file.basename;',
  'import { Notice } from "obsidian";\nexport const say = (words: string) => new Notice(words);',
  "export const make = (el: HTMLElement) => el.createDiv();",
  "export const clear = (el: HTMLElement) => el.empty();",
  "export const where = () => activeWindow;",
  'export const has = (list: string[]) => list.contains("a");',
  "export declare const note: import(\"obsidian\").TFile;",
  'import type { EditorView } from "@codemirror/view";\nexport const keep = (view: EditorView) => view;',
];

export interface ReachSample {
  readonly route: string;
  readonly text: string;
}

export const HOST_TYPE_SAMPLES: readonly ReachSample[] = [
  { route: "a list", text: 'import type { TFile } from "obsidian";\ndeclare const files: TFile[];\nexport const kept = files;' },
  { route: "a library type's argument", text: 'import type { TFile } from "obsidian";\ndeclare const files: Set<TFile>;\nexport const kept = files;' },
  { route: "a property", text: 'import type { TFile } from "obsidian";\ninterface Held {\n  file: TFile | null;\n}\ndeclare const held: Held;\nexport const kept = held;' },
  { route: "a function's parameter", text: 'import type { TFile } from "obsidian";\ntype Reader = (file: TFile) => string;\ndeclare const read: Reader;\nexport const kept = read;' },
  { route: "a function's return", text: 'import type { TFile } from "obsidian";\ndeclare const make: () => TFile;\nexport const kept = make;' },
  { route: "an index", text: 'import type { TFile } from "obsidian";\ndeclare const byName: { [name: string]: TFile };\nexport const kept = byName;' },
  { route: "a Pick of an Obsidian type", text: 'import type { Vault } from "obsidian";\ndeclare const reads: Pick<Vault, "configDir">;\nexport const kept = reads;' },
  { route: "a Partial of an Obsidian type", text: 'import type { TFile } from "obsidian";\ndeclare const some: Partial<TFile>;\nexport const kept = some;' },
];

export const NEUTRAL_SAMPLES = [
  "export const name = (text: string) => text.trim();",
  "export const count = (list: string[]) => list.length;",
  "interface Mine {\n  basename: string;\n}\nexport const name = (note: Mine) => note.basename;",
  "export const top = (el: HTMLElement) => el.offsetTop;",
  "export const wait = (found: Promise<Map<string, number>>) => found;",
  "type Icon = string;\ndeclare const icon: Icon;\nexport const kept = icon;",
];
