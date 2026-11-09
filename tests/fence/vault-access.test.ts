import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build, transform } from "esbuild";
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
const FILE_OPENERS = ["characters/open-character-sheet.ts", "characters/open-character.ts", "interface/open-in-editor.ts", "views/open-link.ts", "views/open-view.ts"];
const VIEW_STATE_SETTERS = ["interface/campaign-view.ts", "interface/one-campaign-tab.ts", "interface/open-campaign.ts", "interface/take-open-leaves.ts", "interface/view-state-patch.ts"];
const ACTIVE_FILE_READERS = ["characters/open-character.ts", "views/open-view.ts"];
const ACTIVE_VIEW_READERS = ["interface/open-in-editor.ts", "interface/shown-campaign-path.ts"];
const EVENT_TRIGGERS = ["fence/fenced-files.ts"];
const LEAF_VIEW_READERS = ["main.ts", "interface/one-campaign-tab.ts", "interface/seen-tab.ts", "interface/view-state-patch.ts"];
const VIEW_FILE_READERS = ["main.ts", "campaign/editor-text.ts", "editor/marker-decorations.ts", "interface/campaign-takeover.ts"];
const HIDDEN_CODE = [".js", ".mjs", ".cjs", ".mts", ".cts", ".tsx", ".jsx"];
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
  'const { "vault": files } = app;',
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

const WRITE_NAME_SAMPLES = [
  'import type { Editor } from "obsidian";\nexport const change = (editor: Editor) => editor.setLine(0, "");',
  'import type { Editor } from "obsidian";\nexport const change = (editor: Editor) => editor.transaction({ changes: [] });',
  'import type { Editor } from "obsidian";\nexport const change = (editor: Editor) => editor.undo();',
  'import type { Editor } from "obsidian";\nexport const change = (editor: Editor) => editor.redo();',
  'import type { Editor } from "obsidian";\nexport const change = (editor: Editor) => editor.exec("goUp");',
  'import type { Editor } from "obsidian";\nexport const change = (editor: Editor) => editor.processLines(() => null, () => undefined);',
  'import type { MarkdownView } from "obsidian";\nexport const change = (view: MarkdownView) => view.clear();',
  'import type { MarkdownSubView } from "obsidian";\nexport const change = (mode: MarkdownSubView) => mode.set("", true);',
  'import type { EditorView } from "@codemirror/view";\nexport const change = (view: EditorView) => view.dispatch({ changes: { from: 0, insert: "" } });',
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
  'const { ["eval"]: run } = globalThis;',
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
  'import type { App } from "obsidian";\nexport const files = (app: App, key: string) => (app as unknown as Record<string, object> as Record<string, object>)[key];',
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
  'export const found = (registry: object) => "plugins" in registry;',
  'export const found = (loose: any) => "vault" in loose;',
  "export const listed = (registry: { enabledPlugins: Set<string> }) => {\n  const { enabledPlugins } = registry;\n  return enabledPlugins;\n};",
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
  'import type { MarkdownView } from "obsidian";\nexport const mode = (view: MarkdownView) => view.currentMode;',
  'import type { BasesEntry, BasesPropertyId, BasesQueryResult, QueryController } from "obsidian";\nexport const total = (result: BasesQueryResult, controller: QueryController, entries: BasesEntry[], id: BasesPropertyId) => result.getSummaryValue(controller, entries, id, "sum");',
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
  "export const listen = (view: { updateListener: { of(run: () => void): object } }) => view.updateListener.of(() => {});",
  "export const filter = (state: { transactionFilter: { of(run: () => void): object } }) => state.transactionFilter.of(() => {});",
  "export const filter = (state: { changeFilter: { of(run: () => boolean): object } }) => state.changeFilter.of(() => true);",
  "export const typed = (view: { inputHandler: { of(run: () => boolean): object } }) => view.inputHandler.of(() => false);",
  'import { editorViewField } from "obsidian";\nexport const field = editorViewField;',
  'import { editorLivePreviewField } from "obsidian";\nexport const field = editorLivePreviewField;',
  'export function text(state: unknown) {\n  const held = state as { doc: string };\n  return held["doc"];\n}',
  "export function text(state: unknown) {\n  const held = state as { doc: string };\n  return held.doc;\n}",
];

