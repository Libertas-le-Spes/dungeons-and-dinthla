import { describe, expect, it } from "vitest";
import { buildCampaign } from "../../src/campaign/build-campaign";
import type { SessionNote } from "../../src/campaign/campaign";

function session(number: number, lines: string[], firstLine = 0): SessionNote {
  return { path: `Pale Moon/Sessions/Session ${number}.md`, number, text: lines.join("\n"), firstLine };
}

const sessionOne = session(
  1,
  [
    "---",
    "played: 2026-02-28",
    "---",
    "We meet at the [[Gilded Stag]].",
    "! Find the missing caravan, from: [[Lady Vess]], reward: 200 gp",
    "? Who sent the letter",
    "$ Paid 2 gp for rooms",
    "$ Potion of healing",
    "- $ [[Mira]] [[Silvered lantern]]",
  ],
  3,
);

const sessionTwo = session(2, [
  "$ 35 gp 4 sp from the bandits",
  "?+ Who sent the letter: it smelled of lantern oil",
  "!+ Find the missing caravan: tracks lead to [[Old Mill]]",
  "$$ potion of healing :used",
  "found some rope",
]);

const sessionThree = session(3, [
  "?= Who sent the letter: [[Lady Vess]] sent it",
  "!= Find the missing caravan: found it under the Old Mill",
  "$$ Silvered lantern :sold 30gp",
]);

const sessionWithNone = session(4, ["We rested at the Gilded Stag.", ""]);

describe("buildCampaign", () => {
  const campaign = buildCampaign([sessionThree, sessionWithNone, sessionOne, sessionTwo]);

  it("reads a question with its clue and answer, and where each was written", () => {
    expect(campaign.questions).toEqual([
      {
        text: "Who sent the letter",
        source: { path: "Pale Moon/Sessions/Session 1.md", line: 5 },
        clues: [{ text: "it smelled of lantern oil", source: { path: "Pale Moon/Sessions/Session 2.md", line: 1 } }],
        answer: { text: "[[Lady Vess]] sent it", source: { path: "Pale Moon/Sessions/Session 3.md", line: 0 } },
      },
    ]);
  });

  it("reads a quest with its facts, progress and outcome", () => {
    expect(campaign.quests).toEqual([
      {
        quest: { title: "Find the missing caravan", givenBy: "[[Lady Vess]]", reward: "200 gp" },
        source: { path: "Pale Moon/Sessions/Session 1.md", line: 4 },
        progress: [
          { text: "tracks lead to [[Old Mill]]", source: { path: "Pale Moon/Sessions/Session 2.md", line: 2 } },
        ],
        outcome: {
          status: "completed",
          text: "found it under the Old Mill",
          source: { path: "Pale Moon/Sessions/Session 3.md", line: 1 },
        },
      },
    ]);
  });

  it("lists every coin entry in session order, a sale included, and adds up the purse", () => {
    expect(campaign.coins.map((coin) => [coin.source.path, coin.source.line, coin.entry.copper])).toEqual([
      ["Pale Moon/Sessions/Session 1.md", 6, -200],
      ["Pale Moon/Sessions/Session 2.md", 0, 3540],
      ["Pale Moon/Sessions/Session 3.md", 2, 3000],
    ]);
    expect(campaign.purseCopper).toBe(6340);
  });

  it("follows each item to who holds it and whether it is gone", () => {
    expect(campaign.items.map(({ name, holder, gone }) => [name, holder, gone?.kind])).toEqual([
      ["Potion of healing", "", "used"],
      ["Silvered lantern", "Mira", "sold"],
    ]);
  });

  it("matches nothing left over", () => {
    expect(campaign.unmatched).toEqual([]);
  });

  it("reads a session with no marked lines as nothing", () => {
    expect(buildCampaign([sessionWithNone])).toEqual({
      questions: [],
      quests: [],
      coins: [],
      items: [],
      purseCopper: 0,
      unmatched: [],
    });
  });

  it("skips the lines before the note's body", () => {
    const campaign = buildCampaign([session(1, ["---", "? Not a question", "---", "? Who"], 3)]);
    expect(campaign.questions.map((question) => question.text)).toEqual(["Who"]);
  });

  it("orders sessions by number, not by name", () => {
    const campaign = buildCampaign([session(10, ["? Later"]), session(9, ["? Earlier"])]);
    expect(campaign.questions.map((question) => question.text)).toEqual(["Earlier", "Later"]);
  });
});

