import { describe, expect, it } from "vitest";
import { canMake, wantedKeyOf, type WantedNote } from "../../../src/kind-notes/wanting/wanted-note";
import { fileAt } from "../fake-notes";

function noteWith(lines: string[], sessionFile = fileAt("D&D/Pale Moon/Sessions/Session 2.md")): WantedNote {
  return { path: "D&D/Pale Moon/Questions/Session 2.md", folder: "Questions", sessionPath: "D&D/Pale Moon/Sessions/Session 2.md", sessionFile, lines };
}

describe("canMake", () => {
  it("is true for a note with lines whose session is there", () => {
    expect(canMake(noteWith(["? One"]))).toBe(true);
  });

  it("is false for a note with no lines", () => {
    expect(canMake(noteWith([]))).toBe(false);
  });

  it("is false for a note whose session is gone", () => {
    expect(canMake({ ...noteWith(["? One"]), sessionFile: null })).toBe(false);
  });
});

describe("wantedKeyOf", () => {
  it("is the same for the same lines and differs for other lines or another order", () => {
    expect(wantedKeyOf(noteWith(["a", "b"]))).toBe(wantedKeyOf(noteWith(["a", "b"])));
    expect(wantedKeyOf(noteWith(["a", "b"]))).not.toBe(wantedKeyOf(noteWith(["b", "a"])));
  });
});