const CONSTRUCTOR_SAMPLES = [
  '(() => 0).constructor("return this")();',
  'export const make = (run: () => void) => run["constructor"];',
  "export const make = (run: () => void) => {\n  const { constructor: maker } = run;\n  return maker;\n};",
  'export const make = (run: () => void) => {\n  const { ["constructor"]: maker } = run;\n  return maker;\n};',
];

const HARMLESS_SAMPLES = [
  'interface Store {\n  open(folder: string): Promise<void>;\n  campaignFolder: string | null;\n}\nexport const reopen = (store: Pick<Store, "open" | "campaignFolder">) => store.open("Pale Moon");',
  'interface Shown {\n  file: string;\n}\nexport const file = (shown: Pick<Shown, "file">) => shown.file;',
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
  'import type { TFile } from "obsidian";\nexport const file = (entry: { file: TFile }) => entry.file;',
  'import type { Modal } from "obsidian";\nexport const show = (modal: Modal) => modal.open();',
  'export class Tab {\n  constructor(readonly app: { name: string }) {}\n  name(): string {\n    return this.app.name;\n  }\n}',
];

const OPENING_SAMPLES = [
  'import type { App } from "obsidian";\nexport const show = (app: App) => app.workspace.getLeaf(false).setViewState({ type: "markdown", state: { file: "Private/Recovery codes.md" } });',
  'import type { App } from "obsidian";\nexport const peek = (app: App, event: MouseEvent, targetEl: HTMLElement) => app.workspace.trigger("hover-link", { event, source: "preview", hoverParent: targetEl, targetEl, linktext: "Private/Recovery codes", sourcePath: "" });',
  'import type { App } from "obsidian";\nexport const open = (app: App) => app.workspace.getLeaf("tab").openFile(app.workspace.getActiveFile());',
  'import type { App, TFile } from "obsidian";\nexport const open = (app: App, file: TFile) => app.workspace.getLeaf(false).openFile(file);',
  'import type { App } from "obsidian";\nexport const pop = (app: App) => app.workspace.openPopoutLeaf();',
  'import type { App } from "obsidian";\nexport const file = (app: App) => app.workspace.activeEditor?.file;',
  'import { MarkdownView, type App } from "obsidian";\nexport const file = (app: App) => app.workspace.getActiveViewOfType(MarkdownView)?.file;',
  'import type { App } from "obsidian";\nexport const leaf = (app: App) => app.workspace["setViewState" as never];',
  'import type { App } from "obsidian";\nexport const name = "hover-" + "link";\nexport const peek = (app: App) => app.workspace.trigger(name, {});',
  'export const name = `hover-link`;',
  'import type { App } from "obsidian";\nexport const file = (app: App) => app.workspace.activeLeaf?.view.file;',
  'import type { App } from "obsidian";\nimport type { Gate } from "../../../../src/fence/gatekeeper";\nexport async function show(app: App, gate: Gate, path: string) {\n  const file = gate.files.getFileByPath(path);\n  if (file !== null) await app.workspace.getLeaf(false).openFile(file);\n}',
  'import type { App } from "obsidian";\nexport const path = (app: App) => app.workspace.getActiveFile()?.path;',
  'import { MarkdownView, type App } from "obsidian";\nexport const leaf = (app: App) => app.workspace.getActiveViewOfType(MarkdownView)?.leaf;',
  'import type { App } from "obsidian";\nexport const peek = (app: App, name: string) => app.workspace.trigger(name, {});',
  'import type { App } from "obsidian";\nexport function peek(app: App) {\n  const { trigger } = app.workspace;\n  return trigger;\n}',
];

const LEAF_SAMPLES = [
  'import type { View, WorkspaceLeaf } from "obsidian";\nexport const show = (leaf: Pick<WorkspaceLeaf, "open">, view: View) => leaf.open(view);',
  'import type { App } from "obsidian";\nexport const file = (app: App) => app.workspace.activeLeaf?.view;',
  'import type { App } from "obsidian";\nexport const leaf = (app: App) => app.workspace.getMostRecentLeaf();',
  'import type { App, WorkspaceLeaf } from "obsidian";\nexport const copy = (app: App, leaf: WorkspaceLeaf) => app.workspace.duplicateLeaf(leaf);',
  'import type { View, WorkspaceLeaf } from "obsidian";\nexport const show = (leaf: WorkspaceLeaf, view: View) => leaf.open(view);',
  'import type { View, WorkspaceLeaf } from "obsidian";\nexport const show = (leaf: WorkspaceLeaf, view: View) => leaf["open"](view);',
  'import type { WorkspaceLeaf } from "obsidian";\nexport function opener(leaf: WorkspaceLeaf) {\n  const { open } = leaf;\n  return open;\n}',
];