describe("buildCampaign's follow-ups", () => {
  it("keeps a follow-up that matches nothing, so it can be fixed", () => {
    const campaign = buildCampaign([session(1, ["? Who sent the letter", "?= Who sent a letter: Mira"])]);
    expect(campaign.unmatched).toEqual([
      { text: "?= Who sent a letter: Mira", source: { path: "Pale Moon/Sessions/Session 1.md", line: 1 } },
    ]);
    expect(campaign.questions[0]?.answer).toBeNull();
  });

  it("matches only open questions, so a second answer matches nothing", () => {
    const campaign = buildCampaign([session(1, ["? Who", "?= Who: Mira", "?= Who: Lady Vess"])]);
    expect(campaign.questions[0]?.answer?.text).toBe("Mira");
    expect(campaign.unmatched.map((line) => line.text)).toEqual(["?= Who: Lady Vess"]);
  });

  it("matches only active quests", () => {
    const campaign = buildCampaign([session(1, ["! Find it", "!x Find it: burned", "!+ Find it: tracks"])]);
    expect(campaign.quests[0]?.outcome?.status).toBe("failed");
    expect(campaign.quests[0]?.progress).toEqual([]);
    expect(campaign.unmatched.map((line) => line.text)).toEqual(["!+ Find it: tracks"]);
  });

  it("matches a follow-up to the longest question it starts with", () => {
    const campaign = buildCampaign([session(1, ["? Ring", "? Ring: who made it", "?= Ring: who made it: the elves"])]);
    expect(campaign.questions.map((question) => question.answer?.text)).toEqual([undefined, "the elves"]);
  });

  it("matches a quest follow-up by title, without the quest's facts", () => {
    const campaign = buildCampaign([session(1, ["! Find it, reward: 5 gp", "!= Find it: done"])]);
    expect(campaign.quests[0]?.outcome?.text).toBe("done");
  });

  it("keeps a question's follow-up away from a quest of the same text", () => {
    const campaign = buildCampaign([session(1, ["! Who", "?= Who: Mira"])]);
    expect(campaign.quests[0]?.outcome).toBeNull();
    expect(campaign.unmatched).toHaveLength(1);
  });
});

describe("buildCampaign's items", () => {
  it("records an item changing hands, and who held it before", () => {
    const campaign = buildCampaign([session(1, ["$ [[Mira]] Silvered lantern", "$$ Silvered lantern :changed to [[Thessaly]]"])]);
    const [lantern] = campaign.items;
    expect(lantern?.holder).toBe("Thessaly");
    expect(lantern?.gone).toBeNull();
    expect(lantern?.history.map((event) => [event.kind, event.holder])).toEqual([
      ["named", "Mira"],
      ["changed", "Thessaly"],
    ]);
  });

  it("matches a linked and a plain name whatever their capitals", () => {
    const campaign = buildCampaign([session(1, ["$ [[Mira]] [[Silvered lantern]]", "$$ silvered LANTERN :lost"])]);
    expect(campaign.items).toHaveLength(1);
    expect(campaign.items[0]?.gone?.kind).toBe("lost");
  });

  it("matches a linked name by the note it points to, through an alias or a folder", () => {
    const campaign = buildCampaign([
      session(1, [
        "$ [[Mira]] [[Items/Silvered lantern]]",
        "$$ [[Silvered lantern|the lantern]] :changed to [[Thessaly]]",
        "$$ Silvered lantern :lost",
      ]),
    ]);
    expect(campaign.items.map(({ name, holder, gone }) => [name, holder, gone?.kind])).toEqual([
      ["Silvered lantern", "Thessaly", "lost"],
    ]);
  });

  it("matches a plain name however its spaces are written", () => {
    const campaign = buildCampaign([session(1, ["$ Potion  of healing", "$$ Potion   of healing :used"])]);
    expect(campaign.items.map(({ name, gone }) => [name, gone?.kind])).toEqual([["Potion of healing", "used"]]);
  });

  it("holds an item again when it changes hands after it was gone", () => {
    const campaign = buildCampaign([session(1, ["$ Rope", "$$ Rope :lost", "$$ Rope :changed to [[Mira]]"])]);
    expect(campaign.items[0]?.gone).toBeNull();
    expect(campaign.items[0]?.holder).toBe("Mira");
  });

  it("records an item first named on its $$ line", () => {
    const campaign = buildCampaign([session(1, ["$$ Potion of healing :used"])]);
    expect(campaign.items.map(({ name, gone }) => [name, gone?.kind])).toEqual([["Potion of healing", "used"]]);
  });

  it("keeps the holder when an item is named again without one", () => {
    const campaign = buildCampaign([session(1, ["$ [[Mira]] Rope", "$ Rope"])]);
    expect(campaign.items[0]?.holder).toBe("Mira");
  });

  it("holds an item again when a later line names it after it was gone", () => {
    const campaign = buildCampaign([session(1, ["$ Potion of healing", "$$ Potion of healing :used", "$ Potion of healing"])]);
    expect(campaign.items[0]?.gone).toBeNull();
  });

  it("adds nothing to the purse for a sale with no price", () => {
    const campaign = buildCampaign([session(1, ["$ Rope", "$$ Rope :sold"])]);
    expect(campaign.coins).toEqual([]);
    expect(campaign.items[0]?.gone?.kind).toBe("sold");
  });
});

describe("buildCampaign's empty lines", () => {
  it("skips a question or quest with no text", () => {
    const campaign = buildCampaign([session(1, ["?", "!", "! from: [[Lady Vess]]", "$"])]);
    expect(campaign.questions).toEqual([]);
    expect(campaign.quests).toEqual([]);
    expect(campaign.items).toEqual([]);
  });
});
