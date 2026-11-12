import { describe, expect, it } from "vitest";
import { KIND_NOTE_SOURCES, kindNoteFolders } from "../../../src/kind-notes/sources/kind-note-sources";
import { TRACKED_KINDS } from "../../../src/kinds/tracked-kinds";

describe("the kind note sources", () => {
  it("hold every tracked kind once", () => {
    const kinds = KIND_NOTE_SOURCES.map((source) => source.kind);
    expect(kinds).toHaveLength(Object.keys(TRACKED_KINDS).length);
    for (const kind of Object.values(TRACKED_KINDS)) expect(kinds).toContain(kind);
  });

  it("name each kind note folder once, though coins and items share Funds", () => {
    expect(kindNoteFolders()).toEqual(["Questions", "Quests", "Funds"]);
  });
});