const LEAF_VIEW_SAMPLES = [
  'import type { App } from "obsidian";\nexport const view = (app: App) => app.workspace.getLeaf(false).view;',
  'import type { WorkspaceLeaf } from "obsidian";\nexport const view = (leaf: WorkspaceLeaf) => leaf["view"];',
  'import type { WorkspaceLeaf } from "obsidian";\nexport function shown(leaf: WorkspaceLeaf) {\n  const { view } = leaf;\n  return view;\n}',
  'import type { App } from "obsidian";\nexport const views = (app: App) => app.workspace.getLeavesOfType("markdown").map((leaf) => leaf.view);',
  'import type { App } from "obsidian";\nexport const views = (app: App) => app.workspace.getLeavesOfType("markdown").map(({ view }) => view);',
  'export const view = (leaf: Record<"view", number>) => leaf.view;',
  'export function shown(leaf: Record<"view", number>) {\n  const { view } = leaf;\n  return view;\n}',
];

const VIEW_FILE_SAMPLES = [
  'import type { MarkdownView } from "obsidian";\nexport const file = (view: Pick<MarkdownView, "file">) => view.file;',
  'import type { MarkdownView } from "obsidian";\nexport const file = (view: MarkdownView) => view.file;',
  'import { MarkdownView, type App, type TFile } from "obsidian";\nexport function files(app: App) {\n  const all: (TFile | null)[] = [];\n  app.workspace.iterateAllLeaves((leaf) => {\n    if (leaf.view instanceof MarkdownView) all.push(leaf.view.file);\n  });\n  return all;\n}',
  'import type { FileView } from "obsidian";\nexport function file(view: FileView) {\n  const { file } = view;\n  return file;\n}',
  'import type { MarkdownFileInfo } from "obsidian";\nexport const file = (info: MarkdownFileInfo) => info["file"];',
  "export const file = (view: any) => view.file;",
  "export function file(view: any) {\n  const { file } = view;\n  return file;\n}",
];

