import { describe, expect, it } from "vitest";
import { CampaignEnding } from "../../src/welcome/campaign-ending";
import { FirstSessionEnding } from "../../src/welcome/first-session-ending";
import { NewCampaignEnding } from "../../src/welcome/new-campaign-ending";
import type { WelcomeEnding, WelcomeState } from "../../src/welcome/welcome-ending";

const NO_CAMPAIGN: WelcomeState = { campaignFolder: null, sessionCount: 0 };
const NO_SESSIONS: WelcomeState = { campaignFolder: "Silver Road", sessionCount: 0 };
const SESSIONS: WelcomeState = { campaignFolder: "Silver Road", sessionCount: 2 };

function fitsEach(ending: WelcomeEnding): boolean[] {
  return [NO_CAMPAIGN, NO_SESSIONS, SESSIONS].map((state) => ending.fits(state));
}

describe("welcome endings", () => {
  it("offers to make a campaign only when there is no campaign", () => {
    expect(fitsEach(NewCampaignEnding)).toEqual([true, false, false]);
  });

  it("offers the first session only to a campaign with no sessions", () => {
    expect(fitsEach(FirstSessionEnding)).toEqual([false, true, false]);
  });

  it("offers to go to the campaign only when it has sessions", () => {
    expect(fitsEach(CampaignEnding)).toEqual([false, false, true]);
  });
});
