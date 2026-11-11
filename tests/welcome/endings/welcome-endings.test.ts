import { describe, expect, it } from "vitest";
import { CampaignEnding } from "../../../src/welcome/endings/campaign-ending";
import { CampaignsFolderEnding } from "../../../src/welcome/endings/campaigns-folder-ending";
import { FirstSessionEnding } from "../../../src/welcome/endings/first-session-ending";
import { NewCampaignEnding } from "../../../src/welcome/endings/new-campaign-ending";
import type { WelcomeEnding, WelcomeState } from "../../../src/welcome/endings/welcome-ending";

const NO_CAMPAIGNS_FOLDER: WelcomeState = { campaignsFolder: null, campaignFolder: null, sessionCount: 0 };
const NO_CAMPAIGN: WelcomeState = { campaignsFolder: "D&D", campaignFolder: null, sessionCount: 0 };
const NO_SESSIONS: WelcomeState = { campaignsFolder: "D&D", campaignFolder: "D&D/Silver Road", sessionCount: 0 };
const SESSIONS: WelcomeState = { campaignsFolder: "D&D", campaignFolder: "D&D/Silver Road", sessionCount: 2 };

function fitsEach(ending: WelcomeEnding): boolean[] {
  return [NO_CAMPAIGNS_FOLDER, NO_CAMPAIGN, NO_SESSIONS, SESSIONS].map((state) => ending.fits(state));
}

describe("welcome endings", () => {
  it("asks for the Campaigns folder only while none is set", () => {
    expect(fitsEach(CampaignsFolderEnding)).toEqual([true, false, false, false]);
  });

  it("offers to make a campaign only when the Campaigns folder is set and holds no campaign", () => {
    expect(fitsEach(NewCampaignEnding)).toEqual([false, true, false, false]);
  });

  it("offers the first session only to a campaign with no sessions", () => {
    expect(fitsEach(FirstSessionEnding)).toEqual([false, false, true, false]);
  });

  it("offers to go to the campaign only when it has sessions", () => {
    expect(fitsEach(CampaignEnding)).toEqual([false, false, false, true]);
  });
});