const ALLOWED_OPENING_SAMPLES = [
  'import type { App, TFile } from "obsidian";\nfunction picked(app: App): TFile | null {\n  return app.workspace.getActiveFile();\n}\nexport async function open(app: App) {\n  const file = picked(app);\n  if (file !== null) await app.workspace.getLeaf(false).openFile(file);\n}',
  'import type { App, TFile } from "obsidian";\nimport type { Gate } from "../../../../src/fence/gatekeeper";\nfunction picked(app: App, gate: Gate, path: string): TFile | null {\n  if (path === "") return app.workspace.getActiveFile();\n  return gate.files.getFileByPath(path);\n}\nexport async function open(app: App, gate: Gate, path: string) {\n  const file = picked(app, gate, path);\n  if (file !== null) await app.workspace.getLeaf(false).openFile(file);\n}',
  'import type { App, TFile } from "obsidian";\nfunction none(): TFile | null {\n  return null;\n}\nexport async function open(app: App) {\n  const file = none();\n  if (file !== null) await app.workspace.getLeaf(false).openFile(file);\n}',
  'import { MarkdownView, type App } from "obsidian";\nexport const file = (app: App) => app.workspace.getActiveViewOfType(MarkdownView)?.["file"];',
  'import type { App, TFile, WorkspaceLeaf } from "obsidian";\nexport const open = (app: App, file: TFile) => app.workspace.getLeaf(false).openFile(file);',
  'import type { App } from "obsidian";\nexport const open = (app: App) => app.workspace.getLeaf("tab").openFile(app.workspace.getActiveFile());',
  'import type { App, TFile, WorkspaceLeaf } from "obsidian";\nexport function open(app: App, file: TFile) {\n  const leaf: WorkspaceLeaf = app.workspace.getLeaf(false);\n  const opener = leaf.openFile;\n  return opener.call(leaf, file);\n}',
  'import { MarkdownView, type App } from "obsidian";\nexport function file(app: App) {\n  const view = app.workspace.getActiveViewOfType(MarkdownView);\n  return view?.file;\n}',
  'import { MarkdownView, type App } from "obsidian";\nexport function file(app: App) {\n  const { file } = app.workspace.getActiveViewOfType(MarkdownView) as MarkdownView;\n  return file;\n}',
  'import type { App, TFile } from "obsidian";\nasync function openNote(app: App, file: TFile) {\n  await app.workspace.getLeaf(false).openFile(file);\n}\nexport const open = (app: App, file: TFile) => openNote(app, file);',
  'import type { App, TFile } from "obsidian";\nimport type { Gate } from "../../../../src/fence/gatekeeper";\nexport async function openNote(app: App, file: TFile) {\n  await app.workspace.getLeaf(false).openFile(file);\n}\nexport async function open(app: App, gate: Gate, path: string) {\n  const file = gate.files.getFileByPath(path);\n  if (file !== null) await openNote(app, file);\n}',
  'import type { App } from "obsidian";\nimport type { Gate } from "../../../../src/fence/gatekeeper";\nexport function open(app: App, gate: Gate, path: string) {\n  let file = gate.files.getFileByPath(path);\n  file = app.workspace.getActiveFile();\n  if (file !== null) void app.workspace.getLeaf(false).openFile(file);\n}',
  'import type { App, TFile } from "obsidian";\nimport type { Gate } from "../../../../src/fence/gatekeeper";\nasync function openNote(app: App, file: TFile) {\n  await app.workspace.getLeaf(false).openFile(file);\n}\nexport async function open(app: App, gate: Gate, path: string) {\n  const file = gate.files.getFileByPath(path);\n  if (file !== null) await openNote(app, file);\n}\nexport const later = [openNote];',
  'import type { App, TFile } from "obsidian";\nimport type { Gate } from "../../../../src/fence/gatekeeper";\ndeclare function make(files: unknown, path: string): Promise<TFile>;\ndeclare function found(files: unknown, path: string): TFile | null;\ninterface Place {\n  gate: Pick<Gate, "files" | "metadata">;\n}\nasync function madeNote(place: Place, path: string): Promise<TFile | null> {\n  if (path === "") return null;\n  return make(place.gate.files, path);\n}\nexport async function open(app: App, place: Place, path: string) {\n  const inCampaign = found(place.gate.files, path);\n  if (inCampaign !== null) await app.workspace.getLeaf(false).openFile(inCampaign);\n  const made = await madeNote(place, path);\n  if (made !== null) await app.workspace.getLeaf(false).openFile(made);\n}',
  'import type { App, TFile } from "obsidian";\nimport type { Gate } from "../../../../src/fence/gatekeeper";\nasync function openNote(app: App, file: TFile) {\n  await app.workspace.getLeaf(false).openFile(file);\n}\nexport async function open(app: App, gate: Pick<Gate, "metadata">, linkpath: string) {\n  const found = gate.metadata.getFirstLinkpathDest(linkpath, "");\n  if (found !== null) await openNote(app, found);\n}',
  'import type { App, TFile } from "obsidian";\nimport type { Gate } from "../../../../src/fence/gatekeeper";\ndeclare function make(files: unknown, path: string): Promise<TFile>;\nexport async function open(app: App, gate: Gate, path: string) {\n  let made: TFile;\n  made = await make(gate.files, path);\n  await app.workspace.getLeaf(false).openFile(made);\n}',
  'import type { App, TFile } from "obsidian";\nimport type { Gate } from "../../../../src/fence/gatekeeper";\ndeclare function keep(files: unknown, file: TFile): TFile;\nexport async function open(app: App, gate: Gate, other: TFile) {\n  await app.workspace.getLeaf(false).openFile(keep(gate.files, other));\n}',
  'import type { App, TFile } from "obsidian";\nimport type { Gate } from "../../../../src/fence/gatekeeper";\nexport async function open(app: App, gate: Gate, other: TFile) {\n  await app.workspace.getLeaf(false).openFile(((_files: unknown, file: TFile) => file)(gate.files, other));\n}',
  'import type { App, TFile } from "obsidian";\nimport type { Gate } from "../../../../src/fence/gatekeeper";\nexport async function open(app: App, gate: Gate, path: string, other: TFile) {\n  let file = gate.files.getFileByPath(path);\n  [file] = [other];\n  if (file !== null) await app.workspace.getLeaf(false).openFile(file);\n}',
  'import type { App, TFile } from "obsidian";\nimport type { Gate } from "../../../../src/fence/gatekeeper";\nexport async function open(app: App, gate: Gate, path: string, other: TFile) {\n  let file = gate.files.getFileByPath(path);\n  file ??= other;\n  await app.workspace.getLeaf(false).openFile(file);\n}',
  'import type { App, TFile } from "obsidian";\nimport type { Gate } from "../../../../src/fence/gatekeeper";\nexport async function open(app: App, gate: Gate, path: string, other: TFile) {\n  let file = gate.files.getFileByPath(path);\n  file ||= other;\n  await app.workspace.getLeaf(false).openFile(file);\n}',
  'import type { App, TFile } from "obsidian";\nimport type { Gate } from "../../../../src/fence/gatekeeper";\nexport async function open(app: App, gate: Gate, path: string, other: TFile) {\n  let file: TFile | null = gate.files.getFileByPath(path);\n  file &&= other;\n  if (file !== null) await app.workspace.getLeaf(false).openFile(file);\n}',
  'import type { App, TFile } from "obsidian";\nimport type { Gate } from "../../../../src/fence/gatekeeper";\nexport async function open(app: App, gate: Gate, path: string, other: TFile) {\n  async function show(file: TFile = other) {\n    await app.workspace.getLeaf(false).openFile(file);\n  }\n  if (gate.files.getFileByPath(path) !== null) await show();\n}',
  'import type { App, TFile } from "obsidian";\nimport type { Gate } from "../../../../src/fence/gatekeeper";\nexport async function open(app: App, gate: Gate, path: string) {\n  var file = gate.files.getFileByPath(path);\n  var file = app.workspace.getActiveFile();\n  if (file !== null) await app.workspace.getLeaf(false).openFile(file);\n}',
  'import type { App, TFile } from "obsidian";\nexport async function open(app: App) {\n  let file: TFile;\n  file = file;\n  await app.workspace.getLeaf(false).openFile(file);\n}',
  'import type { App, TFile } from "obsidian";\nimport type { FencedFiles } from "../../../../src/fence/fenced-files";\nexport async function open(app: App, files: FencedFiles | { getFileByPath(path: string): TFile | null }, path: string) {\n  const file = files.getFileByPath(path);\n  if (file !== null) await app.workspace.getLeaf(false).openFile(file);\n}',
];

