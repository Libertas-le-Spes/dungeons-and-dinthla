import { readdirSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { fenceBreaches } from "../../fence/scan/running/bundle-check";
import { entryProject } from "../../fence/scan/running/bundled-project";
import { ROOT, SOURCE_FOLDER, sourcePath, VIRTUAL_FOLDER } from "../../fence/scan/reading/scan-paths";
import { NOTHING_ALLOWED } from "../../fence/scan/running/allowance-sets";
import type { Allowances } from "../../fence/scan/reading/allowances";
import { SourceScanner } from "../../fence/scan/running/source-scanner";
import { virtualFileSystem } from "../../fence/scan/running/virtual-files";
import { isPdfGlobalAllowed, isPdfPlainGlobal, isPlainGlobal, PDF_FILE_GLOBALS, PDF_PLAIN_GLOBALS } from "./pdf-globals";

const SCAN_TIME = 60_000;
const PDF_PROJECT = `${VIRTUAL_FOLDER}/pdf/tsconfig.json`;
const PDF_ENTRY = "src/pdf/read-pdf-fields.ts";
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
  return isPlainGlobal(name) || isPdfPlainGlobal(name);
}

function allowsEverythingButTypedArrays(path: string, name: string): boolean {
  return isPdfGlobalAllowed(path, name) && !isPdfPlainGlobal(name);
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

  it("is scanned in every file under src/pdf", () => {
    const scanned = scanner.loadedFiles(PDF_PROJECT).filter((path) => path.startsWith(sourcePath("pdf/")));
    expect(scanned.sort()).toEqual(pdfListing().sort());
  }, SCAN_TIME);

  it("lets only the platform inflating file name DecompressionStream and Blob, which it still needs", () => {
    const refused = globalsRefused({ ...PDF_ALLOWANCES, globals: allowsOnlyPlainGlobals });
    const named: Record<string, string[]> = {};
    for (const [file, names] of Object.entries(refused)) named[file] = sortedUnique(names);
    expect(named).toEqual(PDF_FILE_GLOBALS);
  }, SCAN_TIME);

  it("lists the typed-array globals only because a file still uses them", () => {
    const refused = globalsRefused({ ...PDF_ALLOWANCES, globals: allowsEverythingButTypedArrays });
    expect(sortedUnique(Object.values(refused).flat())).toEqual([...PDF_PLAIN_GLOBALS].sort());
  }, SCAN_TIME);
});
