import { existsSync, readdirSync, statSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { GATE_TYPE_SOURCES, isGateBuiltSource, isGateSource, isGateTypeSource, isInGateFolder } from "../scan/reading/gate-paths";
import { ROOT, sourcePath } from "../scan/reading/scan-paths";

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

const GATE_SOURCES = [sourcePath("fence/gate/fenced-files.ts"), sourcePath("fence/gate/fenced-metadata.ts")];
const OTHERS_IN_GATE_FOLDER = readdirSync(sourcePath("fence/gate"))
  .map((name) => sourcePath(`fence/gate/${name}`))
  .filter((file) => !GATE_SOURCES.includes(file));

describe("the other files in the gate's folder, read from the folder", () => {
  it("are there, so that is not an empty list", () => {
    expect(OTHERS_IN_GATE_FOLDER).toContain(sourcePath("fence/gate/folder-choices.ts"));
    expect(OTHERS_IN_GATE_FOLDER).toContain(sourcePath("fence/gate/gatekeeper.ts"));
  });

  it.each(OTHERS_IN_GATE_FOLDER)("aren't taken as a gate source: %s", (file) => {
    expect(isGateSource(file)).toBe(false);
  });
});

describe("the files named for the gate", () => {
  it.each(GATE_TYPE_SOURCES)("includes %s, which is there", (file) => {
    expect(existsSync(file) && statSync(file).isFile()).toBe(true);
  });

  it("names the five files of the gate's folder and the fence type, and nothing else", () => {
    expect([...GATE_TYPE_SOURCES].sort()).toEqual([...GATE_FILES, FENCE_TYPE].sort());
  });
});