const GATED_OPENING_SAMPLES = [
  'import type { App } from "obsidian";\nimport type { Gate } from "../../../../src/fence/gatekeeper";\nexport async function open(app: App, gate: Gate, path: string) {\n  const file = gate.files.getFileByPath(path);\n  if (file !== null) await app.workspace.getLeaf(false).openFile(file);\n}',
  'import type { App } from "obsidian";\nexport const said = (app: App) => app.workspace.trigger("dd-said", {});',
  'import type { App } from "obsidian";\nimport type { Gate } from "../../../../src/fence/gatekeeper";\ninterface Place {\n  gate: Pick<Gate, "files" | "metadata">;\n}\nexport async function open(app: App, place: Place, path: string) {\n  const file = place.gate.files.getFileByPath(path);\n  if (file !== null) await app.workspace.getLeaf(false).openFile(file, { eState: { subpath: "" } });\n}',
  'import type { App } from "obsidian";\nimport type { Gate } from "../../../../src/fence/gatekeeper";\nexport async function open(app: App, gate: Gate, path: string) {\n  const made = await gate.files.create(path, "");\n  await app.workspace.getLeaf(false).openFile(made);\n}',
  'import type { App } from "obsidian";\nimport type { Gate } from "../../../../src/fence/gatekeeper";\nexport async function open(app: App, gate: Gate, path: string) {\n  await app.workspace.getLeaf(false).openFile(await gate.files.create(path, ""));\n}',
];

