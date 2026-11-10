import { describe, expect, it } from "vitest";
import { buildCampaign } from "../../src/campaign/build-campaign";
import { followUpQuestLine, isCoinReward, isQuestLine, outcomeLine, progressLine, questTextOf, rewardLine } from "../../src/notes/quest-lines";

function questsAfter(lines: string[]) {
  return buildCampaign([{ path: "S/Sessions/Session 1.md", number: 1, firstLine: 0, text: lines.join("\n") }]);
}

describe("quest lines", () => {
  it("writes progress, completion and abandonment lines that read back to their quest", () => {
    const title = "Find the missing caravan";
    const campaign = questsAfter([
      `! ${title}, reward: 200 gp`,
      progressLine(title, "tracks lead\n to the mill"),
      outcomeLine("completed", title, "found it"),
    ]);
    expect(campaign.quests[0]?.notes.map((note) => note.text)).toEqual(["tracks lead to the mill"]);
    expect(campaign.quests[0]?.closing).toMatchObject({ status: "completed", text: "found it" });
    expect(outcomeLine("failed", title, "")).toBe(`!x ${title}:`);
    expect(questsAfter([`! ${title}`, outcomeLine("failed", title, "")]).quests[0]?.closing).toMatchObject({ status: "failed", text: "" });
  });

  it("writes a follow-up quest after the earlier one, and reads a typed quest without its marker", () => {
    expect(followUpQuestLine(" ! Escort [[Mira]] ", "Find it")).toBe("! Escort [[Mira]], after: Find it");
    expect(questTextOf("  !  Find\n it ")).toBe("Find it");
  });

  it("writes a collected reward as coin in, for the quest", () => {
    const line = rewardLine("+200 gp", "Find it");
    expect(line).toBe("$ +200 gp reward, for: Find it");
    expect(questsAfter([line]).coins[0]?.entry.copper).toBe(20000);
  });

  it("knows a coin reward from one that isn't coin", () => {
    expect(isCoinReward("200 gp")).toBe(true);
    expect(isCoinReward("a silvered lantern")).toBe(false);
    expect(isCoinReward("-5 gp")).toBe(false);
  });

  it("knows a quest's own line by its title, facts aside", () => {
    expect(isQuestLine("- ! Find it, from: [[Lady Vess]], reward: 5 gp", "Find it")).toBe(true);
    expect(isQuestLine("! Find it again", "Find it")).toBe(false);
    expect(isQuestLine("!= Find it: done", "Find it")).toBe(false);
  });
});
