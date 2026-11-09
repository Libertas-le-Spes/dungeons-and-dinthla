import { describe, expect, it } from "vitest";
import { isSafePath } from "../../src/fence/safe-path";

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

  it("refuses a path Obsidian would write another way", () => {
    for (const path of ["Games//Pale Moon.md", "Games/", "Games/Pale\u00a0Moon.md", "Games/Cafe\u0301.md"]) expect(isSafePath(path)).toBe(false);
  });

  it("takes names that only start with dots", () => {
    expect(isSafePath("Games/..Pale Moon.md")).toBe(true);
  });
});
