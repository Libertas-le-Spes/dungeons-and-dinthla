import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { ImportedPaths } from "./imported-paths";

export const SOURCE = fileURLToPath(new URL("../../src", import.meta.url));

const ADAPTER_FOLDER = "obsidian";
const GATE_FOLDER = "fence/gate";
const MAIN_FILE = "main.ts";
const OBSIDIAN_MODULE = "obsidian";
const CODE_MIRROR = "@codemirror/";

export const ADAPTER_ONLY_AREAS = ["plugin", "notes", "editor", "reading", "views", "interface"];

function isUnder(path: string, folder: string): boolean {
  return path === folder || path.startsWith(`${folder}/`);
}

export function isAdapterSide(sourcePath: string): boolean {
  if (sourcePath === MAIN_FILE) return true;
  if (isUnder(sourcePath, ADAPTER_FOLDER)) return true;
  return isUnder(sourcePath, GATE_FOLDER);
}

function isHostModule(imported: string): boolean {
  return imported === OBSIDIAN_MODULE || imported.startsWith(`${OBSIDIAN_MODULE}/`) || imported.startsWith(CODE_MIRROR);
}

function reachedSourcePath(file: string, imported: string): string | null {
  if (!imported.startsWith(".")) return null;
  const target = relative(SOURCE, resolve(dirname(file), imported));
  if (target.startsWith("..")) return null;
  return target;
}

function isAdapterTarget(target: string): boolean {
  if (target === MAIN_FILE || target === "main") return true;
  return isUnder(target, ADAPTER_FOLDER) || isUnder(target, GATE_FOLDER);
}

export function coreBreachesOf(reader: ImportedPaths, file: string, text: string): string[] {
  const sourcePath = relative(SOURCE, file);
  if (isAdapterSide(sourcePath)) return [];
  const found: string[] = [];
  for (const imported of reader.in(text)) {
    if (isHostModule(imported)) found.push(`${sourcePath} loads ${imported}`);
    const target = reachedSourcePath(file, imported);
    if (target !== null && isAdapterTarget(target)) found.push(`${sourcePath} imports ${target} from the Obsidian side`);
  }
  return found;
}
