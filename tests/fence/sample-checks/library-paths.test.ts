import { describe, expect, it } from "vitest";
import { isInCodeMirrorFolder, isInLibraryFolder, isInObsidianFolder, isPictureCssSource } from "../scan/reading/library-paths";
import { ROOT, sourcePath } from "../scan/reading/scan-paths";

const OBSIDIAN_TYPES = `${ROOT}/node_modules/obsidian/obsidian.d.ts`;
const CODE_MIRROR_TYPES = `${ROOT}/node_modules/@codemirror/view/dist/index.d.ts`;
const OTHER_LIBRARY_TYPES = `${ROOT}/node_modules/typescript/lib/lib.dom.d.ts`;
const PICTURE_CSS = sourcePath("campaign/background/picture-css.ts");

const UNDER_ANOTHER_ROOT = ["", "/elsewhere", `${ROOT}-copy`, `${ROOT}/tests/fence/scanned`];
const UNDER_ANOTHER_FOLDER = [`${ROOT}/src/node_modules`, `${ROOT}/tests/node_modules`, `${ROOT}/packages/pale/node_modules`];

function lookingLike(folder: string, rest: string): string[] {
  return [...UNDER_ANOTHER_ROOT.map((root) => `${root}/node_modules/${folder}${rest}`), ...UNDER_ANOTHER_FOLDER.map((parent) => `${parent}/${folder}${rest}`)];
}

describe("the library folder, as the source scan decides it", () => {
  it.each([OBSIDIAN_TYPES, CODE_MIRROR_TYPES, OTHER_LIBRARY_TYPES])("holds %s", (path) => {
    expect(isInLibraryFolder(path)).toBe(true);
  });

  it.each(lookingLike("typescript/", "lib/lib.dom.d.ts"))("doesn't hold %s, which only has node_modules in its path", (path) => {
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

  it.each(lookingLike("obsidian/", "obsidian.d.ts"))("doesn't hold %s, which only has node_modules/obsidian in its path", (path) => {
    expect(isInObsidianFolder(path)).toBe(false);
  });

  it("doesn't hold a folder whose name only starts with obsidian", () => {
    expect(isInObsidianFolder(`${ROOT}/node_modules/obsidian-extra/obsidian.d.ts`)).toBe(false);
  });
});

describe("CodeMirror's folder, as the source scan decides it", () => {
  it("holds CodeMirror's types, and not Obsidian's or another library's", () => {
    expect([CODE_MIRROR_TYPES, OBSIDIAN_TYPES, OTHER_LIBRARY_TYPES].map(isInCodeMirrorFolder)).toEqual([true, false, false]);
  });

  it.each(lookingLike("@codemirror/", "view/dist/index.d.ts"))("doesn't hold %s, which only has node_modules/@codemirror in its path", (path) => {
    expect(isInCodeMirrorFolder(path)).toBe(false);
  });
});

describe("the picture CSS file, as the source scan decides it", () => {
  it("takes the project's own picture-css file", () => {
    expect(isPictureCssSource(PICTURE_CSS)).toBe(true);
  });

  it("takes no other file in its folder", () => {
    expect(isPictureCssSource(sourcePath("campaign/background/campaign-background.ts"))).toBe(false);
  });

  it("takes the file name under another root, another place in src or another prefix or suffix", () => {
    const paths = [
      `${ROOT}/elsewhere/src/campaign/background/picture-css.ts`,
      sourcePath("copy/src/campaign/background/picture-css.ts"),
      `${ROOT}-copy/src/campaign/background/picture-css.ts`,
      `${ROOT}/tests/fence/scanned/lookalike${PICTURE_CSS}`,
      sourcePath("campaign/background/other-picture-css.ts"),
      `${PICTURE_CSS}.map`,
      `${PICTURE_CSS}x`,
      "/src/campaign/background/picture-css.ts",
      "src/campaign/background/picture-css.ts",
    ];
    for (const path of paths) expect(isPictureCssSource(path), path).toBe(false);
  });
});