const GATE_FORGING_SAMPLES = [
  'import type { FencedFiles } from "../../../../src/fence/fenced-files";\nexport const files = (fake: object) => fake as FencedFiles;',
  'import type { FencedMetadata } from "../../../../src/fence/fenced-metadata";\nexport const metadata = (fake: object) => <FencedMetadata>fake;',
  'import type { FencedFileActions } from "../../../../src/fence/fenced-file-actions";\nexport const actions = (fake: object) => fake as FencedFileActions;',
  'import type { Gate } from "../../../../src/fence/gatekeeper";\nexport const gate = (fake: object) => fake as Gate;',
  'import type { HeldFiles } from "../../../../src/fence/held-files";\nexport const held = (fake: object) => fake as HeldFiles;',
  'import type { Fence } from "../../../../src/fence/fence";\nexport const fence = (fake: object) => fake as Fence;',
  'import type { FencedFiles } from "../../../../src/fence/fenced-files";\nexport const files = (fake: object) => fake as Pick<FencedFiles, "getFileByPath">;',
  'import type { FencedFiles } from "../../../../src/fence/fenced-files";\nexport const files = (fake: unknown) => fake as FencedFiles;',
  'import type { Gate } from "../../../../src/fence/gatekeeper";\nexport const gate = (other: object) => ({ files: { getFileByPath: () => other } }) satisfies Pick<Gate, "files">;',
  'import type { FencedFiles } from "../../../../src/fence/fenced-files";\nexport const files = (other: object) => ({ getFileByPath: () => other }) satisfies Partial<FencedFiles>;',
  'import type { Gate } from "../../../../src/fence/gatekeeper";\nexport function forge(gate: Gate, other: object) {\n  gate.files.getFileByPath = () => other as never;\n}',
  'import type { Gate } from "../../../../src/fence/gatekeeper";\nexport function forge(gate: Gate, other: object) {\n  gate.files["getFileByPath"] = () => other as never;\n}',
  'import type { FencedFiles } from "../../../../src/fence/fenced-files";\nexport function forge(files: Pick<FencedFiles, "getFileByPath">, other: object) {\n  files.getFileByPath ??= () => other as never;\n}',
  'import type { Gate } from "../../../../src/fence/gatekeeper";\nexport function forge(gate: Partial<Gate>) {\n  delete gate.files;\n}',
  'import type { Gate } from "../../../../src/fence/gatekeeper";\nexport function forge(gate: Gate, fake: Gate["files"]) {\n  ({ files: gate.files } = { files: fake });\n}',
  'import type { Gate } from "../../../../src/fence/gatekeeper";\nexport function forge(gate: Gate, fake: Gate["metadata"]["getFirstLinkpathDest"]) {\n  [gate.metadata.getFirstLinkpathDest] = [fake];\n}',
  'import type { HeldFiles } from "../../../../src/fence/held-files";\nexport function forge(held: HeldFiles & { count: number }) {\n  held.count++;\n}',
  'import type { Gate } from "../../../../src/fence/gatekeeper";\nexport function forge(gate: Gate, fakes: Gate["files"][]) {\n  for (gate.files of fakes) break;\n}',
  'import type { Gate } from "../../../../src/fence/gatekeeper";\nexport function forge(gate: Gate, other: object) {\n  Object.defineProperty(gate.files, "getFileByPath", { value: () => other });\n}',
  'import type { Gate } from "../../../../src/fence/gatekeeper";\nexport function forge(gate: Gate, other: object) {\n  Object.assign(gate.files, { getFileByPath: () => other });\n}',
  'import type { Gate } from "../../../../src/fence/gatekeeper";\nexport function forge(gate: Gate, fake: object) {\n  Object.setPrototypeOf(gate.files, fake);\n}',
  'import type { Gate } from "../../../../src/fence/gatekeeper";\nexport function forge(gate: Gate, other: object) {\n  Object.defineProperties(gate.metadata, { getFirstLinkpathDest: { value: () => other } });\n}',
];

const SAMPLES = [...REACHING_SAMPLES, ...WRITING_SAMPLES, ...WRITE_NAME_SAMPLES, ...READING_SAMPLES, ...FORBIDDEN_SAMPLES, ...FILE_TREE_SAMPLES, ...CAST_SAMPLES, ...LOOSE_CAST_SAMPLES, ...OTHER_PLUGIN_SAMPLES, ...GLOBAL_APP_SAMPLES, ...NOTE_READING_SAMPLES, ...VIEW_TEXT_SAMPLES, ...CODE_MIRROR_SAMPLES, ...CONSTRUCTOR_SAMPLES, ...OPENING_SAMPLES, ...ALLOWED_OPENING_SAMPLES, ...GATED_OPENING_SAMPLES, ...GATE_FORGING_SAMPLES, ...LEAF_SAMPLES, ...LEAF_VIEW_SAMPLES, ...VIEW_FILE_SAMPLES, ...HARMLESS_SAMPLES];

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
  fileOpening: isNeverAllowed,
  viewState: isNeverAllowed,
  activeFile: isNeverAllowed,
  activeView: isNeverAllowed,
  eventTrigger: isNeverAllowed,
  leafView: isNeverAllowed,
  viewFile: isNeverAllowed,
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
  fileOpening: isAlwaysAllowed,
  viewState: isAlwaysAllowed,
  activeFile: isAlwaysAllowed,
  activeView: isAlwaysAllowed,
  eventTrigger: isAlwaysAllowed,
  leafView: isAlwaysAllowed,
  viewFile: isAlwaysAllowed,
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
  fileOpening: isOneOf(FILE_OPENERS),
  viewState: isOneOf(VIEW_STATE_SETTERS),
  activeFile: isOneOf(ACTIVE_FILE_READERS),
  activeView: isOneOf(ACTIVE_VIEW_READERS),
  eventTrigger: isOneOf(EVENT_TRIGGERS),
  leafView: isOneOf(LEAF_VIEW_READERS),
  viewFile: isOneOf(VIEW_FILE_READERS),
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

