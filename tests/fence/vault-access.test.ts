import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FileSystem } from "typescript/unstable/fs";
import { PLUGIN_BUNDLE } from "../../scripts/bundle-options.ts";
import { SourceScanner, type Allowances } from "./source-scanner";

const ROOT = fileURLToPath(new URL("../..", import.meta.url)).replace(/\/$/, "");
const SOURCE_FOLDER = `${ROOT}/src/`;
const VIRTUAL_FOLDER = `${ROOT}/tests/fence/scanned`;
const SAMPLE_FOLDER = `${VIRTUAL_FOLDER}/samples`;
const SAMPLE_PROJECT = `${SAMPLE_FOLDER}/tsconfig.json`;
const BUNDLED_PROJECT = `${VIRTUAL_FOLDER}/bundled/tsconfig.json`;
const PLANTED_FOLDER = `${VIRTUAL_FOLDER}/planted`;
const GATEKEEPER_FOLDER = "fence/";
const PARSED_DATA = ["settings/draft-record.ts"];
const ALLOWED = ["fence/gatekeeper.ts", "fence/fenced-files.ts", "fence/fenced-file-actions.ts", "fence/folder-choices.ts", "fence/vault-settings.ts"];
const EDITOR_TEXT_READERS = ["campaign/editor-text.ts"];
const BASES_READERS = ["characters/characters-view.ts"];
const CODE_MIRROR_READERS = ["editor/marker-decorations.ts"];
const LOOSE_CASTERS = ["fence/fenced-metadata.ts", "interface/campaign-view-registered.ts", "interface/one-campaign-tab.ts", "interface/seen-tab.ts"];
const HIDDEN_CODE = [".js", ".mjs", ".cjs", ".mts", ".cts"];
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
  "Object.values(app);",
  "Object.entries(app);",
  'Object.getOwnPropertyDescriptor(app, "vault");',
  "Object.getOwnPropertyDescriptors(app);",
  "Object.assign({}, app);",
  "const copy = { ...app };",
  "for (const key in app) read(key);",
  'import type { App } from "obsidian";\nexport const parts = (app: App) => Object.values(app);',
  'import type { TFile } from "obsidian";\nexport const copy = (file: TFile) => ({ ...file });',
  'import type { App } from "obsidian";\nexport function keys(app: App) {\n  const all: string[] = [];\n  for (const key in app) all.push(key);\n  return all;\n}',
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

const READING_SAMPLES = [
  'import type { Editor } from "obsidian";\nexport const text = (editor: Editor) => editor.getValue();',
  "const line = editor.getLine(0);",
  'import type { Editor, EditorPosition } from "obsidian";\nexport const part = (editor: Editor, from: EditorPosition, to: EditorPosition) => editor.getRange(from, to);',
  'import type { Editor } from "obsidian";\nexport const picked = (editor: Editor) => editor.getSelection();',
  'import type { MarkdownView } from "obsidian";\nexport const text = (view: MarkdownView) => view.getViewData();',
  'import type { MarkdownFileInfo } from "obsidian";\nexport const text = (info: MarkdownFileInfo) => info.editor?.getValue();',
  'import type { Editor } from "obsidian";\nexport const line = (editor: Editor) => editor["getLine"](0);',
  "const { getValue } = editor;",
];

const FORBIDDEN_SAMPLES = [
  "MarkdownRenderer.render(app, text, el, path, owner);",
  'import { MarkdownRenderer } from "obsidian";\nexport const renderer = MarkdownRenderer;',
  "renderer.renderMarkdown(text, el, path, owner);",
  'app.commands.executeCommandById("editor:save-file");',
  'app["commands"].list();',
  "runner.executeCommandById(id);",
  'document.execCommand("insertText", false, text);',
  'new Function("return this")();',
  'Function("return this")();',
  "eval(text);",
  'globalThis["eval"](text);',
  "const { eval: run } = globalThis;",
  'import * as obsidian from "obsidian";\nexport const pick = (key: "Notice") => obsidian[key];',
  'app.workspace.openLinkText("Private/Primary", "");',
  'import type { Workspace } from "obsidian";\nexport const follow = (workspace: Workspace) => workspace["openLinkText"]("Primary", "");',
  "const { openLinkText } = app.workspace;",
];

