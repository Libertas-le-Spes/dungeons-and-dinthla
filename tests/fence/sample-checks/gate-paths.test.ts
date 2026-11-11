import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { isGateBuiltSource, isGateSource, isGateTypeSource, isInGateFolder, NAMED_GATE_FILES } from "../scan/reading/gate-paths";
import { ROOT, sourcePath, VIRTUAL_FOLDER } from "../scan/reading/scan-paths";
import { extendsRootConfig } from "../scan/running/sample-scan";

const GATE_FILES = ["gatekeeper", "fenced-files", "fenced-file-actions", "fenced-metadata", "held-files"].map((name) => sourcePath(`fence/gate/${name}.ts`));
const FENCE_TYPE = sourcePath("fence/paths/fence.ts");
const A_PATHS_FILE = sourcePath("fence/paths/safe-path.ts");
const LOOKING_LIKE_THE_GATE = [
  `${ROOT}/tests/fence/scanned/lookalike/src/fence/gate/gatekeeper.ts`,
  sourcePath("other/src/fence/gate/gatekeeper.ts"),
  sourcePath("fence/gate-extra/gatekeeper.ts"),
  sourcePath("fence/gates/gatekeeper.ts"),
  "src/fence/gate/gatekeeper.ts",
];

describe("the gate's folder, as the source scan decides it", () => {
  it.each(GATE_FILES)("holds %s", (file) => {
    expect(isInGateFolder(file)).toBe(true);
  });

  it("doesn't hold a file in src/fence/paths, though it is in src/fence", () => {
    expect(isInGateFolder(A_PATHS_FILE)).toBe(false);
    expect(isInGateFolder(FENCE_TYPE)).toBe(false);
  });

  it.each(LOOKING_LIKE_THE_GATE)("doesn't hold %s, which only looks like the gate's", (path) => {
    expect(isInGateFolder(path)).toBe(false);
  });
});

describe("the files the scan takes for the gate's own, whole path by whole path", () => {
  it("takes the fenced files and the fenced metadata as the gate's sources, and no other file in its folder", () => {
    expect(GATE_FILES.filter(isGateSource)).toEqual([sourcePath("fence/gate/fenced-files.ts"), sourcePath("fence/gate/fenced-metadata.ts")]);
  });

  it("takes those, the file actions, the gatekeeper and the held files as what the gate is built from, and not the fence type", () => {
    expect(GATE_FILES.filter(isGateBuiltSource)).toEqual(GATE_FILES);
    expect(isGateBuiltSource(FENCE_TYPE)).toBe(false);
  });

  it("takes the fence type as a type of the gate too, and not a file beside it", () => {
    expect(GATE_FILES.every(isGateTypeSource)).toBe(true);
    expect(isGateTypeSource(FENCE_TYPE)).toBe(true);
    expect(isGateTypeSource(A_PATHS_FILE)).toBe(false);
  });

  it.each(LOOKING_LIKE_THE_GATE)("takes none of the three for %s", (path) => {
    expect([isGateSource(path), isGateBuiltSource(path), isGateTypeSource(path)]).toEqual([false, false, false]);
  });

  it("takes none of them for the gate's file name under another root or another place in src", () => {
    const suffix = "fence/gate/fenced-files.ts";
    for (const path of [`${ROOT}/elsewhere/src/${suffix}`, sourcePath(`copy/src/${suffix}`), `/${suffix}`]) {
      expect([isGateSource(path), isGateBuiltSource(path), isGateTypeSource(path)], path).toEqual([false, false, false]);
    }
  });
});

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

describe("the files named for the gate", () => {
  it.each(NAMED_GATE_FILES)("includes %s, which is there", (file) => {
    expect(existsSync(file) && statSync(file).isFile()).toBe(true);
  });

  it("names the five files of the gate's folder and the fence type, and nothing else", () => {
    expect([...NAMED_GATE_FILES].sort()).toEqual([...GATE_FILES, FENCE_TYPE].sort());
  });
});

describe("the configuration a sample is scanned under", () => {
  it.each(["one", "one/two", "one/two/three", "one/two/three/four"])("is the repo's own, from a family folder %s deep", (family) => {
    const folder = `${VIRTUAL_FOLDER}/${family}`;
    expect(resolve(folder, extendsRootConfig(folder))).toBe(`${ROOT}/tsconfig.json`);
  });
});