interface PlantedOnDisk {
  name: string;
  files: Record<string, string>;
  found: string[];
}

const PLANTED_ON_DISK: PlantedOnDisk[] = [
  {
    name: "tsx beside ts",
    files: { "src/main.ts": 'export { files } from "./reader";\n', "src/reader.ts": "export const files = 1;\n", "src/reader.tsx": "export const files = 2;\n" },
    found: ["src/reader.tsx is bundled but not scanned", "src/reader.ts holds code but is scanned and not bundled"],
  },
  {
    name: "browser map",
    files: {
      "package.json": JSON.stringify({ browser: { "./src/reader.ts": "./src/other.ts" } }),
      "src/main.ts": 'export { files } from "./reader";\n',
      "src/reader.ts": "export const files = 1;\n",
      "src/other.ts": "export const files = 2;\n",
    },
    found: ["src/other.ts is bundled but not scanned", "src/reader.ts holds code but is scanned and not bundled"],
  },
];

const LIBRARY_FOLDER = "/node_modules/";

async function bundledInputs(root: string): Promise<string[]> {
  const result = await build({ ...PLUGIN_BUNDLE, absWorkingDir: root, write: false, metafile: true, logLevel: "silent" });
  return Object.keys(result.metafile.inputs)
    .map((input) => resolve(root, input))
    .filter((path) => !path.includes(LIBRARY_FOLDER));
}

async function holdsCode(path: string): Promise<boolean> {
  const result = await transform(readFileSync(path, "utf8"), { loader: "ts" });
  return result.code !== "";
}

async function unscannedBundleInputs(root: string, project: string): Promise<string[]> {
  const bundled = await bundledInputs(root);
  const scanned = scanner.loadedFiles(project).filter((path) => !isDeclaration(path));
  const notScanned = bundled.filter((path) => !scanned.includes(path)).map((path) => `${path} is bundled but not scanned`);
  const notBundled = scanned.filter((path) => !bundled.includes(path));
  const holdingCode = await Promise.all(notBundled.map(holdsCode));
  const codeNotBundled = notBundled.filter((_path, index) => holdingCode[index]).map((path) => `${path} holds code but is scanned and not bundled`);
  return [...notScanned, ...codeNotBundled];
}

