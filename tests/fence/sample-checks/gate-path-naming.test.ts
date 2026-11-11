import { readdirSync, readFileSync } from "node:fs";
import { basename, join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { GATE_TYPE_SOURCES, isInGateFolder } from "../scan/reading/gate-paths";
import { ROOT } from "../scan/reading/scan-paths";

const GATE_FOLDER_NAMES = GATE_TYPE_SOURCES.filter(isInGateFolder).map((path) => basename(path, ".ts"));
const OTHER_GATE_NAMES = GATE_TYPE_SOURCES.filter((path) => !isInGateFolder(path)).map((path) => basename(path));
const GATE_FILE_NAMES = [...GATE_FOLDER_NAMES, ...OTHER_GATE_NAMES].map((name) => name.replaceAll(".", "\\."));
const GATE_FOLDERS = ["fence\\/(gate|paths)", "\\/src\\/fence"];

function scannerFiles(folder: string): string[] {
  return readdirSync(folder, { withFileTypes: true }).flatMap((entry) => {
    const path = join(folder, entry.name);
    if (entry.isDirectory()) return scannerFiles(path);
    return [path];
  });
}

describe("where the source scan names the gate's paths", () => {
  const SCANNER = join(ROOT, "tests", "fence", "scan");
  const GATE_PATHS_FILE = join(SCANNER, "reading", "gate-paths.ts");
  const NAMES_THE_GATE = new RegExp([...GATE_FOLDERS, ...GATE_FILE_NAMES].join("|"));

  it("is in one file, so no rule can decide what is the gate's by a path of its own", () => {
    const naming = scannerFiles(SCANNER).filter((file) => NAMES_THE_GATE.test(readFileSync(file, "utf8")));
    expect(naming.map((file) => relative(ROOT, file))).toEqual([relative(ROOT, GATE_PATHS_FILE)]);
  });

  it("looks for the gate's file names as well as its folders, so a rule can't decide by a file name alone", () => {
    expect(GATE_FILE_NAMES.length).toBe(GATE_TYPE_SOURCES.length);
    for (const name of ["gatekeeper", "fenced-files", "fence.ts"]) expect(NAMES_THE_GATE.test(`path.endsWith("${name}")`), name).toBe(true);
  });

  it("reads every file of the scanner, so that is not an empty search", () => {
    expect(scannerFiles(SCANNER).length).toBeGreaterThan(30);
  });
});
