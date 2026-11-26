export const REACHING_SAMPLES = [
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

export const FORBIDDEN_SAMPLES = [
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
  'import { FileSystemAdapter } from "obsidian";\nexport const read = (path: string) => FileSystemAdapter.readLocalFile(path);',
  'import type { FileSystemAdapter } from "obsidian";\nexport const make = (adapter: FileSystemAdapter, path: string) => adapter.mkdir(path);',
  'import type { CapacitorAdapter } from "obsidian";\nexport const where = (adapter: CapacitorAdapter) => adapter.getFullPath("");',
  'import type { DataAdapter } from "obsidian";\nexport const list = (adapter: DataAdapter, path: string) => adapter.list(path);',
  'import { MarkdownPreviewRenderer } from "obsidian";\nexport const hook = (run: (el: HTMLElement) => void) => MarkdownPreviewRenderer.registerPostProcessor(run);',
  'import type { App } from "obsidian";\nexport const open = (app: App, path: string) => app.workspace.changeLayout({ main: { type: "split", children: [{ type: "leaf", state: { type: "markdown", state: { file: path } } }] } });',
  'import type { App } from "obsidian";\nexport const open = (app: App) => app.workspace.getLayout();',
  'import type { App } from "obsidian";\nexport const recent = (app: App) => app.workspace.getLastOpenFiles();',
];

export const FILE_TREE_SAMPLES = [
  'import type { TFile } from "obsidian";\nexport const folder = (file: TFile) => file.parent;',
  'import type { TFolder } from "obsidian";\nexport const inside = (folder: TFolder) => folder.children;',
  'import type { TAbstractFile } from "obsidian";\nexport const above = (file: TAbstractFile) => file.parent?.parent;',
  "const folder = file.parent;",
  'import type { TFolder } from "obsidian";\nexport const inside = (folder: TFolder) => folder["children"];',
  "const { parent } = file;",
];

export const FOLDER_WALK_SAMPLES = [
  'import { TFile, Vault, type TFolder } from "obsidian";\nexport function notes(folder: TFolder) {\n  const found: TFile[] = [];\n  Vault.recurseChildren(folder, (file) => {\n    if (file instanceof TFile) found.push(file);\n  });\n  return found;\n}',
  'import { Vault } from "obsidian";\nexport const walk = Vault["recurseChildren"];',
  'import { Vault } from "obsidian";\nexport const { recurseChildren } = Vault;',
];

export const CAST_SAMPLES = [
  'import type { App } from "obsidian";\nexport const files = (app: App) => (app as unknown as Record<string, object>)[["va", "ult"].join("")];',
  'import type { App } from "obsidian";\nexport const files = (app: App, key: string) => (<Record<string, object>>(<unknown>app))[key];',
  'import type { App } from "obsidian";\nexport function files(app: App, key: string) {\n  const words = app as unknown as Record<string, object>;\n  return words[key];\n}',
  'import type { App } from "obsidian";\nexport function files(app: App, key: string) {\n  const loose: unknown = app;\n  return (loose as Record<string, object>)[key];\n}',
  'import type { App } from "obsidian";\nexport const files = (app: App, key: string) => (app as unknown as Record<string, object> as Record<string, object>)[key];',
  'import type { App } from "obsidian";\nexport function files(app: App, key: string) {\n  const loose = app as any;\n  const words: Record<string, object> = loose;\n  return words[key];\n}',
];

export const ANY_TYPE_SAMPLES = [
  "export const keep = (value: any) => value;",
  "export const list: any[] = [];",
  "export function read(): Promise<any> {\n  return Promise.resolve(null);\n}",
  "export type Loose = Record<string, any>;",
];

export const LOOSE_CAST_SAMPLES = [
  'import type { App } from "obsidian";\nexport const registry = (app: App) => (app as unknown as { viewRegistry: object }).viewRegistry;',
  'import type { App } from "obsidian";\nexport const registry = (app: App) => (app as any).viewRegistry;',
  'import type { App } from "obsidian";\nexport const registry = (app: App) => (<any>app).viewRegistry;',
  'import type { App } from "obsidian";\nexport function registry(app: App) {\n  const loose: unknown = app;\n  return (loose as { viewRegistry: object }).viewRegistry;\n}',
];

export const OTHER_PLUGIN_SAMPLES = [
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

export const GLOBAL_APP_SAMPLES = [
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

export const CONSTRUCTOR_SAMPLES = [
  '(() => 0).constructor("return this")();',
  'export const make = (run: () => void) => run["constructor"];',
  "export const make = (run: () => void) => {\n  const { constructor: maker } = run;\n  return maker;\n};",
  'export const make = (run: () => void) => {\n  const { ["constructor"]: maker } = run;\n  return maker;\n};',
];

export const HARMLESS_SAMPLES = [
  'interface Opener {\n  open(): void;\n}\nclass PlainOpener implements Opener {\n  constructor(private readonly name: string) {}\n  open(): void {}\n}\nexport function hold() {\n  const held: { opener: Opener } = { opener: new PlainOpener("Pale Moon") };\n  return held;\n}',
  'import type { App } from "obsidian";\ninterface Opener {\n  open(): void;\n}\nclass FrameOpening {\n  constructor(private readonly app: App) {}\n  open(): void {}\n}\nclass BoundOpener implements Opener {\n  constructor(private readonly opens: () => void) {}\n  open(): void {\n    this.opens();\n  }\n}\nexport function hold(app: App) {\n  const opening = new FrameOpening(app);\n  const held: { opener: Opener } = { opener: new BoundOpener(opening.open.bind(opening)) };\n  return held;\n}',
  'interface Store {\n  open(folder: string): Promise<void>;\n  campaignFolder: string | null;\n}\nexport const reopen = (store: Pick<Store, "open" | "campaignFolder">) => store.open("Pale Moon");',
  'interface Shown {\n  file: string;\n}\nexport const file = (shown: Pick<Shown, "file">) => shown.file;',
  "export class Purse {\n  constructor(readonly gold: number) {}\n}",
  "export const name = (value: string | number) => value as string;",
  'import type { TextComponent } from "obsidian";\nexport const name = (text: TextComponent) => text.setValue("Pale Moon");',
  'import type { TextComponent } from "obsidian";\nexport const name = (text: TextComponent) => text.getValue();',
  'export const seen = (counts: Map<string, number>) => counts.set("Mira", 1);',
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
  "export const page = (box: HTMLElement) => box.doc.title;",
  'import type { TFile } from "obsidian";\nexport const file = (entry: { file: TFile }) => entry.file;',
  'import type { Modal } from "obsidian";\nexport const show = (modal: Modal) => modal.open();',
  'export class Tab {\n  constructor(readonly app: { name: string }) {}\n  name(): string {\n    return this.app.name;\n  }\n}',
  'export function move(place: { path: string }) {\n  place.path = "Pale Moon";\n}',
  'interface Place {\n  path: string;\n}\nexport function move(place: Pick<Place, "path">) {\n  place.path = "Pale Moon";\n}',
  "interface Step {\n  next: Step | null;\n}\nexport const first = (step: Step): Step => step;",
];

export const WIDENING_SAMPLES = [
  'import type { App } from "obsidian";\nexport function steal(app: App) {\n  const o: {} = app;\n  return Object.values(o);\n}',
  'import type { App } from "obsidian";\nexport function steal(app: App) {\n  const o: Object = app;\n  return Object.values(o);\n}',
  'import type { App } from "obsidian";\nexport function steal(app: App) {\n  const o: object = app;\n  return Object.values(o);\n}',
  'import type { App, TFile } from "obsidian";\ninterface VaultLike {\n  read(file: TFile): Promise<string>;\n}\nexport function steal(app: App, key: string, file: TFile) {\n  const o: {} = app;\n  const r = o as Record<string, VaultLike>;\n  return r[key]?.read(file);\n}',
  'import type { App, TFile } from "obsidian";\ninterface VaultLike {\n  read(file: TFile): Promise<string>;\n}\nexport function steal(app: App, file: TFile) {\n  const o: {} = app;\n  const r = o as Record<string, VaultLike>;\n  return Object.getOwnPropertyNames(o).map((n) => r[n]?.read(file));\n}',
  'import type { App, TFile } from "obsidian";\ninterface VaultLike {\n  read(file: TFile): Promise<string>;\n}\nexport function steal(app: App, file: TFile) {\n  const o: Object = app;\n  const r = o as Record<string, VaultLike>;\n  return Object.keys(o).map((n) => r[n]?.read(file));\n}',
  'import type { App } from "obsidian";\nexport function steal(app: App) {\n  const o: { scope: object } = app;\n  return Object.values(o);\n}',
  'import type { App } from "obsidian";\nexport const steal = (app: App) => Object.keys(app);',
  'import type { App } from "obsidian";\nexport const steal = (app: App) => Object.getOwnPropertyNames(app);',
  'import type { App } from "obsidian";\nexport function steal(app: App) {\n  const { values } = Object;\n  return values(app);\n}',
  'import type { App } from "obsidian";\nexport const steal = (app: App) => Object["values"](app);',
  'import type { App } from "obsidian";\nexport const steal = (app: App, seen: unknown[]) => JSON.stringify(app, (_key, value: unknown) => seen.push(value));',
  'import type { App } from "obsidian";\nexport function steal(app: Pick<App, "workspace" | "scope">) {\n  return Object.values(app);\n}',
  'import type { App } from "obsidian";\nexport function steal(app: Pick<App, "scope">, key: string) {\n  const o: Record<string, unknown> = app;\n  return o[key];\n}',
  "export const parts = (o: {}) => Object.values(o);",
  "export const parts = (o: Object, key: string) => (o as Record<string, unknown>)[key];",
  'import type { App } from "obsidian";\nexport const parts = (app: Pick<App, "scope" | "keymap">) => Object.values(app);',
  'import type { ItemView } from "obsidian";\nexport const parts = (view: ItemView) => Object.values(view);',
  'import type { FencedFiles } from "../../../../src/fence/gate/fenced-files";\nexport const parts = (files: Pick<FencedFiles, "getFileByPath">) => Object.values(files);',
  'import type { App } from "obsidian";\nexport function steal(apps: readonly App[]) {\n  const o: readonly { scope: object }[] = apps;\n  return o.map((one) => Object.values(one));\n}',
  'import type { App } from "obsidian";\nexport function steal(apps: Map<string, App[]>) {\n  const o: Map<string, { scope: object }[]> = apps;\n  return [...o.values()].map((all) => all.map((one) => Object.values(one)));\n}',
  'import type { App } from "obsidian";\ninterface Opener {\n  open(): void;\n}\nclass AppOpener implements Opener {\n  constructor(private readonly app: App) {}\n  open(): void {}\n}\nexport function hold(app: App) {\n  const held: { opener: Opener } = { opener: new AppOpener(app) };\n  return held;\n}',
  'import type { App } from "obsidian";\ninterface Opener {\n  open(): void;\n}\nclass AppOpener implements Opener {\n  constructor(private readonly app: App) {}\n  open(): void {}\n}\nexport function hold(app: App) {\n  const held: { outer: { opener: Opener } } = { outer: { opener: new AppOpener(app) } };\n  return held;\n}',
  'import type { App } from "obsidian";\ninterface Opener {\n  open(): void;\n}\nclass AppOpener implements Opener {\n  constructor(private readonly app: App) {}\n  open(): void {}\n}\nexport function hold(app: App) {\n  const held: Record<string, Opener> = { one: new AppOpener(app) };\n  return held;\n}',
  'import type { App } from "obsidian";\ninterface Opener {\n  open(): void;\n}\nclass AppOpener implements Opener {\n  constructor(private readonly app: App) {}\n  open(): void {}\n}\nexport function hold(app: App, take: (held: { opener: Opener }) => void) {\n  take({ opener: new AppOpener(app) });\n}',
  'import type { App } from "obsidian";\nexport function steal(apps: Promise<App> | null) {\n  const o: Promise<{ scope: object }> | null = apps;\n  return o?.then((one) => Object.values(one));\n}',
];

const NOTE_REF = 'import type { NoteRef } from "../../../../src/host/notes/note-ref";\n';

export const HANDLE_SAMPLES = [
  `import type { TFile } from "obsidian";\n${NOTE_REF}export const handle = (file: TFile): NoteRef => file;`,
  `import type { TFile } from "obsidian";\n${NOTE_REF}export const handle = (file: TFile | null): NoteRef | null => file;`,
  `import type { TFile } from "obsidian";\n${NOTE_REF}export const hand = (file: TFile, heard: (note: NoteRef) => void) => heard(file);`,
  `import type { TFile } from "obsidian";\n${NOTE_REF}export const handles = (files: TFile[]): NoteRef[] => files;`,
];

export const HANDLE_LOOK_ALIKE_SAMPLES = [
  `import type { App } from "obsidian";\n${NOTE_REF}export const handles = (apps: App[]): (NoteRef & { readonly scope: unknown })[] => apps;`,
  'import type { TFile } from "obsidian";\ninterface NoteRef {\n  readonly path: string;\n}\nexport const handle = (file: TFile): NoteRef => file;',
  `import type { App } from "obsidian";\n${NOTE_REF}export const handle = (app: App): NoteRef & { readonly scope: unknown } => app;`,
];

export const KEY_SAMPLES = [
  "export function make(name: string, code: string): unknown {\n  const arrow = () => 0;\n  const key = name as keyof typeof arrow;\n  const maker = arrow[key] as FunctionConstructor;\n  return maker(code)();\n}",
  'export function make(first: string, second: string, code: string): unknown {\n  const text = "";\n  const outer = text[first as "constructor"];\n  const maker = outer[second as "constructor"] as FunctionConstructor;\n  return maker(code)();\n}',
  'export function make(first: string, code: string): unknown {\n  const count = 0;\n  const maker = count[first as "constructor"] as FunctionConstructor;\n  return maker(code);\n}',
  "export function make(first: string): unknown {\n  const arrow = () => 0;\n  return Object.values(arrow) && first;\n}",
  'export const make = (arrow: () => number, key: "constructor" | "length") => arrow[key];',
  'export const make = (arrow: () => number, key: "prototype") => arrow[key];',
  'export const make = (lines: string[], key: "constructor" | "length") => lines[key];',
  'export const make = (lines: { name: string }, key: "__proto__") => lines[key];',
  "export const word = (words: Record<string, string>, key: string) => words[key];",
  'import type { TFile } from "obsidian";\nexport function count(counts: Record<string, number>, file: TFile) {\n  counts[file.path] = 1;\n}',
  "export const word = (words: string[], key: string | number) => words[key as number];",
  'export const make = (code: string) => (Function as unknown as FunctionConstructor)(code);',
  "export const make = (maker: FunctionConstructor, code: string) => maker(code);",
];

export const ALLOWED_KEY_SAMPLES = [
  "export const line = (lines: string[], index: number) => lines[index];",
  'const LABELS: Record<"AC" | "HP", string> = { AC: "Armor Class", HP: "Hit Points" };\nexport const label = (name: "AC" | "HP") => LABELS[name];',
  'export const first = (lines: string[]) => lines[0];',
];