function plantOnDisk(planted: PlantedOnDisk): string {
  const root = mkdtempSync(join(tmpdir(), "dd-planted-"));
  const project = { extends: `${ROOT}/tsconfig.json`, compilerOptions: { types: [] }, files: ["src/main.ts"], include: [] };
  const files = { ...planted.files, "tsconfig.json": JSON.stringify(project) };
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  }
  return root;
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

  it("scans exactly the files esbuild bundles, outside node_modules, and beyond them only files that hold nothing but types", async () => {
    expect(await unscannedBundleInputs(ROOT, BUNDLED_PROJECT)).toEqual([]);
  }, 30_000);

  it.each(PLANTED_ON_DISK)("finds a file esbuild bundles but the scan doesn't read, with a $name", async (planted) => {
    const root = plantOnDisk(planted);
    try {
      const found = await unscannedBundleInputs(root, `${root}/tsconfig.json`);
      expect(found.map((breach) => breach.replace(`${root}/`, ""))).toEqual(planted.found);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }, 30_000);

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
      const breaches = scanner.breaches(BUNDLED_PROJECT, [sourcePath(reader)], { ...SOURCE_ALLOWANCES, editorReading: isNeverAllowed });
      expect(breaches).not.toEqual([]);
      for (const breach of breaches) expect(breach).toContain("reads the text of an editor or view");
    }
  });

  it("lets only the allowed files cast through unknown or any, each of which still needs it and does nothing else the fence refuses", () => {
    for (const caster of LOOSE_CASTERS) {
      const breaches = scanner.breaches(BUNDLED_PROJECT, [sourcePath(caster)], { ...SOURCE_ALLOWANCES, looseCasts: isNeverAllowed });
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
      const breaches = scanner.breaches(BUNDLED_PROJECT, [sourcePath(reader)], { ...SOURCE_ALLOWANCES, codeMirror: isNeverAllowed });
      expect(breaches).not.toEqual([]);
      for (const breach of breaches) expect(breach).toMatch(/loads CodeMirror|reaches the editor/);
    }
  });

  it.each([
    { allowance: "fileOpening", files: FILE_OPENERS, breach: "opens, shows or picks a note with openFile" },
    { allowance: "viewState", files: VIEW_STATE_SETTERS, breach: "opens, shows or picks a note with setViewState" },
    { allowance: "activeFile", files: ACTIVE_FILE_READERS, breach: "opens, shows or picks a note with getActiveFile" },
    { allowance: "activeView", files: ACTIVE_VIEW_READERS, breach: "opens, shows or picks a note with getActiveViewOfType" },
    { allowance: "eventTrigger", files: EVENT_TRIGGERS, breach: "takes trigger without calling it with what it can read" },
    { allowance: "leafView", files: LEAF_VIEW_READERS, breach: "reads the view of a leaf" },
    { allowance: "viewFile", files: VIEW_FILE_READERS, breach: "reads the file of a view" },
  ] as const)("lets only the files allowed $allowance do it, each of which still needs it", ({ allowance, files, breach }) => {
    const allowedEverythingElse: Allowances = { ...SOURCE_ALLOWANCES, [allowance]: isNeverAllowed };
    for (const file of files) {
      const breaches = scanner.breaches(BUNDLED_PROJECT, [sourcePath(file)], allowedEverythingElse);
      expect(breaches, file).not.toEqual([]);
      for (const found of breaches) expect(found).toContain(breach);
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

  it("refuses a .tsx or .jsx file under src, which esbuild would bundle before a .ts file of the same name", () => {
    const paths = [`${SOURCE_FOLDER}campaign/reader.tsx`, `${SOURCE_FOLDER}campaign/reader.jsx`];
    expect(hiddenCodeIn(paths)).toEqual(paths.map((path) => `${path} is code under src that the scan can't read as TypeScript`));
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

  it.each(WRITE_NAME_SAMPLES)("would catch writing through an editor or view with %s, even in a file allowed everything else", (sample) => {
    expect(sampleBreaches(sample, ALL_ALLOWED)).not.toEqual([]);
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

  it.each(OPENING_SAMPLES)("would catch opening, showing or picking a note outside the gate with %s", (sample) => {
    expect(sampleBreaches(sample)).not.toEqual([]);
  });

  it.each(ALLOWED_OPENING_SAMPLES)("would catch opening a file that doesn't come from the gate, or a way around that check, with %s, even in a file allowed to open files", (sample) => {
    expect(sampleBreaches(sample, ALL_ALLOWED)).not.toEqual([]);
  });

  it.each(GATED_OPENING_SAMPLES)("lets %s pass in a file allowed to open files, since the file comes from the gate", (sample) => {
    expect(sampleBreaches(sample, ALL_ALLOWED)).toEqual([]);
  });

  it.each(GATE_FORGING_SAMPLES)("would catch forging or changing a gate outside the gate's folder with %s, even in a file allowed everything else", (sample) => {
    expect(sampleBreaches(sample, ALL_ALLOWED)).not.toEqual([]);
  });

  it.each(LEAF_SAMPLES)("would catch reaching a leaf other than through the campaign tab, or opening a view in one, with %s, even in a file allowed everything else", (sample) => {
    expect(sampleBreaches(sample, ALL_ALLOWED)).not.toEqual([]);
  });

  it.each(LEAF_VIEW_SAMPLES)("would catch reading a leaf's view with %s, in a file allowed everything else", (sample) => {
    expect(sampleBreaches(sample, { ...ALL_ALLOWED, leafView: isNeverAllowed })).not.toEqual([]);
  });

  it.each(VIEW_FILE_SAMPLES)("would catch reading a view's file with %s, in a file allowed everything else", (sample) => {
    expect(sampleBreaches(sample, { ...ALL_ALLOWED, viewFile: isNeverAllowed })).not.toEqual([]);
  });

  it.each(HARMLESS_SAMPLES)("lets %s pass, since it reaches neither the vault nor an editor's text", (sample) => {
    expect(sampleBreaches(sample)).toEqual([]);
  });
});
