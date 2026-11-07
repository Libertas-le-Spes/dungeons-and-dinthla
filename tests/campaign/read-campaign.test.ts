import { describe, expect, it } from "vitest";
import { readCampaign } from "../../src/campaign/read-campaign";
import { FakeVault, type FakeNote } from "./fake-vault";

function fakeVault(notes: FakeNote[]): FakeVault {
  return new FakeVault(notes);
}

describe("readCampaign", () => {
  it("reads the campaign's session notes, in number order", async () => {
    const { vault, metadata } = fakeVault([
      { path: "Pale Moon/Sessions/Session 10.md", text: "? Later" },
      { path: "Pale Moon/Sessions/Session 9.md", text: "? Earlier" },
    ]);
    const campaign = await readCampaign(vault, metadata, "Pale Moon");
    expect(campaign.questions.map((question) => [question.text, question.source])).toEqual([
      ["Earlier", { path: "Pale Moon/Sessions/Session 9.md", line: 0 }],
      ["Later", { path: "Pale Moon/Sessions/Session 10.md", line: 0 }],
    ]);
  });

  it("skips the properties at the top of a note", async () => {
    const { vault, metadata } = fakeVault([
      { path: "Pale Moon/Sessions/Session 1.md", text: "---\n! not a quest\n---\n! Find it", propertiesEndLine: 2 },
    ]);
    const campaign = await readCampaign(vault, metadata, "Pale Moon");
    expect(campaign.quests.map((quest) => [quest.quest.title, quest.source.line])).toEqual([["Find it", 3]]);
  });

  it("leaves out notes that aren't this campaign's sessions", async () => {
    const { vault, metadata } = fakeVault([
      { path: "Pale Moon/Sessions/Session 1.md", text: "? Kept" },
      { path: "Pale Moon/Sessions/Notes.md", text: "? Not a session" },
      { path: "Pale Moon/Sessions/Session 2.canvas", text: "? Not a note" },
      { path: "Pale Moon/Sessions/Old/Session 3.md", text: "? In a folder inside" },
      { path: "Pale Moon/Session 4.md", text: "? Outside the Sessions folder" },
      { path: "Ashen Road/Sessions/Session 1.md", text: "? Another campaign" },
    ]);
    const campaign = await readCampaign(vault, metadata, "Pale Moon");
    expect(campaign.questions.map((question) => question.text)).toEqual(["Kept"]);
  });

  it("reads a campaign with no sessions as empty", async () => {
    const { vault, metadata } = fakeVault([]);
    expect(await readCampaign(vault, metadata, "Pale Moon")).toMatchObject({ questions: [], purseCopper: 0 });
  });
});
