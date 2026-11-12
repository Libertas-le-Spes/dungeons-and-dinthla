import { describe, expect, it } from "vitest";
import { SessionWants } from "../../../src/kind-notes/wanting/session-wants";
import { FakeCampaign } from "../fake-campaign";
import { fileAt } from "../fake-notes";
import { CAMPAIGN, SESSION } from "../keeper-setup";

function wantsFor(campaign: FakeCampaign) {
  return new SessionWants(campaign, { getFileByPath: (path: string) => fileAt(path) });
}

describe("SessionWants", () => {
  it("wants the lines of the session the campaign holds", () => {
    const campaign = new FakeCampaign();
    campaign.hold(SESSION, "? Who sent Mira");
    const lines = wantsFor(campaign).notesFor(SESSION).map((note) => note.lines);
    expect(lines).toEqual([["? Who sent Mira"], [], []]);
  });

  it("wants nothing while the campaign is still opening, so no note is emptied from a campaign not yet built", () => {
    const campaign = new FakeCampaign();
    campaign.hold(SESSION, "? Who sent Mira");
    campaign.opening = true;
    expect(wantsFor(campaign).notesFor(SESSION)).toEqual([]);
    expect(wantsFor(campaign).opening).toBe(true);
  });

  it("wants nothing while no campaign is open", () => {
    const campaign = new FakeCampaign();
    campaign.campaignFolder = null;
    expect(wantsFor(campaign).notesFor(SESSION)).toEqual([]);
    expect(wantsFor(campaign).notesOfGoneSession(SESSION)).toEqual([]);
  });

  it("wants no lines for a gone session, though the campaign still holds it", () => {
    const campaign = new FakeCampaign();
    campaign.hold(SESSION, "? Who sent Mira");
    const notes = wantsFor(campaign).notesOfGoneSession(SESSION);
    expect(notes.map((note) => note.lines)).toEqual([[], [], []]);
    expect(notes.map((note) => note.sessionFile)).toEqual([null, null, null]);
  });

  it("knows a session of the open campaign from any other path", () => {
    const campaign = new FakeCampaign();
    const wants = wantsFor(campaign);
    expect(wants.isSession(SESSION)).toBe(true);
    expect(wants.isSession(`${CAMPAIGN}/Questions/Session 2.md`)).toBe(false);
    expect(wants.isSession("D&D/Silver Road/Sessions/Session 2.md")).toBe(false);
  });

  it("lists the sessions the campaign holds", () => {
    const campaign = new FakeCampaign();
    campaign.hold(SESSION, "");
    expect(wantsFor(campaign).sessionPaths()).toEqual([SESSION]);
  });
});
