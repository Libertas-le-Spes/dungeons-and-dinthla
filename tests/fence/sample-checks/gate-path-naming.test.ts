import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { ROOT } from "../scan/reading/scan-paths";

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
  const NAMES_THE_GATE = /fence\/(gate|paths)|\/src\/fence/;

  it("is in one file, so no rule can decide what is the gate's by a path of its own", () => {
    const naming = scannerFiles(SCANNER).filter((file) => NAMES_THE_GATE.test(readFileSync(file, "utf8")));
    expect(naming.map((file) => relative(ROOT, file))).toEqual([relative(ROOT, GATE_PATHS_FILE)]);
  });

  it("reads every file of the scanner, so that is not an empty search", () => {
    expect(scannerFiles(SCANNER).length).toBeGreaterThan(30);
  });
});
