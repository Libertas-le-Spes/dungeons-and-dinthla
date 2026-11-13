import { readdirSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { fenceBreaches } from "../../fence/scan/running/bundle-check";
import { BUNDLED_PROJECT, bundledProjectFiles, entryProject } from "../../fence/scan/running/bundled-project";
import { ROOT, SOURCE_FOLDER, sourcePath, VIRTUAL_FOLDER } from "../../fence/scan/reading/scan-paths";
import { NOTHING_ALLOWED } from "../../fence/scan/running/allowance-sets";
import type { Allowances } from "../../fence/scan/reading/allowances";
import { SourceScanner } from "../../fence/scan/running/source-scanner";
import { virtualFileSystem } from "../../fence/scan/running/virtual-files";
import { PAGE_GLOBALS, PLAIN_GLOBALS } from "../../fence/allowed/globals";

const SCAN_TIME = 60_000;
const PDF_PROJECT = `${VIRTUAL_FOLDER}/pdf/tsconfig.json`;
const PDF_ENTRY = "src/pdf/read-pdf-fields.ts";
const PDF_FOLDER = "pdf/";

function pdfPageGlobals(): Record<string, string[]> {
  const found: Record<string, string[]> = {};
  for (const [file, names] of Object.entries(PAGE_GLOBALS)) {
    if (file.startsWith(PDF_FOLDER)) found[file] = names;
  }
  return found;
}

function isPlainGlobal(name: string): boolean {
  return PLAIN_GLOBALS.includes(name);
}

function isListedFor(path: string, name: string): boolean {
  for (const [file, names] of Object.entries(pdfPageGlobals())) {
    if (path.endsWith(`/src/${file}`) && names.includes(name)) return true;
  }
  return false;
}

function isPdfGlobalAllowed(path: string, name: string): boolean {
  return isPlainGlobal(name) || isListedFor(path, name);
}

const PDF_ALLOWANCES: Allowances = { ...NOTHING_ALLOWED, globals: isPdfGlobalAllowed };

let scanner: SourceScanner;

beforeAll(() => {
  const files = new Map([[PDF_PROJECT, entryProject("../../../..", `../../../../${PDF_ENTRY}`)]]);
  scanner = new SourceScanner(ROOT, virtualFileSystem(VIRTUAL_FOLDER, files));
});

afterAll(() => {
  scanner.close();
});

function allowsOnlyPlainGlobals(_path: string, name: string): boolean {
  return isPlainGlobal(name);
}

function sortedLists(lists: Record<string, string[]>): Record<string, string[]> {
  const sorted: Record<string, string[]> = {};
  for (const [file, names] of Object.entries(lists)) sorted[file] = [...names].sort();
  return sorted;
}

function sortedUnique(names: string[]): string[] {
  return [...new Set(names)].sort();
}

function pdfListing(): string[] {
  const all = readdirSync(sourcePath("pdf"), { recursive: true, encoding: "utf8", withFileTypes: true });
  return all.filter((entry) => entry.isFile()).map((entry) => `${entry.parentPath}/${entry.name}`);
}

function namesOf(refused: Record<string, string[]>, file: string): string[] {
  const names = refused[file];
  if (names === undefined) return [];
  return names;
}

function globalsRefused(allowances: Allowances): Record<string, string[]> {
  const refused: Record<string, string[]> = {};
  for (const breach of scanner.breaches(PDF_PROJECT, scanner.loadedFiles(PDF_PROJECT), allowances)) {
    const match = /^src\/(pdf\/[^:]+):\d+ uses the global (\w+)$/.exec(breach);
    if (match === null) continue;
    const [, file, name] = match;
    if (file === undefined || name === undefined) continue;
    refused[file] = [...namesOf(refused, file), name];
  }
  return refused;
}

describe("the PDF reader's own source", () => {
  it("passes every rule of the fence, with only the allowed globals", () => {
    expect(fenceBreaches(scanner, PDF_PROJECT, pdfListing(), PDF_ALLOWANCES)).toEqual([]);
  }, SCAN_TIME);

  it("is reached by the plugin's bundle, through the import dialog, so the bundle's own scan covers it too", () => {
    const bundled = new SourceScanner(ROOT, virtualFileSystem(VIRTUAL_FOLDER, bundledProjectFiles()));
    const reached = bundled.loadedFiles(BUNDLED_PROJECT).filter((path) => path.startsWith(sourcePath("pdf/")));
    bundled.close();
    expect(reached.sort()).toEqual(pdfListing().sort());
  }, SCAN_TIME);

  it("is scanned in every file under src/pdf", () => {
    const scanned = scanner.loadedFiles(PDF_PROJECT).filter((path) => path.startsWith(sourcePath("pdf/")));
    expect(scanned.sort()).toEqual(pdfListing().sort());
  }, SCAN_TIME);

  it("lets only the listed files of src/pdf name a page global, each the globals it still needs", () => {
    const refused = globalsRefused({ ...PDF_ALLOWANCES, globals: allowsOnlyPlainGlobals });
    const named: Record<string, string[]> = {};
    for (const [file, names] of Object.entries(refused)) named[file] = sortedUnique(names);
    expect(named).toEqual(sortedLists(pdfPageGlobals()));
  }, SCAN_TIME);
});
