export const IMPORT_SAMPLES = [
  'import { FileSystemAdapter } from "obsidian";\nexport const read = (path: string) => FileSystemAdapter.readLocalFile(path);',
  'import type { FileSystemAdapter } from "obsidian";\nexport const make = (adapter: FileSystemAdapter, path: string) => adapter.mkdir(path);',
  'import { FileSystemAdapter, type TFile } from "obsidian";\nimport type { Gate } from "../../../../src/fence/gatekeeper";\nexport async function steal(gate: Gate, picture: TFile) {\n  const base = gate.files.getResourcePath(picture);\n  return FileSystemAdapter.readLocalFile(`${base}/../Private/Primary.md`);\n}',
  'import { FileSystemAdapter as Files } from "obsidian";\nexport const read = (path: string) => Files["readLocal" + "File"](path);',
  'import * as obsidian from "obsidian";\nexport const files = (key: "Notice") => obsidian[key];',
  'import obsidian from "obsidian";\nexport const files = obsidian;',
  'export * from "obsidian";',
  'export { CapacitorAdapter } from "obsidian";',
  'export { Notice as Shown } from "obsidian";\nexport { FileSystemAdapter as Files } from "obsidian";',
  'import { MarkdownPreviewRenderer } from "obsidian";\nexport const hook = (run: (el: HTMLElement) => void) => MarkdownPreviewRenderer.registerPostProcessor(run);',
  'import { requestUrl } from "obsidian";\nexport const ask = (url: string) => requestUrl(url);',
  'import { readFileSync } from "node:fs";\nexport const read = (path: string) => readFileSync(path, "utf8");',
  'import type { DataAdapter } from "obsidian";\nexport const list = (adapter: DataAdapter, path: string) => adapter.list(path);',
  'import { Platform } from "obsidian";\nexport const desktop = Platform.isDesktopApp;',
];

export const ALLOWED_IMPORT_SAMPLES = ['import { Notice, type App, type TFile } from "obsidian";\nexport const say = (_app: App, file: TFile) => new Notice(file.path);', 'export { Notice } from "obsidian";'];
