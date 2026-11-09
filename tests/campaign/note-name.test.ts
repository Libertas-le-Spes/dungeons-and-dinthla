import { describe, expect, it } from "vitest";
import { noteNameOf } from "../../src/campaign/note-name";

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
