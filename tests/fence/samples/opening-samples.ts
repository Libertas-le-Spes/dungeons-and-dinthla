export const OPENING_SAMPLES = [
  'import type { App } from "obsidian";\nexport const show = (app: App) => app.workspace.getLeaf(false).setViewState({ type: "markdown", state: { file: "Private/Primary.md" } });',
  'import type { App } from "obsidian";\nexport const peek = (app: App, event: MouseEvent, targetEl: HTMLElement) => app.workspace.trigger("hover-link", { event, source: "preview", hoverParent: targetEl, targetEl, linktext: "Private/Primary", sourcePath: "" });',
  'import type { App } from "obsidian";\nexport const open = (app: App) => app.workspace.getLeaf("tab").openFile(app.workspace.getActiveFile());',
  'import type { App, TFile } from "obsidian";\nexport const open = (app: App, file: TFile) => app.workspace.getLeaf(false).openFile(file);',
  'import type { App } from "obsidian";\nexport const pop = (app: App) => app.workspace.openPopoutLeaf();',
  'import type { App } from "obsidian";\nexport const file = (app: App) => app.workspace.activeEditor?.file;',
  'import { MarkdownView, type App } from "obsidian";\nexport const file = (app: App) => app.workspace.getActiveViewOfType(MarkdownView)?.file;',
  'import type { App } from "obsidian";\nexport const leaf = (app: App) => app.workspace["setViewState" as never];',
  'import type { App } from "obsidian";\nexport const name = "hover-" + "link";\nexport const peek = (app: App) => app.workspace.trigger(name, {});',
  'export const name = `hover-link`;',
  'import type { App } from "obsidian";\nexport const file = (app: App) => app.workspace.activeLeaf?.view.file;',
  'import type { App } from "obsidian";\nimport type { Gate } from "../../../../src/fence/gate/gatekeeper";\nexport async function show(app: App, gate: Gate, path: string) {\n  const file = gate.files.getFileByPath(path);\n  if (file !== null) await app.workspace.getLeaf(false).openFile(file);\n}',
  'import type { App } from "obsidian";\nexport const path = (app: App) => app.workspace.getActiveFile()?.path;',
  'import { MarkdownView, type App } from "obsidian";\nexport const leaf = (app: App) => app.workspace.getActiveViewOfType(MarkdownView)?.leaf;',
  'import type { App } from "obsidian";\nexport const peek = (app: App, name: string) => app.workspace.trigger(name, {});',
  'import type { App } from "obsidian";\nexport function peek(app: App) {\n  const { trigger } = app.workspace;\n  return trigger;\n}',
];

