import { describe, expect, it } from "vitest";
import { LinkWriter, MORE_THAN_LINK_NAMES } from "../../../src/session-notes/renumbering/link-writer";
import type { NewTarget } from "../../../src/session-notes/renumbering/wiki-links";
import { FakeCampaignFiles } from "./fake-campaign-files";

const NOTE = "Pale Moon/Characters/Mira.md";
const FOUR_TO_THREE: NewTarget = (target) => {
  if (target === "Session 4") return "Session 3";
  return null;
};

function drifting(): NewTarget {
  let asked = 0;
  return () => {
    asked += 1;
    return `Session ${asked}`;
  };
}

describe("LinkWriter", () => {
  it("writes the note with its link targets changed, through the gate", async () => {
    const files = new FakeCampaignFiles({ [NOTE]: "Met in [[Session 4]].\n" });
    await new LinkWriter(files).rewrite(NOTE, FOUR_TO_THREE);
    expect(files.textAt(NOTE)).toBe("Met in [[Session 3]].\n");
    expect(files.process).toHaveBeenCalledTimes(1);
  });

  it("keeps the note's properties exactly", async () => {
    const text = "---\r\nfrom: \"[[Session 4]]\"\r\n---\r\nMet in [[Session 4]].\r\n";
    const files = new FakeCampaignFiles({ [NOTE]: text });
    await new LinkWriter(files).rewrite(NOTE, FOUR_TO_THREE);
    expect(files.textAt(NOTE)).toBe("---\r\nfrom: \"[[Session 4]]\"\r\n---\r\nMet in [[Session 3]].\r\n");
  });

  it("refuses, writing nothing, when the read-back finds more than link targets changed", async () => {
    const files = new FakeCampaignFiles({ [NOTE]: "Met in [[Session 4]].\n" });
    await expect(new LinkWriter(files).rewrite(NOTE, drifting())).rejects.toThrow(MORE_THAN_LINK_NAMES);
    expect(files.textAt(NOTE)).toBe("Met in [[Session 4]].\n");
  });

  it("refuses with the note's name when the note is gone", async () => {
    const files = new FakeCampaignFiles({});
    await expect(new LinkWriter(files).rewrite(NOTE, FOUR_TO_THREE)).rejects.toThrow(`${NOTE} was moved or deleted`);
  });
});