const FILE_TREE_SAMPLES = [
  'import type { TFile } from "obsidian";\nexport const folder = (file: TFile) => file.parent;',
  'import type { TFolder } from "obsidian";\nexport const inside = (folder: TFolder) => folder.children;',
  'import type { TAbstractFile } from "obsidian";\nexport const above = (file: TAbstractFile) => file.parent?.parent;',
  "const folder = file.parent;",
  'import type { TFolder } from "obsidian";\nexport const inside = (folder: TFolder) => folder["children"];',
  "const { parent } = file;",
];

const CAST_SAMPLES = [
  'import type { App } from "obsidian";\nexport const files = (app: App) => (app as unknown as Record<string, object>)[["va", "ult"].join("")];',
  'import type { App } from "obsidian";\nexport const files = (app: App, key: string) => (<Record<string, object>>(<unknown>app))[key];',
  'import type { App } from "obsidian";\nexport function files(app: App, key: string) {\n  const words = app as unknown as Record<string, object>;\n  return words[key];\n}',
  'import type { App } from "obsidian";\nexport function files(app: App, key: string) {\n  const loose: unknown = app;\n  return (loose as Record<string, object>)[key];\n}',
  'import type { App } from "obsidian";\nexport function files(app: App, key: string) {\n  const loose = app as any;\n  const words: Record<string, object> = loose;\n  return words[key];\n}',
];

const LOOSE_CAST_SAMPLES = [
  'import type { App } from "obsidian";\nexport const registry = (app: App) => (app as unknown as { viewRegistry: object }).viewRegistry;',
  'import type { App } from "obsidian";\nexport const registry = (app: App) => (app as any).viewRegistry;',
  'import type { App } from "obsidian";\nexport const registry = (app: App) => (<any>app).viewRegistry;',
  'import type { App } from "obsidian";\nexport function registry(app: App) {\n  const loose: unknown = app;\n  return (loose as { viewRegistry: object }).viewRegistry;\n}',
];

const OTHER_PLUGIN_SAMPLES = [
  'import type { App } from "obsidian";\nexport const found = (app: App) => "plugins" in app;',
  'import type { App } from "obsidian";\nexport function load(app: App, plugins: { getPlugin(id: string): { api: { io: { load(path: string): unknown } } } }) {\n  return plugins.getPlugin("dataview").api.io.load("Private/Primary.md");\n}',
  'export const found = "app" in window;',
  "const list = app.plugins.enabledPlugins;",
  'const core = app["internalPlugins"];',
  "const { plugins } = app;",
  'const { ["getPlugin"]: pick } = registry;',
  'export const found = (key: string) => key in globalThis;',
  'import type { App } from "obsidian";\nexport const found = (app: App, key: string) => key in app;',
  "export const found = (key: string, loose: unknown) => typeof loose === \"object\" && loose !== null && key in loose;",
  "export const found = (key: string, loose: object) => key in loose;",
  "export const found = <T extends object>(key: string, loose: T) => key in loose;",
  "export const found = (key: string) => key in activeWindow;",
];

const GLOBAL_APP_SAMPLES = [
  "export const reached = window.app;",
  'export const reached = globalThis["app"];',
  "export const reached = activeWindow.app;",
  "export const reached = (window as any).app;",
  "export const reached = (globalThis as unknown as { app: object }).app;",
  "export const { app } = window;",
  'export const { ["app"]: reached } = self;',
  "export const reached = (holder: Window) => holder.app;",
  "export const reached = document.defaultView?.app;",
];

const NOTE_READING_SAMPLES = [
  'import type { MarkdownPostProcessorContext } from "obsidian";\nexport const lines = (el: HTMLElement, context: MarkdownPostProcessorContext) => context.getSectionInfo(el)?.text;',
  'import type { MarkdownPostProcessorContext } from "obsidian";\nexport const properties = (context: MarkdownPostProcessorContext) => context.frontmatter;',
  'import type { MarkdownView } from "obsidian";\nexport const text = (view: MarkdownView) => view.currentMode.get();',
  'import type { MarkdownView } from "obsidian";\nexport const text = (view: MarkdownView) => view.previewMode.get();',
  'import type { MarkdownSubView } from "obsidian";\nexport const text = (mode: MarkdownSubView) => mode.get();',
  'import type { MarkdownPreviewView } from "obsidian";\nexport const text = (mode: MarkdownPreviewView) => mode["get"]();',
  'import type { BasesEntry, BasesPropertyId } from "obsidian";\nexport const value = (entry: BasesEntry, id: BasesPropertyId) => entry.getValue(id);',
  'import type { BasesView } from "obsidian";\nexport const files = (view: BasesView) => view.data.data.map((entry) => entry.file);',
  'import type { BasesQueryResult } from "obsidian";\nexport const groups = (result: BasesQueryResult) => result.groupedData;',
  'import type { BasesEntryGroup } from "obsidian";\nexport const listed = (group: BasesEntryGroup) => group.entries;',
  "const { frontmatter } = context;",
  "const { getSectionInfo } = context;",
  "const { previewMode } = view;",
];

