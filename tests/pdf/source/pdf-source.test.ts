import { readdirSync } from "node:fs";
import { relative } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { scannedFiles, unreadableCode } from "../../fence/scan/running/bundle-check";
import { BUNDLED_PROJECT, bundledProjectFiles, entryProject } from "../../fence/scan/running/bundled-project";
import { ROOT, SOURCE_FOLDER, sourcePath, VIRTUAL_FOLDER } from "../../fence/scan/reading/scan-paths";
import { NOTHING_ALLOWED } from "../../fence/scan/running/allowance-sets";
import type { Allowances } from "../../fence/scan/reading/allowances";
import { fileUsing, type NameRefusal } from "../../fence/scan/running/name-uses";
import { SourceScanner } from "../../fence/scan/running/source-scanner";
import { virtualFileSystem } from "../../fence/scan/running/virtual-files";
import { isPdfGlobalAllowed, isPdfPlainGlobal, isPlainGlobal, PDF_FILE_GLOBALS, PDF_PLAIN_GLOBALS } from "./pdf-globals";

const PDF_PROJECT = `${VIRTUAL_FOLDER}/pdf/tsconfig.json`;
const PDF_ENTRY = "src/pdf/read-pdf-fields.ts";
const PDF_ALLOWANCES: Allowances = { ...NOTHING_ALLOWED, globals: isPdfGlobalAllowed };
const GLOBAL_BREACH = /^src\/pdf\/[^:]+:\d+ uses the global (?<name>\w+)$/;

const scanner = new SourceScanner(ROOT, virtualFileSystem(VIRTUAL_FOLDER, new Map([[PDF_PROJECT, entryProject("../../../..", `../../../../${PDF_ENTRY}`)]])));
const LOADED = scanner.loadedFiles(PDF_PROJECT);
const SCANNED = scannedFiles(LOADED);

afterAll(() => {
  scanner.close();
});

function allowsOnlyPlainGlobals(_path: string, name: string): boolean {
  return isPlainGlobal(name) || isPdfPlainGlobal(name);
}

function allowsEverythingButTypedArrays(path: string, name: string): boolean {
  return isPdfGlobalAllowed(path, name) && !isPdfPlainGlobal(name);
}

const FILE_GLOBALS_REFUSED: NameRefusal = { allowances: { ...PDF_ALLOWANCES, globals: allowsOnlyPlainGlobals }, breach: GLOBAL_BREACH };

const TYPED_ARRAYS_REFUSED: NameRefusal = { allowances: { ...PDF_ALLOWANCES, globals: allowsEverythingButTypedArrays }, breach: GLOBAL_BREACH };

function pdfListing(): string[] {
  const all = readdirSync(sourcePath("pdf"), { recursive: true, encoding: "utf8", withFileTypes: true });
  return all.filter((entry) => entry.isFile()).map((entry) => `${entry.parentPath}/${entry.name}`);
}

function shownPath(path: string): string {
  return relative(SOURCE_FOLDER, path);
}

interface FileGlobal {
  file: string;
  name: string;
}

function fileGlobals(): FileGlobal[] {
  const listed: FileGlobal[] = [];
  for (const [file, names] of Object.entries(PDF_FILE_GLOBALS)) {
    for (const name of names) listed.push({ file, name });
  }
  return listed;
}

describe("the PDF reader's own source", () => {
  it("holds no code the scan can't read, and loads only plain TypeScript from its entry point", () => {
    expect(unreadableCode(pdfListing(), LOADED)).toEqual([]);
  });

  it.each(SCANNED.map(shownPath))("passes every rule of the fence in %s, with only the allowed globals", (file) => {
    expect(scanner.breaches(PDF_PROJECT, [sourcePath(file)], PDF_ALLOWANCES)).toEqual([]);
  });

  it("is not reached by the plugin's bundle yet; once it is, move PDF_FILE_GLOBALS and PDF_PLAIN_GLOBALS into the shared allowed globals and the source allowances, and delete tests/pdf/source/pdf-globals.ts", () => {
    const bundled = new SourceScanner(ROOT, virtualFileSystem(VIRTUAL_FOLDER, bundledProjectFiles()));
    const reached = bundled.loadedFiles(BUNDLED_PROJECT).filter((path) => path.startsWith(sourcePath("pdf/")));
    bundled.close();
    expect(reached).toEqual([]);
  });

  it("is scanned in every file under src/pdf, and in no file outside it", () => {
    expect([...SCANNED].sort()).toEqual(pdfListing().sort());
  });

  it.each(fileGlobals())("lets only $file use the global $name, which it still needs", ({ file, name }) => {
    expect(fileUsing(scanner, PDF_PROJECT, [sourcePath(file)], name, FILE_GLOBALS_REFUSED)).not.toBeNull();
  });

  it.each(PDF_PLAIN_GLOBALS)("lists the typed-array global %s only because a file still uses it", (name) => {
    expect(fileUsing(scanner, PDF_PROJECT, SCANNED, name, TYPED_ARRAYS_REFUSED)).not.toBeNull();
  });

  it("names each allowed global once in each list", () => {
    expect(new Set(PDF_PLAIN_GLOBALS).size).toBe(PDF_PLAIN_GLOBALS.length);
    for (const names of Object.values(PDF_FILE_GLOBALS)) expect(new Set(names).size).toBe(names.length);
  });
});
