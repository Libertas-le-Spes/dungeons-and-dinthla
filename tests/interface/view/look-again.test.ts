import { describe, expect, it } from "vitest";
import { lookAgain, type LookAgainNeeds } from "../../../src/interface/view/look-again";

function needsWith(startingFolder: string | null, chooseFails = false) {
  const done: string[] = [];
  const needs: LookAgainNeeds = {
    startingCampaignFolder: () => startingFolder,
    closeCampaign: () => done.push("closed"),
    chooseCampaign: async (folder) => {
      if (chooseFails) throw new Error("data.json is read-only.");
      done.push(`chose ${folder}`);
    },
    showBackgrounds: () => done.push("backgrounds"),
    showCampaignTabsAgain: () => done.push("tabs"),
  };
  return { needs, done };
}

describe("lookAgain", () => {
  it("opens the starting campaign, then shows the backgrounds and the campaign tabs again", async () => {
    const { needs, done } = needsWith("Games/D&D/Pale Moon");
    await lookAgain(needs);
    expect(done).toEqual(["chose Games/D&D/Pale Moon", "backgrounds", "tabs"]);
  });

  it("closes the campaign when the Campaigns folder holds none, then shows the backgrounds and the campaign tabs again", async () => {
    const { needs, done } = needsWith(null);
    await lookAgain(needs);
    expect(done).toEqual(["closed", "backgrounds", "tabs"]);
  });

  it("still shows the backgrounds and the campaign tabs again when the campaign can't be chosen, and says why", async () => {
    const { needs, done } = needsWith("Games/D&D/Pale Moon", true);
    await expect(lookAgain(needs)).rejects.toThrow("data.json is read-only.");
    expect(done).toEqual(["backgrounds", "tabs"]);
  });
});
