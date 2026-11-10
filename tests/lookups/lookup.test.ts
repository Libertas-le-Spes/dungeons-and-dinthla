import { describe, expect, it } from "vitest";
import { buildCampaign } from "../../src/campaign/build-campaign";
import type { Campaign } from "../../src/campaign/campaign";
import { lookupMatches, readLookup, type Lookup } from "../../src/lookups/lookup";

const SESSION = "Pale Moon/Sessions/Session 1.md";

function campaignOf(lines: string[]): Campaign {
  return buildCampaign([{ path: SESSION, number: 1, firstLine: 0, text: lines.join("\n") }]);
}

function textsFor(campaign: Campaign, lookup: Lookup): string[] {
  return lookupMatches(campaign, lookup).map((match) => match.text);
}

describe("readLookup", () => {
  it("reads ??, !! and $$ with the words typed after them", () => {
    expect(readLookup("?? Letter  from")).toEqual({ kind: "question", keywords: ["letter", "from"] });
    expect(readLookup("  !!caravan")).toEqual({ kind: "quest", keywords: ["caravan"] });
    expect(readLookup("$$ lan")).toEqual({ kind: "item", keywords: ["lan"] });
    expect(readLookup("??")).toEqual({ kind: "question", keywords: [] });
    expect(readLookup("?? who :lost")).toEqual({ kind: "question", keywords: ["who", ":lost"] });
  });

  it("leaves other lines alone, and a $$ line once it says what happened", () => {
    for (const line of ["? Who", "?+ Who: a clue", "! Find it", "$ 5 gp", "- ?? letter", "$$ Lantern :sold 30 gp", "$$ Rope :changed to [[Mira]]"]) {
      expect(readLookup(line), line).toBeNull();
    }
  });
});

describe("lookupMatches", () => {
  it("suggests open questions holding every word typed, newest first", () => {
    const campaign = campaignOf(["? Who sent the letter", "? Where is the letter", "?= Where is the letter: the mill", "? Why the [[Letter|seal]]", "? Who rode"]);
    expect(textsFor(campaign, { kind: "question", keywords: ["letter"] })).toEqual(["Who sent the letter"]);
    expect(textsFor(campaign, { kind: "question", keywords: ["seal"] })).toEqual(["Why the [[Letter|seal]]"]);
    expect(textsFor(campaign, { kind: "question", keywords: ["who", "letter"] })).toEqual(["Who sent the letter"]);
    expect(textsFor(campaign, { kind: "question", keywords: [] })).toEqual(["Who rode", "Why the [[Letter|seal]]", "Who sent the letter"]);
  });

  it("suggests active quests, matching their giver and reward too", () => {
    const campaign = campaignOf(["! Find the caravan, from: [[Lady Vess]]", "! Clear the mill, reward: 50 gp", "!= Clear the mill: done", "! Guard the caravan"]);
    expect(textsFor(campaign, { kind: "quest", keywords: ["caravan"] })).toEqual(["Guard the caravan", "Find the caravan"]);
    expect(textsFor(campaign, { kind: "quest", keywords: ["vess"] })).toEqual(["Find the caravan"]);
    expect(textsFor(campaign, { kind: "quest", keywords: ["mill"] })).toEqual([]);
  });

  it("suggests held items, matching who holds them", () => {
    const campaign = campaignOf(["$ [[Mira]] Silvered lantern", "$ Rope", "$ Torch", "$$ Torch :lost", "$ [[Bram]] Lantern oil"]);
    expect(lookupMatches(campaign, { kind: "item", keywords: ["lantern"] }).map((match) => [match.text, match.holder])).toEqual([
      ["Lantern oil", "Bram"],
      ["Silvered lantern", "Mira"],
    ]);
    expect(textsFor(campaign, { kind: "item", keywords: ["mira"] })).toEqual(["Silvered lantern"]);
    expect(textsFor(campaign, { kind: "item", keywords: ["torch"] })).toEqual([]);
  });

  it("suggests at most eight", () => {
    const campaign = campaignOf(Array.from({ length: 10 }, (_, index) => `? Question ${index}`));
    expect(textsFor(campaign, { kind: "question", keywords: [] })).toHaveLength(8);
    expect(textsFor(campaign, { kind: "question", keywords: [] })[0]).toBe("Question 9");
    const items = campaignOf(Array.from({ length: 10 }, (_, index) => `$ Item ${index}`));
    expect(textsFor(items, { kind: "item", keywords: [] })).toHaveLength(8);
  });
});