export const ALLOWED_OPENING_SAMPLES = [
  'import type { App, TFile } from "obsidian";\ndeclare const files: { pick(path: string): TFile };\nexport async function open(app: App, path: string) {\n  const file = files.pick(path);\n  await app.workspace.getLeaf(false).openFile(file);\n}',
  'import type { App, TFile } from "obsidian";\nfunction picked(app: App): TFile | null {\n  return app.workspace.getActiveFile();\n}\nexport async function open(app: App) {\n  const file = picked(app);\n  if (file !== null) await app.workspace.getLeaf(false).openFile(file);\n}',
  'import type { App, TFile } from "obsidian";\nimport type { Gate } from "../../../../src/fence/gate/gatekeeper";\nfunction picked(app: App, gate: Gate, path: string): TFile | null {\n  if (path === "") return app.workspace.getActiveFile();\n  return gate.files.getFileByPath(path);\n}\nexport async function open(app: App, gate: Gate, path: string) {\n  const file = picked(app, gate, path);\n  if (file !== null) await app.workspace.getLeaf(false).openFile(file);\n}',
  'import type { App, TFile } from "obsidian";\nfunction none(): TFile | null {\n  return null;\n}\nexport async function open(app: App) {\n  const file = none();\n  if (file !== null) await app.workspace.getLeaf(false).openFile(file);\n}',
  'import { MarkdownView, type App } from "obsidian";\nexport const file = (app: App) => app.workspace.getActiveViewOfType(MarkdownView)?.["file"];',
  'import type { App, TFile, WorkspaceLeaf } from "obsidian";\nexport const open = (app: App, file: TFile) => app.workspace.getLeaf(false).openFile(file);',
  'import type { App } from "obsidian";\nexport const open = (app: App) => app.workspace.getLeaf("tab").openFile(app.workspace.getActiveFile());',
  'import type { App, TFile, WorkspaceLeaf } from "obsidian";\nexport function open(app: App, file: TFile) {\n  const leaf: WorkspaceLeaf = app.workspace.getLeaf(false);\n  const opener = leaf.openFile;\n  return opener.call(leaf, file);\n}',
  'import { MarkdownView, type App } from "obsidian";\nexport function file(app: App) {\n  const view = app.workspace.getActiveViewOfType(MarkdownView);\n  return view?.file;\n}',
  'import { MarkdownView, type App } from "obsidian";\nexport function file(app: App) {\n  const { file } = app.workspace.getActiveViewOfType(MarkdownView) as MarkdownView;\n  return file;\n}',
  'import type { App, TFile } from "obsidian";\nasync function openNote(app: App, file: TFile) {\n  await app.workspace.getLeaf(false).openFile(file);\n}\nexport const open = (app: App, file: TFile) => openNote(app, file);',
  'import type { App, TFile } from "obsidian";\nimport type { Gate } from "../../../../src/fence/gate/gatekeeper";\nexport async function openNote(app: App, file: TFile) {\n  await app.workspace.getLeaf(false).openFile(file);\n}\nexport async function open(app: App, gate: Gate, path: string) {\n  const file = gate.files.getFileByPath(path);\n  if (file !== null) await openNote(app, file);\n}',
  'import type { App } from "obsidian";\nimport type { Gate } from "../../../../src/fence/gate/gatekeeper";\nexport function open(app: App, gate: Gate, path: string) {\n  let file = gate.files.getFileByPath(path);\n  file = app.workspace.getActiveFile();\n  if (file !== null) void app.workspace.getLeaf(false).openFile(file);\n}',
  'import type { App, TFile } from "obsidian";\nimport type { Gate } from "../../../../src/fence/gate/gatekeeper";\nasync function openNote(app: App, file: TFile) {\n  await app.workspace.getLeaf(false).openFile(file);\n}\nexport async function open(app: App, gate: Gate, path: string) {\n  const file = gate.files.getFileByPath(path);\n  if (file !== null) await openNote(app, file);\n}\nexport const later = [openNote];',
  'import type { App, TFile } from "obsidian";\nimport type { Gate } from "../../../../src/fence/gate/gatekeeper";\ndeclare function make(files: unknown, path: string): Promise<TFile>;\ndeclare function found(files: unknown, path: string): TFile | null;\ninterface Place {\n  gate: Pick<Gate, "files" | "metadata">;\n}\nasync function madeNote(place: Place, path: string): Promise<TFile | null> {\n  if (path === "") return null;\n  return make(place.gate.files, path);\n}\nexport async function open(app: App, place: Place, path: string) {\n  const inCampaign = found(place.gate.files, path);\n  if (inCampaign !== null) await app.workspace.getLeaf(false).openFile(inCampaign);\n  const made = await madeNote(place, path);\n  if (made !== null) await app.workspace.getLeaf(false).openFile(made);\n}',
  'import type { App, TFile } from "obsidian";\nimport type { Gate } from "../../../../src/fence/gate/gatekeeper";\nasync function openNote(app: App, file: TFile) {\n  await app.workspace.getLeaf(false).openFile(file);\n}\nexport async function open(app: App, gate: Pick<Gate, "metadata">, linkpath: string) {\n  const found = gate.metadata.getFirstLinkpathDest(linkpath, "");\n  if (found !== null) await openNote(app, found);\n}',
  'import type { App, TFile } from "obsidian";\nimport type { Gate } from "../../../../src/fence/gate/gatekeeper";\ndeclare function make(files: unknown, path: string): Promise<TFile>;\nexport async function open(app: App, gate: Gate, path: string) {\n  let made: TFile;\n  made = await make(gate.files, path);\n  await app.workspace.getLeaf(false).openFile(made);\n}',
  'import type { App, TFile } from "obsidian";\nimport type { Gate } from "../../../../src/fence/gate/gatekeeper";\ndeclare function keep(files: unknown, file: TFile): TFile;\nexport async function open(app: App, gate: Gate, other: TFile) {\n  await app.workspace.getLeaf(false).openFile(keep(gate.files, other));\n}',
  'import type { App, TFile } from "obsidian";\nimport type { Gate } from "../../../../src/fence/gate/gatekeeper";\nexport async function open(app: App, gate: Gate, other: TFile) {\n  await app.workspace.getLeaf(false).openFile(((_files: unknown, file: TFile) => file)(gate.files, other));\n}',
  'import type { App, TFile } from "obsidian";\nimport type { Gate } from "../../../../src/fence/gate/gatekeeper";\nexport async function open(app: App, gate: Gate, path: string, other: TFile) {\n  let file = gate.files.getFileByPath(path);\n  [file] = [other];\n  if (file !== null) await app.workspace.getLeaf(false).openFile(file);\n}',
  'import type { App, TFile } from "obsidian";\nimport type { Gate } from "../../../../src/fence/gate/gatekeeper";\nexport async function open(app: App, gate: Gate, path: string, other: TFile) {\n  let file = gate.files.getFileByPath(path);\n  file ??= other;\n  await app.workspace.getLeaf(false).openFile(file);\n}',
  'import type { App, TFile } from "obsidian";\nimport type { Gate } from "../../../../src/fence/gate/gatekeeper";\nexport async function open(app: App, gate: Gate, path: string, other: TFile) {\n  let file = gate.files.getFileByPath(path);\n  file ||= other;\n  await app.workspace.getLeaf(false).openFile(file);\n}',
  'import type { App, TFile } from "obsidian";\nimport type { Gate } from "../../../../src/fence/gate/gatekeeper";\nexport async function open(app: App, gate: Gate, path: string, other: TFile) {\n  let file: TFile | null = gate.files.getFileByPath(path);\n  file &&= other;\n  if (file !== null) await app.workspace.getLeaf(false).openFile(file);\n}',
  'import type { App, TFile } from "obsidian";\nimport type { Gate } from "../../../../src/fence/gate/gatekeeper";\nexport async function open(app: App, gate: Gate, path: string, other: TFile) {\n  async function show(file: TFile = other) {\n    await app.workspace.getLeaf(false).openFile(file);\n  }\n  if (gate.files.getFileByPath(path) !== null) await show();\n}',
  'import type { App, TFile } from "obsidian";\nimport type { Gate } from "../../../../src/fence/gate/gatekeeper";\nexport async function open(app: App, gate: Gate, path: string) {\n  var file = gate.files.getFileByPath(path);\n  var file = app.workspace.getActiveFile();\n  if (file !== null) await app.workspace.getLeaf(false).openFile(file);\n}',
  'import type { App, TFile } from "obsidian";\nexport async function open(app: App) {\n  let file: TFile;\n  file = file;\n  await app.workspace.getLeaf(false).openFile(file);\n}',
  'import type { App, TFile } from "obsidian";\nimport type { FencedFiles } from "../../../../src/fence/gate/fenced-files";\nexport async function open(app: App, files: FencedFiles | { getFileByPath(path: string): TFile | null }, path: string) {\n  const file = files.getFileByPath(path);\n  if (file !== null) await app.workspace.getLeaf(false).openFile(file);\n}',
];

