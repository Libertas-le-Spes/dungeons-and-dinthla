import { describe, expect, it } from "vitest";
import { RowKeys, sourceKeyOf } from "../../../src/views/lists/row-keys";
import { obsidianDocument } from "../obsidian-dom";

describe("RowKeys", () => {
  it("gives back the key a row was marked with", () => {
    const keys = new RowKeys();
    const row = obsidianDocument().body.createDiv();
    keys.mark(row, "Silvered lantern");
    expect(keys.keyOf(row)).toBe("Silvered lantern");
  });

  it("gives nothing for a row it never marked", () => {
    expect(new RowKeys().keyOf(obsidianDocument().body.createDiv())).toBeUndefined();
  });

  it("keys a source by its path and line, so two lines of one note differ", () => {
    expect(sourceKeyOf({ path: "D&D/Pale Moon/Sessions/Session 1.md", line: 2 })).not.toBe(sourceKeyOf({ path: "D&D/Pale Moon/Sessions/Session 1.md", line: 3 }));
  });
});