const VIEW_TEXT_SAMPLES = [
  'import type { MarkdownView } from "obsidian";\nexport const text = (view: MarkdownView) => view.contentEl.innerText;',
  'import type { MarkdownView } from "obsidian";\nexport const text = (view: MarkdownView) => view.containerEl.textContent;',
  'import type { WorkspaceLeaf } from "obsidian";\nexport const text = (leaf: WorkspaceLeaf) => leaf.view.containerEl.textContent;',
  'import type { MarkdownView } from "obsidian";\nexport const text = (view: MarkdownView) => view.previewMode.containerEl.outerText;',
  'export const text = (view: any) => view.contentEl.innerText;',
  'import type { ItemView } from "obsidian";\nexport const text = (view: ItemView) => (view.contentEl).textContent;',
];

const CODE_MIRROR_SAMPLES = [
  'import type { EditorState } from "@codemirror/state";\nexport const text = (state: EditorState) => state.doc.toString();',
  'import type { Text } from "@codemirror/state";\nexport const line = (doc: Text) => doc.line(1).text;',
  'import type { EditorView } from "@codemirror/view";\nexport const text = (view: EditorView) => view.state.sliceDoc();',
  'import { EditorView } from "@codemirror/view";\nexport const listen = EditorView.updateListener.of((update) => update.state);',
  'import { EditorState } from "@codemirror/state";\nexport const filter = EditorState.transactionFilter.of((transaction) => transaction);',
  'import { EditorState } from "@codemirror/state";\nexport const filter = EditorState.changeFilter.of(() => true);',
  'import { EditorView } from "@codemirror/view";\nexport const typed = EditorView.inputHandler.of(() => false);',
  'import { editorEditorField } from "obsidian";\nexport const field = editorEditorField;',
  'import { editorInfoField } from "obsidian";\nexport const field = editorInfoField;',
  "export const text = (editor: any) => editor.cm.state.doc.toString();",
  "export const text = (state: unknown) => (state as { doc: { toString(): string } }).doc.toString();",
  'export { EditorView } from "@codemirror/view";',
  'import type { EditorState } from "@codemirror/state";\nexport const text = (state: EditorState) => state["doc"];',
  "const { doc } = state;",
  'export const text = (view: import("@codemirror/view").EditorView) => view.state.sliceDoc();',
];

const CONSTRUCTOR_SAMPLES = [
  '(() => 0).constructor("return this")();',
  'export const make = (run: () => void) => run["constructor"];',
  "export const make = (run: () => void) => {\n  const { constructor: maker } = run;\n  return maker;\n};",
  'export const make = (run: () => void) => {\n  const { ["constructor"]: maker } = run;\n  return maker;\n};',
];

const HARMLESS_SAMPLES = [
  "export class Purse {\n  constructor(readonly gold: number) {}\n}",
  "export const name = (value: string | number) => value as string;",
  'import type { TextComponent } from "obsidian";\nexport const name = (text: TextComponent) => text.setValue("Pale Moon");',
  'import type { TextComponent } from "obsidian";\nexport const name = (text: TextComponent) => text.getValue();',
  'export const seen = (counts: Map<string, number>) => counts.set("Mira", 1);',
  "export const line = (lines: string[], index: number) => lines[index];",
  "export const word = (words: Record<string, string>, key: string) => words[key];",
  'export const word = (words: Map<string, string>, key: string) => (words as ReadonlyMap<string, string>).get(key);',
  'export const match = (pattern: RegExp) => pattern.exec("Mira");',
  "export class Ledger {\n  save(): void {}\n  write(): void {\n    this.save();\n  }\n}",
  'export class Shelf {\n  parent = "Mira";\n  owner(): string {\n    return this.parent;\n  }\n}',
  "export const first = (list: HTMLElement) => list.children[0];",
  "export const counts = (byName: Record<string, number>) => Object.entries(byName);",
  "export const merged = (first: { name: string }, second: { level: number }) => ({ ...first, ...second });",
  'export const hasLevel = (sheet: { level: number } | { name: string }) => "level" in sheet;',
  'export const level = (saved: object) => "level" in saved && typeof saved.level === "number";',
  'import type { CachedMetadata } from "obsidian";\nexport const properties = (cache: CachedMetadata) => cache.frontmatter;',
  'export const level = (levels: Map<string, number>) => levels.get("Mira");',
  'export const listed = (levels: Map<string, number>) => [...levels.entries()];',
  'import { ItemView } from "obsidian";\nexport class Ledger extends ItemView {\n  getViewType(): string {\n    return "ledger";\n  }\n  getDisplayText(): string {\n    return this.contentEl.textContent;\n  }\n}',
  "export const text = (box: HTMLElement) => box.textContent;",
  "export const page = (box: HTMLElement) => box.doc.title;",
  'export class Tab {\n  constructor(readonly app: { name: string }) {}\n  name(): string {\n    return this.app.name;\n  }\n}',
];