export const GATED_OPENING_SAMPLES = [
  'import type { App } from "obsidian";\nimport type { Gate } from "../../../../src/fence/gate/gatekeeper";\nexport async function open(app: App, gate: Gate, path: string) {\n  const file = gate.files.getFileByPath(path);\n  if (file !== null) await app.workspace.getLeaf(false).openFile(file);\n}',
  'import type { App } from "obsidian";\nexport const said = (app: App) => app.workspace.trigger("dd-said", {});',
  'import type { App } from "obsidian";\nimport type { Gate } from "../../../../src/fence/gate/gatekeeper";\ninterface Place {\n  gate: Pick<Gate, "files" | "metadata">;\n}\nexport async function open(app: App, place: Place, path: string) {\n  const file = place.gate.files.getFileByPath(path);\n  if (file !== null) await app.workspace.getLeaf(false).openFile(file, { eState: { subpath: "" } });\n}',
  'import type { App } from "obsidian";\nimport type { Gate } from "../../../../src/fence/gate/gatekeeper";\nexport async function open(app: App, gate: Gate, path: string) {\n  const made = await gate.files.create(path, "");\n  await app.workspace.getLeaf(false).openFile(made);\n}',
  'import type { App } from "obsidian";\nimport type { Gate } from "../../../../src/fence/gate/gatekeeper";\nexport async function open(app: App, gate: Gate, path: string) {\n  await app.workspace.getLeaf(false).openFile(await gate.files.create(path, ""));\n}',
];

