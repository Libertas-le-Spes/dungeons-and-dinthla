import { describe, expect, it } from "vitest";
import { isSafeNewPath, isSafePath } from "../../src/fence/safe-path";

describe("isSafePath", () => {
  it("takes a plain path inside the vault", () => {
    expect(isSafePath("Games/Pale Moon/Pale Moon.md")).toBe(true);
  });

  it("refuses something that isn't text, or empty text", () => {
    for (const path of [null, undefined, 3, {}, ""]) expect(isSafePath(path)).toBe(false);
  });

  it("refuses a path that starts at the root of the disk", () => {
    for (const path of ["/Games/Pale Moon.md", "C:/Games/Pale Moon.md", "c:Pale Moon.md"]) expect(isSafePath(path)).toBe(false);
  });

  it("refuses a path with a backslash or a null character", () => {
    for (const path of ["Games\\Pale Moon.md", "Games/Pale\0Moon.md"]) expect(isSafePath(path)).toBe(false);
  });

  it("refuses a path that steps up or stays put with dots", () => {
    for (const path of ["Games/../Private.md", "..", "../Private.md", "Games/./Pale Moon.md", "./Pale Moon.md", "Games/.."]) {
      expect(isSafePath(path)).toBe(false);
    }
  });

  it("refuses a path with an empty part", () => {
    for (const path of ["Games//Pale Moon.md", "Games/"]) expect(isSafePath(path)).toBe(false);
  });

  it("takes a name the vault already holds in decomposed letters or with a no-break space", () => {
    for (const path of ["Games/Zoe\u0308.md", "Games/Pale\u00a0Moon.md"]) expect(isSafePath(path)).toBe(true);
  });

  it("takes names that only start with dots", () => {
    expect(isSafePath("Games/..Pale Moon.md")).toBe(true);
  });
});

describe("isSafeNewPath", () => {
  it("takes a plain path as Obsidian writes it", () => {
    expect(isSafeNewPath("Games/Pale Moon/Sessions/Session 2.md")).toBe(true);
  });

  it("refuses a path Obsidian would write another way", () => {
    for (const path of ["Games/Zoe\u0308.md", "Games/Pale\u00a0Moon.md"]) expect(isSafeNewPath(path)).toBe(false);
  });

  it("refuses every path that isn't safe to hold", () => {
    for (const path of [null, "", "/Games/Pale Moon.md", "C:/Games.md", "Games\\Pale Moon.md", "Games/Pale\0Moon.md", "Games/../Private.md", "Games//Pale Moon.md"]) {
      expect(isSafeNewPath(path)).toBe(false);
    }
  });
});