const SAMPLES = [...REACHING_SAMPLES, ...WRITING_SAMPLES, ...READING_SAMPLES, ...FORBIDDEN_SAMPLES, ...FILE_TREE_SAMPLES, ...CAST_SAMPLES, ...LOOSE_CAST_SAMPLES, ...OTHER_PLUGIN_SAMPLES, ...GLOBAL_APP_SAMPLES, ...NOTE_READING_SAMPLES, ...VIEW_TEXT_SAMPLES, ...CODE_MIRROR_SAMPLES, ...CONSTRUCTOR_SAMPLES, ...HARMLESS_SAMPLES];

interface Planted {
  name: string;
  files: Record<string, string>;
}

const VAULT_READER = 'import type { App } from "obsidian";\nexport const files = (app: App) => app.vault;\n';

const VAULT_READER_JS = "export const files = (app) => app.vault;\n";

const PLANTED: Planted[] = [
  { name: "mts", files: { "src/main.ts": 'export { files } from "./reader.mts";\n', "src/reader.mts": VAULT_READER } },
  {
    name: "js",
    files: { "src/main.ts": 'export { files } from "./reader";\n', "src/reader.js": VAULT_READER_JS, "src/reader.d.ts": "export declare const files: unknown;\n" },
  },
  { name: "outside", files: { "src/main.ts": 'export { files } from "../lib/reader";\n', "lib/reader.ts": VAULT_READER } },
  { name: "js-outside", files: { "src/main.ts": 'export { files } from "../lib/reader";\n', "lib/reader.js": VAULT_READER_JS } },
  {
    name: "declared-outside",
    files: { "src/main.ts": 'export { files } from "../lib/reader";\n', "lib/reader.js": VAULT_READER_JS, "lib/reader.d.ts": "export declare const files: unknown;\n" },
  },
];

function samplePath(index: number): string {
  return `${SAMPLE_FOLDER}/sample-${index}.ts`;
}

function plantedFolder(planted: Planted): string {
  return `${PLANTED_FOLDER}/${planted.name}`;
}

function plantedProject(planted: Planted): string {
  return `${plantedFolder(planted)}/tsconfig.json`;
}

function entryProject(rootFromProject: string, entry: string): string {
  return JSON.stringify({ extends: `${rootFromProject}/tsconfig.json`, compilerOptions: { allowJs: true }, files: [entry], include: [] });
}

function bundleEntry(): string {
  const entries = PLUGIN_BUNDLE.entryPoints;
  if (!Array.isArray(entries) || entries.length !== 1) throw new Error("The plugin bundle needs exactly one entry point.");
  const [entry] = entries;
  if (typeof entry !== "string") throw new Error("The plugin bundle's entry point needs to be a path.");
  return entry;
}

function virtualFiles(): Map<string, string> {
  const files = new Map<string, string>(SAMPLES.map((sample, index) => [samplePath(index), sample]));
  const names = SAMPLES.map((_sample, index) => `sample-${index}.ts`);
  files.set(SAMPLE_PROJECT, JSON.stringify({ extends: "../../../../tsconfig.json", files: names, include: [] }));
  files.set(BUNDLED_PROJECT, entryProject("../../../..", `../../../../${bundleEntry()}`));
  for (const planted of PLANTED) {
    files.set(plantedProject(planted), entryProject("../../../../..", "src/main.ts"));
    for (const [path, text] of Object.entries(planted.files)) files.set(`${plantedFolder(planted)}/${path}`, text);
  }
  return files;
}

