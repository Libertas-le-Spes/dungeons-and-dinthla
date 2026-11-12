import { describe, expect, it } from "vitest";
import { buildCampaign } from "../../src/campaign/reading/build-campaign";
import type { SessionNote } from "../../src/campaign/record/campaign";
import { kindNoteLines } from "../../src/kind-notes/kind-note-lines";

function session(number: number, lines: string[]): SessionNote {
  return { path: `Pale Moon/Sessions/Session ${number}.md`, number, text: lines.join("\n"), firstLine: 0 };
}

const sessionTwo = session(2, [
  "We reached the mill.",
  "? Who sent [[Lady Vess]] to the Old Mill",
  "- ! Find the caravan, from: [[Lady Vess]]",
  "$ 5 gp for rooms",
  "$ [[Mira]] Silvered lantern",
  "?+ Who sent [[Lady Vess]] to the Old Mill: it smelled of lantern oil",
  "?? Who sent",
  "!! Find the caravan",
  "$$ Silvered lantern",
  "$$ Silvered lantern :changed to [[Baka]]",
  "?= Who is the pale woman: nobody yet",
  "!x Lost the bridge",
]);

const sessionThree = session(3, ["?= Who sent [[Lady Vess]] to the Old Mill: Lady Vess herself", "!+ Find the caravan: tracks lead to the mill"]);

const campaign = buildCampaign([sessionTwo, sessionThree]);

describe("kindNoteLines", () => {
  it("lists a session's question lines and their follow-ups in note order, as written", () => {
    expect(kindNoteLines(campaign, sessionTwo, "Questions")).toEqual([
      "? Who sent [[Lady Vess]] to the Old Mill",
      "?+ Who sent [[Lady Vess]] to the Old Mill: it smelled of lantern oil",
      "?= Who is the pale woman: nobody yet",
    ]);
  });

  it("lists a session's quest lines without the bullet, with an unmatched follow-up", () => {
    expect(kindNoteLines(campaign, sessionTwo, "Quests")).toEqual(["! Find the caravan, from: [[Lady Vess]]", "!x Lost the bridge"]);
  });

  it("lists coin lines and item lines together for Funds, with an item change", () => {
    expect(kindNoteLines(campaign, sessionTwo, "Funds")).toEqual(["$ 5 gp for rooms", "$ [[Mira]] Silvered lantern", "$$ Silvered lantern :changed to [[Baka]]"]);
  });

  it("puts a line written in a later session in that session's note, not the one it follows up", () => {
    expect(kindNoteLines(campaign, sessionThree, "Questions")).toEqual(["?= Who sent [[Lady Vess]] to the Old Mill: Lady Vess herself"]);
    expect(kindNoteLines(campaign, sessionThree, "Quests")).toEqual(["!+ Find the caravan: tracks lead to the mill"]);
  });

  it("never lists a lookup line", () => {
    const all = [...kindNoteLines(campaign, sessionTwo, "Questions"), ...kindNoteLines(campaign, sessionTwo, "Quests"), ...kindNoteLines(campaign, sessionTwo, "Funds")];
    expect(all).not.toContain("?? Who sent");
    expect(all).not.toContain("!! Find the caravan");
    expect(all).not.toContain("$$ Silvered lantern");
  });

  it("lists a sale once, though it is both an item change and a coin line", () => {
    const sold = session(4, ["$$ Silvered lantern :sold 30gp"]);
    expect(kindNoteLines(buildCampaign([sold]), sold, "Funds")).toEqual(["$$ Silvered lantern :sold 30gp"]);
  });

  it("lists nothing for a session with no line of that kind", () => {
    const quiet = session(5, ["We rested."]);
    expect(kindNoteLines(buildCampaign([quiet]), quiet, "Questions")).toEqual([]);
  });
});