export const LEAF_SAMPLES = [
  'import type { View, WorkspaceLeaf } from "obsidian";\nexport const show = (leaf: Pick<WorkspaceLeaf, "open">, view: View) => leaf.open(view);',
  'import type { App } from "obsidian";\nexport const file = (app: App) => app.workspace.activeLeaf?.view;',
  'import type { App } from "obsidian";\nexport const leaf = (app: App) => app.workspace.getMostRecentLeaf();',
  'import type { App, WorkspaceLeaf } from "obsidian";\nexport const copy = (app: App, leaf: WorkspaceLeaf) => app.workspace.duplicateLeaf(leaf);',
  'import type { View, WorkspaceLeaf } from "obsidian";\nexport const show = (leaf: WorkspaceLeaf, view: View) => leaf.open(view);',
  'import type { View, WorkspaceLeaf } from "obsidian";\nexport const show = (leaf: WorkspaceLeaf, view: View) => leaf["open"](view);',
  'import type { WorkspaceLeaf } from "obsidian";\nexport function opener(leaf: WorkspaceLeaf) {\n  const { open } = leaf;\n  return open;\n}',
];

export const LEAF_VIEW_SAMPLES = [
  'import type { App } from "obsidian";\nexport const view = (app: App) => app.workspace.getLeaf(false).view;',
  'import type { WorkspaceLeaf } from "obsidian";\nexport const view = (leaf: WorkspaceLeaf) => leaf["view"];',
  'import type { WorkspaceLeaf } from "obsidian";\nexport function shown(leaf: WorkspaceLeaf) {\n  const { view } = leaf;\n  return view;\n}',
  'import type { App } from "obsidian";\nexport const views = (app: App) => app.workspace.getLeavesOfType("markdown").map((leaf) => leaf.view);',
  'import type { App } from "obsidian";\nexport const views = (app: App) => app.workspace.getLeavesOfType("markdown").map(({ view }) => view);',
  'export const view = (leaf: Record<"view", number>) => leaf.view;',
  'export function shown(leaf: Record<"view", number>) {\n  const { view } = leaf;\n  return view;\n}',
];

export const VIEW_FILE_SAMPLES = [
  'import type { MarkdownView } from "obsidian";\nexport const file = (view: Pick<MarkdownView, "file">) => view.file;',
  'import type { MarkdownView } from "obsidian";\nexport const file = (view: MarkdownView) => view.file;',
  'import { MarkdownView, type App, type TFile } from "obsidian";\nexport function files(app: App) {\n  const all: (TFile | null)[] = [];\n  app.workspace.iterateAllLeaves((leaf) => {\n    if (leaf.view instanceof MarkdownView) all.push(leaf.view.file);\n  });\n  return all;\n}',
  'import type { FileView } from "obsidian";\nexport function file(view: FileView) {\n  const { file } = view;\n  return file;\n}',
  'import type { MarkdownFileInfo } from "obsidian";\nexport const file = (info: MarkdownFileInfo) => info["file"];',
  "export const file = (view: any) => view.file;",
  "export function file(view: any) {\n  const { file } = view;\n  return file;\n}",
];
