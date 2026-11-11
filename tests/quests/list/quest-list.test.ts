import { describe, expect, it } from "vitest";
import { buildCampaign } from "../../../src/campaign/reading/build-campaign";
import { listQuests } from "../../../src/quests/list/quest-list";

const campaign = buildCampaign([
  {
    path: "Pale Moon/Sessions/Session 1.md",
    number: 1,
    firstLine: 0,
    text: [
      "! Find the missing caravan, from: [[Lady Vess]], reward: 200 gp",
      "! Escort [[Mira]] to the ferry",
      "! Clear the Old Mill cellar, reward: a silvered lantern",
      "! Guard the bridge",
      "!= Find the missing caravan: found it under the Old Mill",
      "!x Guard the bridge: the bridge burned",
    ].join("\n"),
  },
]);

function titlesOf(records: { quest: { title: string } }[]): string[] {
  return records.map((record) => record.quest.title);
}

describe("listQuests", () => {
  it("lists active quests newest first, with finished and abandoned ones apart", () => {
    const list = listQuests(campaign, []);
    expect(titlesOf(list.open)).toEqual(["Clear the Old Mill cellar", "Escort [[Mira]] to the ferry"]);
    expect(titlesOf(list.folded)).toEqual(["Guard the bridge", "Find the missing caravan"]);
    expect([list.openCount, list.foldedCount]).toEqual([2, 2]);
  });

  it("finds a quest by who gave it, its reward or what happened, but counts them all", () => {
    expect(titlesOf(listQuests(campaign, ["vess"]).folded)).toEqual(["Find the missing caravan"]);
    expect(titlesOf(listQuests(campaign, ["lantern"]).open)).toEqual(["Clear the Old Mill cellar"]);
    expect(titlesOf(listQuests(campaign, ["burned"]).folded)).toEqual(["Guard the bridge"]);
    expect(listQuests(campaign, ["vess"]).openCount).toBe(2);
  });

  it("keeps only quests holding every keyword, not any of them", () => {
    expect(titlesOf(listQuests(campaign, ["mill", "lantern"]).open)).toEqual(["Clear the Old Mill cellar"]);
    expect(listQuests(campaign, ["cellar", "mira"]).open).toEqual([]);
  });

  it("searches what a link shows, not how it is written", () => {
    expect(titlesOf(listQuests(campaign, ["mira"]).open)).toEqual(["Escort [[Mira]] to the ferry"]);
    expect(listQuests(campaign, ["[["]).open).toEqual([]);
  });
});
