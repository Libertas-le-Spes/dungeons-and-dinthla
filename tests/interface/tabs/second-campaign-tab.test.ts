import { describe, expect, it } from "vitest";
import type { ViewState } from "obsidian";
import { CAMPAIGN_VIEW } from "../../../src/interface/view/campaign-view";
import { campaignTabToMoveInto, type Opening, type OtherCampaignTab } from "../../../src/interface/tabs/second-campaign-tab";

const MIRA_NOTE: ViewState = { type: "markdown", state: { file: "Pale Moon/Characters/Mira.md" } };
const MIRA_SHEET: ViewState = { type: CAMPAIGN_VIEW, state: { page: "cast", path: "Pale Moon/Characters/Mira.md" } };

function openingOf(changes: Partial<Opening> = {}): Opening {
  return { layoutReady: true, step: { typeBefore: "empty", incoming: MIRA_NOTE, sent: MIRA_SHEET }, typeNow: CAMPAIGN_VIEW, ...changes };
}

function otherTab(tab: string, changes: Partial<OtherCampaignTab<string>> = {}): OtherCampaignTab<string> {
  return { tab, pinned: false, sameWindow: true, shown: true, activeTime: 10, ...changes };
}

describe("campaignTabToMoveInto", () => {
  it("is the campaign tab already open when a campaign file opens a second one", () => {
    expect(campaignTabToMoveInto(openingOf(), [otherTab("Pale Moon")])).toBe("Pale Moon");
  });

  it("is the open campaign tab used last when there are several", () => {
    const others = [otherTab("Pale Moon left", { activeTime: 10 }), otherTab("Pale Moon right", { activeTime: 20 })];
    expect(campaignTabToMoveInto(openingOf(), others)).toBe("Pale Moon right");
  });

  it("is nothing while Obsidian is still restoring the workspace", () => {
    expect(campaignTabToMoveInto(openingOf({ layoutReady: false }), [otherTab("Pale Moon")])).toBeNull();
  });

  it("is nothing when going back or forward made the campaign tab", () => {
    const step = { typeBefore: "markdown", incoming: { ...MIRA_NOTE, popstate: true }, sent: { ...MIRA_SHEET, popstate: true } } as Opening["step"];
    expect(campaignTabToMoveInto(openingOf({ step }), [otherTab("Pale Moon")])).toBeNull();
  });

  it("is nothing when the tab was a campaign tab already", () => {
    const step = { typeBefore: CAMPAIGN_VIEW, incoming: MIRA_NOTE, sent: MIRA_SHEET };
    expect(campaignTabToMoveInto(openingOf({ step }), [otherTab("Pale Moon")])).toBeNull();
  });

  it("is nothing when the tab didn't end up a campaign tab", () => {
    expect(campaignTabToMoveInto(openingOf({ typeNow: "markdown" }), [otherTab("Pale Moon")])).toBeNull();
  });

  it("is nothing when the campaign tab itself was asked for, as when splitting it", () => {
    const step = { typeBefore: "empty", incoming: MIRA_SHEET, sent: MIRA_SHEET };
    expect(campaignTabToMoveInto(openingOf({ step }), [otherTab("Pale Moon")])).toBeNull();
  });

  it("leaves pinned campaign tabs and ones in another window alone", () => {
    const others = [otherTab("Pale Moon pinned", { pinned: true }), otherTab("Pale Moon elsewhere", { sameWindow: false })];
    expect(campaignTabToMoveInto(openingOf(), others)).toBeNull();
  });

  it("is nothing when no other campaign tab is open", () => {
    expect(campaignTabToMoveInto(openingOf(), [])).toBeNull();
  });
});
