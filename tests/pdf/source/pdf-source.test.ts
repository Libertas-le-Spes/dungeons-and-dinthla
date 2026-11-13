import { readdirSync } from "node:fs";
import { relative } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { scannedFiles, unreadableCode } from "../../fence/scan/running/bundle-check";
import { BUNDLED_PROJECT, bundledProjectFiles, entryProject } from "../../fence/scan/running/bundled-project";
import { ROOT, SOURCE_FOLDER, sourcePath, VIRTUAL_FOLDER } from "../../fence/scan/reading/scan-paths";
import { NOTHING_ALLOWED } from "../../fence/scan/running/allowance-sets";
import type { Allowances } from "../../fence/scan/reading/allowances";
import { SourceScanner } from "../../fence/scan/running/source-scanner";
import { virtualFileSystem } from "../../fence/scan/running/virtual-files";
import { PAGE_GLOBALS, PLAIN_GLOBALS } from "../../fence/allowed/globals";

const PDF_PROJECT = `${VIRTUAL_FOLDER}/pdf/tsconfig.json`;
const PDF_ENTRY = "src/pdf/read-pdf-fields.ts";
const PDF_FOLDER = "pdf/";

function isPlainGlobal(name: string): boolean {
  return PLAIN_GLOBALS.includes(name);
}

function isListedFor(path: string, name: string): boolean {
  for (const [file, names] of Object.entries(PAGE_GLOBALS)) {
    if (file.startsWith(PDF_FOLDER) && path === sourcePath(file) && names.includes(name)) return true;
  }
  return false;
}

function isPdfGlobalAllowed(path: string, name: string): boolean {
  return isPlainGlobal(name) || isListedFor(path, name);
}

const PDF_ALLOWANCES: Allowances = { ...NOTHING_ALLOWED, globals: isPdfGlobalAllowed };

const scanner = new SourceScanner(ROOT, virtualFileSystem(VIRTUAL_FOLDER, new Map([[PDF_PROJECT, entryProject("../../../..", `../../../../${PDF_ENTRY}`)]])));
const LOADED = scanner.loadedFiles(PDF_PROJECT);
const SCANNED = scannedFiles(LOADED);

afterAll(() => {
  scanner.close();
});

function pdfListing(): string[] {
  const all = readdirSync(sourcePath("pdf"), { recursive: true, encoding: "utf8", withFileTypes: true });
  return all.filter((entry) => entry.isFile()).map((entry) => `${entry.parentPath}/${entry.name}`);
}

function shownPath(path: string): string {
  return relative(SOURCE_FOLDER, path);
}

describe("the PDF reader's own source", () => {
  it("holds no code the scan can't read, and loads only plain TypeScript from its entry point", () => {
    expect(unreadableCode(pdfListing(), LOADED)).toEqual([]);
  });

  it.each(SCANNED.map(shownPath))("passes every rule of the fence in %s, with nothing allowed but its listed globals", (file) => {
    expect(scanner.breaches(PDF_PROJECT, [sourcePath(file)], PDF_ALLOWANCES)).toEqual([]);
  });

  it("is reached by the plugin's bundle, through the import dialog, so the bundle's own scan covers it too", () => {
    const bundled = new SourceScanner(ROOT, virtualFileSystem(VIRTUAL_FOLDER, bundledProjectFiles()));
    const reached = bundled.loadedFiles(BUNDLED_PROJECT).filter((path) => path.startsWith(sourcePath(PDF_FOLDER)));
    bundled.close();
    expect(reached.sort()).toEqual(pdfListing().sort());
  });

  it("is scanned in every file under src/pdf, and in no file outside it", () => {
    expect([...SCANNED].sort()).toEqual(pdfListing().sort());
  });
});
