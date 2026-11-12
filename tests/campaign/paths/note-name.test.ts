import { describe, expect, it } from "vitest";
import { foldersPartOf, markdownEndingOf, noteNameOf } from "../../../src/campaign/paths/note-name";

describe("noteNameOf", () => {
  it("is the note's file name without its folders or the Markdown ending", () => {
    expect(noteNameOf("Pale Moon/Places/Old Mill.md")).toBe("Old Mill");
    expect(noteNameOf("Gilded Stag.md")).toBe("Gilded Stag");
  });

  it("keeps a dot that isn't the Markdown ending", () => {
    expect(noteNameOf("Pale Moon/Items/Potion no. 2.md")).toBe("Potion no. 2");
    expect(noteNameOf("Pale Moon/Items/Silvered lantern.md.bak")).toBe("Silvered lantern.md.bak");
  });
});

describe("markdownEndingOf", () => {
  it("is the Markdown ending when the path has it, and nothing otherwise", () => {
    expect(markdownEndingOf("Sessions/Session 4.md")).toBe(".md");
    expect(markdownEndingOf("Sessions/Session 4")).toBe("");
    expect(markdownEndingOf("Sessions/Session 4.md.bak")).toBe("");
  });
});

describe("foldersPartOf", () => {
  it("is the folders of the path with the slash after the last, and nothing for a bare name", () => {
    expect(foldersPartOf("Pale Moon/Sessions/Session 4")).toBe("Pale Moon/Sessions/");
    expect(foldersPartOf("Session 4")).toBe("");
  });
});
