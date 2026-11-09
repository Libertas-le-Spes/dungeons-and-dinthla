import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FileSystem } from "typescript/unstable/fs";
import { SourceScanner } from "./source-scanner";

const ROOT = fileURLToPath(new URL("../..", import.meta.url)).replace(/\/$/, "");
const SOURCE_FOLDER = `${ROOT}/src/`;
const PROJECT = `${ROOT}/tsconfig.json`;
const SAMPLE_FOLDER = `${ROOT}/tests/fence/scanned-samples`;
const SAMPLE_PROJECT = `${SAMPLE_FOLDER}/tsconfig.json`;
const GATEKEEPER_FOLDER = "fence/";
const ALLOWED = ["fence/gatekeeper.ts", "fence/fenced-files.ts", "fence/fenced-file-actions.ts", "fence/folder-choices.ts", "fence/vault-settings.ts"];

const REACHING_SAMPLES = [
  "this.app.vault.read(file);",
  "const files = app.vault;",
  "vault.adapter.write(path, text);",
  "app.fileManager.trashFile(file);",
  "app.metadataCache.getCache(path);",
  'app["vault"].read(file);',
  "app?.vault;",
  "const { vault } = app;",
  "const { vault: files } = app;",
  'const { ["vault"]: files } = app;',
  "const { [key]: files } = app;",
  "const read = ({ vault }: App) => vault;",
  "app . vault;",
  'Reflect.get(app, "vault");',
  'app["va" + "ult"];',
  "app[`va${letters}`];",
  "app[k];",
  'import type { App } from "obsidian";\nexport const files = (app: App, key: "vault") => app[key];',
  'import type { TFile } from "obsidian";\nexport const files = (file: TFile, key: keyof TFile) => file[key];',
  "export function get<T, K extends keyof T>(value: T, key: K) {\n  return value[key];\n}",
];

const WRITING_SAMPLES = [
  'activeEditor.editor.replaceRange("", from, to);',
  'editor.setValue("");',
  'view.setViewData("", false);',
  "view.save();",
  "const text = view.data;",
  "view.requestSave();",
  'editor.replaceSelection("");',
  "const { replaceRange } = editor;",
  'import type { Editor } from "obsidian";\nexport const clear = (editor: Editor) => editor.setValue("");',
  'import type { MarkdownView } from "obsidian";\nexport const keep = (view: MarkdownView) => view.save();',
  'import type { MarkdownView } from "obsidian";\nexport const saved = (view: MarkdownView) => view.data;',
  'import type { Editor } from "obsidian";\nexport const change = (editor: Editor, key: "replaceRange") => editor[key];',
];

const HARMLESS_SAMPLES = [
  'import type { TextComponent } from "obsidian";\nexport const name = (text: TextComponent) => text.setValue("Pale Moon");',
  'export const seen = (counts: Map<string, number>) => counts.set("Mira", 1);',
  "export const line = (lines: string[], index: number) => lines[index];",
  "export const word = (words: Record<string, string>, key: string) => words[key];",
  'export const match = (pattern: RegExp) => pattern.exec("Mira");',
  "export class Ledger {\n  save(): void {}\n  write(): void {\n    this.save();\n  }\n}",
  'import type { Editor } from "obsidian";\nexport const text = (editor: Editor) => editor.getValue();',
];

const SAMPLES = [...REACHING_SAMPLES, ...WRITING_SAMPLES, ...HARMLESS_SAMPLES];

function samplePath(index: number): string {
  return `${SAMPLE_FOLDER}/sample-${index}.ts`;
}

function sampleFiles(): FileSystem {
  const files = new Map<string, string>(SAMPLES.map((sample, index) => [samplePath(index), sample]));
  const names = SAMPLES.map((_sample, index) => `sample-${index}.ts`);
  files.set(SAMPLE_PROJECT, JSON.stringify({ extends: "../../../tsconfig.json", files: names, include: [] }));
  return {
    readFile: (path) => files.get(path),
    fileExists: (path) => {
      if (files.has(path)) return true;
      return undefined;
    },
    directoryExists: (path) => {
      if (path === SAMPLE_FOLDER) return true;
      return undefined;
    },
    getAccessibleEntries: (path) => {
      if (path === SAMPLE_FOLDER) return { files: [...names, "tsconfig.json"], directories: [] };
      return undefined;
    },
  };
}

function sourceFiles(): string[] {
  const all = readdirSync(SOURCE_FOLDER, { recursive: true, encoding: "utf8" });
  return all.filter((path) => path.endsWith(".ts")).map((path) => path.split("\\").join("/"));
}

function isAllowed(path: string): boolean {
  return ALLOWED.includes(path.slice(SOURCE_FOLDER.length));
}

function isNeverAllowed(): boolean {
  return false;
}

let scanner: SourceScanner;

beforeAll(() => {
  scanner = new SourceScanner(ROOT, sampleFiles());
});

afterAll(() => {
  scanner.close();
});

function sampleBreaches(sample: string): string[] {
  return scanner.breaches(SAMPLE_PROJECT, [samplePath(SAMPLES.indexOf(sample))], isNeverAllowed);
}

describe("the vault fence", () => {
  it("reads the plugin's whole source, the entry point included", () => {
    const files = sourceFiles();
    expect(files).toContain("main.ts");
    expect(files).toContain("fence/gatekeeper.ts");
    expect(files.length).toBeGreaterThan(100);
  });

  it("lets only the gatekeeper's allowed files reach the vault, its files or Obsidian's file metadata, and none write through an editor or view", () => {
    const paths = sourceFiles().map((path) => `${SOURCE_FOLDER}${path}`);
    expect(scanner.breaches(PROJECT, paths, isAllowed)).toEqual([]);
  });

  it("allows only files in the gatekeeper's own folder, each of which still needs it", () => {
    const files = sourceFiles();
    for (const allowed of ALLOWED) {
      expect(allowed.startsWith(GATEKEEPER_FOLDER)).toBe(true);
      expect(files).toContain(allowed);
      expect(scanner.breaches(PROJECT, [`${SOURCE_FOLDER}${allowed}`], isNeverAllowed)).not.toEqual([]);
    }
  });

  it.each(REACHING_SAMPLES)("would catch reaching the vault with %s", (sample) => {
    expect(sampleBreaches(sample)).not.toEqual([]);
  });

  it.each(WRITING_SAMPLES)("would catch writing through an editor or view with %s", (sample) => {
    expect(sampleBreaches(sample)).not.toEqual([]);
  });

  it.each(HARMLESS_SAMPLES)("lets %s pass, since it reaches neither the vault nor an editor's text", (sample) => {
    expect(sampleBreaches(sample)).toEqual([]);
  });
});
