import { mkdirSync, mkdtempSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { isInCodeMirrorFolder, isInLibraryFolder, isInObsidianFolder, isPictureCssSource, isUnderOneOf, libraryRootsOf } from "../scan/reading/library-paths";
import { ROOT, sourcePath } from "../scan/reading/scan-paths";

const OBSIDIAN_TYPES = `${ROOT}/node_modules/obsidian/obsidian.d.ts`;
const CODE_MIRROR_TYPES = `${ROOT}/node_modules/@codemirror/view/dist/index.d.ts`;
const OTHER_LIBRARY_TYPES = `${ROOT}/node_modules/typescript/lib/lib.dom.d.ts`;
const PICTURE_CSS = sourcePath("campaign/background/picture-css.ts");

interface Sample {
  name: string;
  path: string;
}

function relativeTo(path: string): string {
  return path.replace(ROOT, "<root>");
}

function sampleOf(path: string): Sample {
  return { name: relativeTo(path), path };
}

const OTHER_ROOTS = ["", "/elsewhere", `${ROOT}-copy`, `${ROOT}/tests/fence/scanned`];
const OTHER_FOLDERS = [`${ROOT}/src`, `${ROOT}/tests`, `${ROOT}/packages/pale`];

function lookingLike(folder: string, rest: string): Sample[] {
  const underOtherRoots = OTHER_ROOTS.map((root) => `${root}/node_modules/${folder}${rest}`);
  const underOtherFolders = OTHER_FOLDERS.map((parent) => `${parent}/node_modules/${folder}${rest}`);
  return [...underOtherRoots, ...underOtherFolders].map(sampleOf);
}

describe("the library folder, as the source scan decides it", () => {
  it.each([OBSIDIAN_TYPES, CODE_MIRROR_TYPES, OTHER_LIBRARY_TYPES].map(sampleOf))("holds $name", ({ path }) => {
    expect(isInLibraryFolder(path)).toBe(true);
  });

  it.each(lookingLike("typescript/", "lib/lib.dom.d.ts"))("doesn't hold $name, which only has node_modules in its path", ({ path }) => {
    expect(isInLibraryFolder(path)).toBe(false);
  });

  it("doesn't hold a file of the project's own source", () => {
    expect(isInLibraryFolder(PICTURE_CSS)).toBe(false);
  });
});

describe("Obsidian's folder, as the source scan decides it", () => {
  it("holds Obsidian's types, and not another library's or CodeMirror's", () => {
    expect([OBSIDIAN_TYPES, CODE_MIRROR_TYPES, OTHER_LIBRARY_TYPES].map(isInObsidianFolder)).toEqual([true, false, false]);
  });

  it("holds Obsidian's types in a copy nested inside another library", () => {
    expect(isInObsidianFolder(`${ROOT}/node_modules/plugin-kit/node_modules/obsidian/obsidian.d.ts`)).toBe(true);
  });

  it.each(lookingLike("obsidian/", "obsidian.d.ts"))("doesn't hold $name, which only has node_modules/obsidian in its path", ({ path }) => {
    expect(isInObsidianFolder(path)).toBe(false);
  });

  it("doesn't hold a folder whose name only starts with obsidian", () => {
    expect(isInObsidianFolder(`${ROOT}/node_modules/obsidian-extra/obsidian.d.ts`)).toBe(false);
  });

  it("doesn't hold the project's own file under a folder named obsidian", () => {
    expect(isInObsidianFolder(sourcePath("node_modules/obsidian/obsidian.d.ts"))).toBe(false);
  });
});

describe("CodeMirror's folder, as the source scan decides it", () => {
  it("holds CodeMirror's types, and not Obsidian's or another library's", () => {
    expect([CODE_MIRROR_TYPES, OBSIDIAN_TYPES, OTHER_LIBRARY_TYPES].map(isInCodeMirrorFolder)).toEqual([true, false, false]);
  });

  it("holds CodeMirror's types in a copy nested inside another library", () => {
    expect(isInCodeMirrorFolder(`${ROOT}/node_modules/plugin-kit/node_modules/@codemirror/view/dist/index.d.ts`)).toBe(true);
  });

  it.each(lookingLike("@codemirror/", "view/dist/index.d.ts"))("doesn't hold $name, which only has node_modules/@codemirror in its path", ({ path }) => {
    expect(isInCodeMirrorFolder(path)).toBe(false);
  });
});

const NOT_THE_PICTURE_CSS = [
  `${ROOT}/elsewhere/src/campaign/background/picture-css.ts`,
  sourcePath("copy/src/campaign/background/picture-css.ts"),
  `${ROOT}-copy/src/campaign/background/picture-css.ts`,
  `${ROOT}/tests/fence/scanned/lookalike${PICTURE_CSS}`,
  sourcePath("campaign/background/other-picture-css.ts"),
  sourcePath("campaign/background/campaign-background.ts"),
  `${PICTURE_CSS}.map`,
  `${PICTURE_CSS}x`,
  "/src/campaign/background/picture-css.ts",
  "src/campaign/background/picture-css.ts",
].map(sampleOf);

describe("the picture CSS file, as the source scan decides it", () => {
  it("takes the project's own picture-css file", () => {
    expect(isPictureCssSource(PICTURE_CSS)).toBe(true);
  });

  it.each(NOT_THE_PICTURE_CSS)("doesn't take $name", ({ path }) => {
    expect(isPictureCssSource(path)).toBe(false);
  });
});

describe("the library roots of a project whose node_modules is a link", () => {
  function projectWithLinkedLibraries(): { root: string; store: string; clean: () => void } {
    const base = mkdtempSync(join(tmpdir(), "dd-linked-"));
    const root = join(base, "project");
    const store = join(base, "store");
    mkdirSync(root);
    mkdirSync(join(store, "obsidian"), { recursive: true });
    symlinkSync(store, join(root, "node_modules"));
    return { root, store, clean: () => rmSync(base, { recursive: true, force: true }) };
  }

  it("takes the folder where the link points as a library root too", () => {
    const linked = projectWithLinkedLibraries();
    try {
      expect(libraryRootsOf(linked.root).sort()).toEqual([`${linked.root}/node_modules/`, `${linked.store}/`].sort());
      expect(isUnderOneOf(libraryRootsOf(linked.root), `${linked.store}/obsidian/obsidian.d.ts`)).toBe(true);
    } finally {
      linked.clean();
    }
  });

  it("doesn't take a file beside the folder where the link points", () => {
    const linked = projectWithLinkedLibraries();
    try {
      expect(isUnderOneOf(libraryRootsOf(linked.root), `${linked.store}-extra/obsidian/obsidian.d.ts`)).toBe(false);
      expect(isUnderOneOf(libraryRootsOf(linked.root), `${linked.root}/src/main.ts`)).toBe(false);
    } finally {
      linked.clean();
    }
  });

  it("has only the project's own node_modules as a root when there is none on disk", () => {
    expect(libraryRootsOf("/nowhere/project")).toEqual(["/nowhere/project/node_modules/"]);
  });
});