function entriesIn(files: Map<string, string>, folder: string): { files: string[]; directories: string[] } {
  const inside = [...files.keys()].filter((path) => path.startsWith(`${folder}/`)).map((path) => path.slice(folder.length + 1));
  const direct = inside.filter((path) => !path.includes("/"));
  const directories = inside.filter((path) => path.includes("/")).map((path) => path.slice(0, path.indexOf("/")));
  return { files: direct, directories: [...new Set(directories)] };
}

function scannedFileSystem(): FileSystem {
  const files = virtualFiles();
  const isVirtual = (path: string) => path === VIRTUAL_FOLDER || path.startsWith(`${VIRTUAL_FOLDER}/`);
  return {
    readFile: (path) => files.get(path),
    fileExists: (path) => {
      if (files.has(path)) return true;
      if (isVirtual(path)) return false;
      return undefined;
    },
    directoryExists: (path) => {
      if (isVirtual(path)) return [...files.keys()].some((file) => file.startsWith(`${path}/`));
      return undefined;
    },
    getAccessibleEntries: (path) => {
      if (isVirtual(path)) return entriesIn(files, path);
      return undefined;
    },
  };
}

function sourceListing(): string[] {
  const all = readdirSync(SOURCE_FOLDER, { recursive: true, encoding: "utf8", withFileTypes: true });
  return all.filter((entry) => entry.isFile()).map((entry) => `${entry.parentPath}/${entry.name}`.split("\\").join("/").replace(/\/+/g, "/"));
}

function plantedListing(planted: Planted): string[] {
  return Object.keys(planted.files).filter((path) => path.startsWith("src/")).map((path) => `${plantedFolder(planted)}/${path}`);
}

function hiddenCodeIn(listing: string[]): string[] {
  return listing.filter((path) => HIDDEN_CODE.some((ending) => path.endsWith(ending))).map((path) => `${path} is code under src that the scan can't read as TypeScript`);
}

function isDeclaration(path: string): boolean {
  return path.endsWith(".d.ts");
}

function isPlainTypeScript(path: string): boolean {
  return path.endsWith(".ts") && !isDeclaration(path) && !HIDDEN_CODE.some((ending) => path.endsWith(ending));
}

function unscannableIn(loaded: string[]): string[] {
  return loaded.filter((path) => !isPlainTypeScript(path)).map((path) => `${path} is loaded from the entry point but isn't a plain TypeScript file`);
}

function isNeverAllowed(): boolean {
  return false;
}

const NOTHING_ALLOWED: Allowances = {
  vault: isNeverAllowed,
  keyReading: isNeverAllowed,
  editorReading: isNeverAllowed,
  fileTree: isNeverAllowed,
  looseCasts: isNeverAllowed,
  noteReading: isNeverAllowed,
  codeMirror: isNeverAllowed,
};

function isAlwaysAllowed(): boolean {
  return true;
}

const LOOSE_CASTS_ALLOWED: Allowances = { ...NOTHING_ALLOWED, looseCasts: isAlwaysAllowed };

const ALL_ALLOWED: Allowances = {
  vault: isAlwaysAllowed,
  keyReading: isAlwaysAllowed,
  editorReading: isAlwaysAllowed,
  fileTree: isAlwaysAllowed,
  looseCasts: isAlwaysAllowed,
  noteReading: isAlwaysAllowed,
  codeMirror: isAlwaysAllowed,
};

function isOneOf(files: string[]): (path: string) => boolean {
  return (path) => files.some((file) => path === `${SOURCE_FOLDER}${file}`);
}

const isGatekeeper = isOneOf(ALLOWED);

const readsKeysOfAnything = isOneOf([...ALLOWED, ...PARSED_DATA]);

const SOURCE_ALLOWANCES: Allowances = {
  vault: isGatekeeper,
  keyReading: readsKeysOfAnything,
  editorReading: isOneOf(EDITOR_TEXT_READERS),
  fileTree: isGatekeeper,
  looseCasts: isOneOf(LOOSE_CASTERS),
  noteReading: isOneOf(BASES_READERS),
  codeMirror: isOneOf(CODE_MIRROR_READERS),
};

let scanner: SourceScanner;

beforeAll(() => {
  scanner = new SourceScanner(ROOT, scannedFileSystem());
});

afterAll(() => {
  scanner.close();
});

