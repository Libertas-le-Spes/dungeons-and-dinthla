import { describe, expect, it } from "vitest";
import { AgreementEnding } from "../../../src/welcome/endings/agreement-ending";
import { CampaignEnding } from "../../../src/welcome/endings/campaign-ending";
import { CampaignsFolderEnding } from "../../../src/welcome/endings/campaigns-folder-ending";
import { FirstSessionEnding } from "../../../src/welcome/endings/first-session-ending";
import { NewCampaignEnding } from "../../../src/welcome/endings/new-campaign-ending";
import type { WelcomeEnding, WelcomeState } from "../../../src/welcome/endings/welcome-ending";
import { endingFor } from "../../../src/welcome/endings/welcome-endings";

const NO_CAMPAIGNS_FOLDER: WelcomeState = { campaignsFolder: null, campaignFolder: null, sessionCount: 0, agreementWanted: false };
const NO_CAMPAIGN: WelcomeState = { campaignsFolder: "D&D", campaignFolder: null, sessionCount: 0, agreementWanted: false };
const NO_SESSIONS: WelcomeState = { campaignsFolder: "D&D", campaignFolder: "D&D/Silver Road", sessionCount: 0, agreementWanted: false };
const SESSIONS: WelcomeState = { campaignsFolder: "D&D", campaignFolder: "D&D/Silver Road", sessionCount: 2, agreementWanted: false };

const NO_SESSIONS_NOT_AGREED: WelcomeState = { ...NO_SESSIONS, agreementWanted: true };
const SESSIONS_NOT_AGREED: WelcomeState = { ...SESSIONS, agreementWanted: true };
const NO_CAMPAIGN_NOT_AGREED: WelcomeState = { ...NO_CAMPAIGN, agreementWanted: true };
const NO_CAMPAIGNS_FOLDER_NOT_AGREED: WelcomeState = { ...NO_CAMPAIGNS_FOLDER, agreementWanted: true };

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

  it("asks for the agreement only in a campaign, while this device hasn't answered it", () => {
    expect(fitsEach(AgreementEnding)).toEqual([false, false, false, false]);
    expect([NO_CAMPAIGNS_FOLDER_NOT_AGREED, NO_CAMPAIGN_NOT_AGREED, NO_SESSIONS_NOT_AGREED, SESSIONS_NOT_AGREED].map(AgreementEnding.fits)).toEqual([false, false, true, true]);
  });

  it("asks for the agreement before the first session and before going to the campaign", () => {
    expect(endingFor(NO_SESSIONS_NOT_AGREED)).toBe(AgreementEnding);
    expect(endingFor(SESSIONS_NOT_AGREED)).toBe(AgreementEnding);
  });

  it("asks for the Campaigns folder and the campaign before the agreement", () => {
    expect(endingFor(NO_CAMPAIGNS_FOLDER_NOT_AGREED)).toBe(CampaignsFolderEnding);
    expect(endingFor(NO_CAMPAIGN_NOT_AGREED)).toBe(NewCampaignEnding);
  });
});
