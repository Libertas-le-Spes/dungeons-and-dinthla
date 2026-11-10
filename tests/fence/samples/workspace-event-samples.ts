export const NOTE_EVENT_SAMPLES = [
  'import type { App } from "obsidian";\nexport const listen = (app: App, heard: () => void) => app.workspace.on("file-open", heard);',
  'import type { App } from "obsidian";\nexport const listen = (app: App, heard: () => void) => app.workspace.on("active-leaf-change", heard);',
  'import type { App } from "obsidian";\nexport const listen = (app: App, heard: () => void) => app.workspace.on("editor-change", heard);',
  'import type { App } from "obsidian";\nexport const listen = (app: App, heard: () => void) => app.workspace.on("file-menu", heard);',
  'import type { App } from "obsidian";\nexport const listen = (app: App, heard: () => void) => app.workspace.on("editor-menu", heard);',
  'import type { App } from "obsidian";\nexport const listen = (app: App, heard: () => void) => app.workspace.on("quick-preview", heard);',
  'import type { App } from "obsidian";\nexport const listen = (app: App, heard: () => void) => app.workspace["on"]("file-open", heard);',
  'import type { App, Events } from "obsidian";\nexport const listen = (app: App, heard: () => void) => (app.workspace as Events).on("file-open", heard);',
  'import type { Workspace } from "obsidian";\nexport const listen = (workspace: Pick<Workspace, "on">, heard: () => void) => workspace.on("file-open", heard);',
];

export const UNREAD_EVENT_SAMPLES = [
  'import type { App } from "obsidian";\nexport const listen = (app: App, name: "file-open", heard: () => void) => app.workspace.on(name, heard);',
  'import type { App } from "obsidian";\nexport function listener(app: App) {\n  const { on } = app.workspace;\n  return on;\n}',
  'import type { App } from "obsidian";\nexport const listener = (app: App) => app.workspace.on.bind(app.workspace);',
  'import type { App } from "obsidian";\nexport const listen = (app: App, heard: () => void) => app.workspace.on.call(app.workspace, "file-open", heard);',
  'import type { App } from "obsidian";\nexport const listen = (app: App, heard: () => void) => app.workspace.on(`file-${"open"}`, heard);',
];

export const HARMLESS_EVENT_SAMPLES = [
  'import type { App } from "obsidian";\nexport const listen = (app: App, heard: () => void) => app.workspace.on("css-change", heard);',
  'import { Events } from "obsidian";\nexport const listen = (heard: () => void) => new Events().on("dd-said", heard);',
  'export const listen = (bell: { on(name: string, heard: () => void): void }, name: string, heard: () => void) => bell.on(name, heard);',
];