function sampleBreaches(sample: string, allowances: Allowances = NOTHING_ALLOWED): string[] {
  return scanner.breaches(SAMPLE_PROJECT, [samplePath(SAMPLES.indexOf(sample))], allowances);
}

function fenceBreaches(project: string, listing: string[], allowances: Allowances): string[] {
  const loaded = scanner.loadedFiles(project);
  const scanned = loaded.filter((path) => !isDeclaration(path));
  return [...hiddenCodeIn(listing), ...unscannableIn(loaded), ...scanner.breaches(project, scanned, allowances)];
}

function plantedBreaches(name: string): string[] {
  const planted = PLANTED.find((candidate) => candidate.name === name);
  if (planted === undefined) throw new Error(`No planted plugin is called ${name}.`);
  return fenceBreaches(plantedProject(planted), plantedListing(planted), NOTHING_ALLOWED).map((breach) => breach.replace(`${plantedFolder(planted)}/`, ""));
}

function sourcePath(file: string): string {
  return `${SOURCE_FOLDER}${file}`;
}

describe("the vault fence", () => {
  it("reads every file the bundle's entry point loads, outside node_modules", () => {
    const loaded = scanner.loadedFiles(BUNDLED_PROJECT);
    expect(loaded).toContain(sourcePath("main.ts"));
    expect(loaded).toContain(sourcePath("fence/gatekeeper.ts"));
    expect(loaded.length).toBeGreaterThan(100);
  });

  it("lets only the gatekeeper's allowed files reach the vault, walk its folders or Obsidian's file metadata, only the allowed files read an editor's text, and none write through an editor or view", () => {
    expect(fenceBreaches(BUNDLED_PROJECT, sourceListing(), SOURCE_ALLOWANCES)).toEqual([]);
  });

  it("allows only files in the gatekeeper's own folder, each of which still needs it", () => {
    const loaded = scanner.loadedFiles(BUNDLED_PROJECT);
    for (const allowed of ALLOWED) {
      expect(allowed.startsWith(GATEKEEPER_FOLDER)).toBe(true);
      expect(loaded).toContain(sourcePath(allowed));
      expect(scanner.breaches(BUNDLED_PROJECT, [sourcePath(allowed)], NOTHING_ALLOWED)).not.toEqual([]);
    }
  });

  it("lets only the file that parses the plugin's saved data read every key of a value it can't type, which it still needs", () => {
    for (const parsed of PARSED_DATA) {
      const breaches = scanner.breaches(BUNDLED_PROJECT, [sourcePath(parsed)], NOTHING_ALLOWED);
      expect(breaches).not.toEqual([]);
      for (const breach of breaches) expect(breach).toContain("reads every key of a value");
    }
  });

  it("lets only the allowed files read an editor's text, each of which still needs it and does nothing else the fence refuses", () => {
    for (const reader of EDITOR_TEXT_READERS) {
      const breaches = scanner.breaches(BUNDLED_PROJECT, [sourcePath(reader)], NOTHING_ALLOWED);
      expect(breaches).not.toEqual([]);
      for (const breach of breaches) expect(breach).toContain("reads the text of an editor or view");
    }
  });

  it("lets only the allowed files cast through unknown or any, each of which still needs it and does nothing else the fence refuses", () => {
    for (const caster of LOOSE_CASTERS) {
      const breaches = scanner.breaches(BUNDLED_PROJECT, [sourcePath(caster)], NOTHING_ALLOWED);
      expect(breaches).not.toEqual([]);
      for (const breach of breaches) expect(breach).toContain("casts through unknown or any");
    }
  });

  it("lets only the characters Bases view read what Bases lists, which it still needs and does nothing else the fence refuses", () => {
    for (const reader of BASES_READERS) {
      const breaches = scanner.breaches(BUNDLED_PROJECT, [sourcePath(reader)], NOTHING_ALLOWED);
      expect(breaches).not.toEqual([]);
      for (const breach of breaches) expect(breach).toContain("reads a note's text through Obsidian");
    }
  });

  it("lets only the marker colouring reach CodeMirror, which it still needs and does nothing else the fence refuses", () => {
    for (const reader of CODE_MIRROR_READERS) {
      const breaches = scanner.breaches(BUNDLED_PROJECT, [sourcePath(reader)], NOTHING_ALLOWED);
      expect(breaches).not.toEqual([]);
      for (const breach of breaches) expect(breach).toMatch(/loads CodeMirror|reaches the editor/);
    }
  });

  it("scans a .mts file the entry point loads, and refuses it under src", () => {
    const breaches = plantedBreaches("mts");
    expect(breaches).toContain("src/reader.mts is code under src that the scan can't read as TypeScript");
    expect(breaches.some((breach) => breach.includes("reader.mts:2 reaches the vault through vault"))).toBe(true);
  });

  it("refuses a .js file under src, even with a declaration file beside it", () => {
    expect(plantedBreaches("js")).toContain("src/reader.js is code under src that the scan can't read as TypeScript");
  });

  it("scans a file outside src the entry point loads", () => {
    expect(plantedBreaches("outside").some((breach) => breach.includes("lib/reader.ts:2 reaches the vault through vault"))).toBe(true);
  });

  it("refuses a declaration file outside node_modules that the entry point loads, which could hide a .js file beside it", () => {
    expect(plantedBreaches("declared-outside")).toContain("lib/reader.d.ts is loaded from the entry point but isn't a plain TypeScript file");
  });

  it("refuses a .js file outside src that the entry point loads", () => {
    expect(plantedBreaches("js-outside")).toContain("lib/reader.js is loaded from the entry point but isn't a plain TypeScript file");
  });

  it.each(HIDDEN_CODE)("refuses a %s file anywhere under src", (ending) => {
    const path = `${SOURCE_FOLDER}campaign/reader${ending}`;
    expect(hiddenCodeIn([path])).toEqual([`${path} is code under src that the scan can't read as TypeScript`]);
  });

  it.each(REACHING_SAMPLES)("would catch reaching the vault with %s", (sample) => {
    expect(sampleBreaches(sample)).not.toEqual([]);
  });

  it.each(WRITING_SAMPLES)("would catch writing through an editor or view with %s", (sample) => {
    expect(sampleBreaches(sample)).not.toEqual([]);
  });

  it.each(READING_SAMPLES)("would catch reading an editor's or view's text with %s", (sample) => {
    expect(sampleBreaches(sample)).not.toEqual([]);
  });

  it.each(FORBIDDEN_SAMPLES)("would catch rendering, running a command, running text as code or following a link unfenced with %s", (sample) => {
    expect(sampleBreaches(sample)).not.toEqual([]);
  });

  it.each(FILE_TREE_SAMPLES)("would catch walking the vault's folders with %s", (sample) => {
    expect(sampleBreaches(sample)).not.toEqual([]);
  });

  it.each(CAST_SAMPLES)("would catch a computed key on a value cast through unknown or any with %s, even in a file allowed to cast", (sample) => {
    expect(sampleBreaches(sample, LOOSE_CASTS_ALLOWED)).not.toEqual([]);
  });

  it.each(LOOSE_CAST_SAMPLES)("would catch casting through unknown or any with %s", (sample) => {
    expect(sampleBreaches(sample)).not.toEqual([]);
  });

  it.each(OTHER_PLUGIN_SAMPLES)("would catch reaching other plugins or checking for a key in the app or a window with %s", (sample) => {
    expect(sampleBreaches(sample)).not.toEqual([]);
  });

  it.each(GLOBAL_APP_SAMPLES)("would catch reaching the app through a window or globalThis with %s, even in a file allowed to cast", (sample) => {
    expect(sampleBreaches(sample, LOOSE_CASTS_ALLOWED)).not.toEqual([]);
  });

  it.each(NOTE_READING_SAMPLES)("would catch reading a note's text through Obsidian with %s", (sample) => {
    expect(sampleBreaches(sample)).not.toEqual([]);
  });

  it.each(VIEW_TEXT_SAMPLES)("would catch reading the text of a view's element with %s", (sample) => {
    expect(sampleBreaches(sample, ALL_ALLOWED)).not.toEqual([]);
  });

  it.each(CODE_MIRROR_SAMPLES)("would catch reaching the editor through CodeMirror with %s", (sample) => {
    expect(sampleBreaches(sample, LOOSE_CASTS_ALLOWED)).not.toEqual([]);
  });

  it.each(CONSTRUCTOR_SAMPLES)("would catch reaching a constructor with %s", (sample) => {
    expect(sampleBreaches(sample)).not.toEqual([]);
  });

  it.each(HARMLESS_SAMPLES)("lets %s pass, since it reaches neither the vault nor an editor's text", (sample) => {
    expect(sampleBreaches(sample)).toEqual([]);
  });
});
