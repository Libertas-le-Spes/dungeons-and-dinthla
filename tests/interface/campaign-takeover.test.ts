import { describe, expect, it, vi } from "vitest";
import type { WorkspaceLeaf } from "obsidian";
import { campaignStateFor } from "../../src/interface/campaign-takeover";
import { CAMPAIGN_VIEW } from "../../src/interface/campaign-view";

const MIRA = "Pale Moon/Characters/Mira.md";

function takeoverWith({ registered = true } = {}) {
  return { campaignViewRegistered: vi.fn(() => registered), campaignFolders: vi.fn(() => ["Pale Moon"]) };
}

const TAKEOVER = takeoverWith();

describe("campaignStateFor", () => {
  it("opens a character's note in the campaign tab on their sheet, keeping how it was opened", () => {
    const group = {} as WorkspaceLeaf;
    const opened = { type: "markdown", state: { file: MIRA, mode: "source" }, active: true, pinned: true, group, popstate: true };
    expect(campaignStateFor(opened, TAKEOVER)).toEqual({
      type: CAMPAIGN_VIEW,
      state: { page: "cast", path: MIRA },
      active: true,
      pinned: true,
      group,
      popstate: true,
      icon: "shield",
      title: "Campaign",
    });
  });

  it("opens the main note on the dashboard and the Characters base on the Characters page", () => {
    const main = campaignStateFor({ type: "markdown", state: { file: "Pale Moon/Pale Moon.md" } }, TAKEOVER);
    const base = campaignStateFor({ type: "bases", state: { file: "Pale Moon/Characters.base" } }, TAKEOVER);
    expect(main.state).toEqual({ page: "home", path: "Pale Moon/Pale Moon.md" });
    expect(base.state).toEqual({ page: "cast", path: "Pale Moon/Characters.base" });
  });

  it("puts the campaign tab's icon and title in place of the note's, so a tab in the background waits as the campaign tab", () => {
    const restored = { type: "markdown", state: { file: MIRA }, icon: "lucide-file", title: "Mira" };
    const taken = campaignStateFor(restored, TAKEOVER);
    expect([taken.icon, taken.title]).toEqual(["shield", "Campaign"]);
  });

  it("opens a tab left by the old character sheet on that sheet", () => {
    const old = campaignStateFor({ type: "dungeons-and-dinthla-character-sheet", state: { file: MIRA } }, TAKEOVER);
    expect(old.type).toBe(CAMPAIGN_VIEW);
    expect(old.state).toEqual({ page: "cast", path: MIRA });
  });

  it("opens a session note in the campaign tab on the Notes page for that session", () => {
    const session = campaignStateFor({ type: "markdown", state: { file: "Pale Moon/Sessions/Session 1.md", mode: "source" } }, TAKEOVER);
    expect(session.type).toBe(CAMPAIGN_VIEW);
    expect(session.state).toEqual({ page: "notes", path: "Pale Moon/Sessions/Session 1.md" });
  });

  it("hands back the very same state for a file the campaign tab doesn't show", () => {
    const place = { type: "markdown", state: { file: "Pale Moon/Places/Old Mill.md" } };
    expect(campaignStateFor(place, TAKEOVER)).toBe(place);
  });

  it("hands back the very same state for any other kind of tab, its own included", () => {
    const pdf = { type: "pdf", state: { file: MIRA } };
    const campaign = { type: CAMPAIGN_VIEW, state: { page: "cast", path: MIRA } };
    expect(campaignStateFor(pdf, TAKEOVER)).toBe(pdf);
    expect(campaignStateFor(campaign, TAKEOVER)).toBe(campaign);
  });

  it("hands back the very same state when the campaign tab isn't registered, so the note opens in the editor", () => {
    const takeover = takeoverWith({ registered: false });
    const mira = { type: "markdown", state: { file: MIRA } };
    expect(campaignStateFor(mira, takeover)).toBe(mira);
    expect(takeover.campaignViewRegistered).toHaveBeenCalledOnce();
  });

  it("doesn't look for campaigns when a tab of another kind opens", () => {
    const takeover = takeoverWith();
    campaignStateFor({ type: "pdf", state: { file: MIRA } }, takeover);
    campaignStateFor({ type: CAMPAIGN_VIEW, state: { page: "cast", path: MIRA } }, takeover);
    campaignStateFor({ type: "markdown", state: { mode: "source" } }, takeover);
    expect(takeover.campaignFolders).not.toHaveBeenCalled();
  });

  it("hands back the very same state when it names no file", () => {
    const noState = { type: "markdown" };
    const noFile = { type: "markdown", state: { mode: "source" } };
    const oddFile = { type: "markdown", state: { file: 7 } };
    expect(campaignStateFor(noState, TAKEOVER)).toBe(noState);
    expect(campaignStateFor(noFile, TAKEOVER)).toBe(noFile);
    expect(campaignStateFor(oddFile, TAKEOVER)).toBe(oddFile);
  });
});
