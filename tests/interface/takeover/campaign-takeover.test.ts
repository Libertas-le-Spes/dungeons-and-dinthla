import { describe, expect, it, vi } from "vitest";
import type { WorkspaceLeaf } from "obsidian";
import { campaignStateFor } from "../../../src/interface/takeover/campaign-takeover";
import { EditorLeaves } from "../../../src/interface/takeover/editor-leaves";
import { CAMPAIGN_VIEW } from "../../../src/interface/view/campaign-view";

const MIRA = "Pale Moon/Characters/Mira.md";

const LEAF = {};

function takeoverWith({ registered = true, fenced = true, kept = new EditorLeaves() } = {}) {
  return {
    campaignViewRegistered: vi.fn(() => registered),
    holds: vi.fn((path: string) => fenced && path.startsWith("Pale Moon/")),
    campaignFolders: vi.fn(() => ["Pale Moon"]),
    keptInEditor: vi.fn(kept.keeps.bind(kept)),
  };
}

function keptInEditor(leaf: object, path: string): EditorLeaves {
  const kept = new EditorLeaves();
  kept.keep(leaf, path);
  return kept;
}

const TAKEOVER = takeoverWith();

describe("campaignStateFor", () => {
  it("opens a character's note in the campaign tab on their sheet, keeping how it was opened", () => {
    const group = {} as WorkspaceLeaf;
    const opened = { type: "markdown", state: { file: MIRA, mode: "source" }, active: true, pinned: true, group, popstate: true };
    expect(campaignStateFor(opened, LEAF, TAKEOVER)).toEqual({
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
    const main = campaignStateFor({ type: "markdown", state: { file: "Pale Moon/Pale Moon.md" } }, LEAF, TAKEOVER);
    const base = campaignStateFor({ type: "bases", state: { file: "Pale Moon/Characters.base" } }, LEAF, TAKEOVER);
    expect(main.state).toEqual({ page: "home", path: "Pale Moon/Pale Moon.md" });
    expect(base.state).toEqual({ page: "cast", path: "Pale Moon/Characters.base" });
  });

  it("puts the campaign tab's icon and title in place of the note's, so a tab in the background waits as the campaign tab", () => {
    const restored = { type: "markdown", state: { file: MIRA }, icon: "lucide-file", title: "Mira" };
    const taken = campaignStateFor(restored, LEAF, TAKEOVER);
    expect([taken.icon, taken.title]).toEqual(["shield", "Campaign"]);
  });

  it("opens a tab left by the old character sheet on that sheet", () => {
    const old = campaignStateFor({ type: "dungeons-and-dinthla-character-sheet", state: { file: MIRA } }, LEAF, TAKEOVER);
    expect(old.type).toBe(CAMPAIGN_VIEW);
    expect(old.state).toEqual({ page: "cast", path: MIRA });
  });

  it("opens a session note in the campaign tab on the Notes page for that session", () => {
    const session = campaignStateFor({ type: "markdown", state: { file: "Pale Moon/Sessions/Session 1.md", mode: "source" } }, LEAF, TAKEOVER);
    expect(session.type).toBe(CAMPAIGN_VIEW);
    expect(session.state).toEqual({ page: "notes", path: "Pale Moon/Sessions/Session 1.md" });
  });

  it("opens an item's note in the campaign tab on Party funds, with that item open", () => {
    const item = campaignStateFor({ type: "markdown", state: { file: "Pale Moon/Items/Silvered lantern.md" } }, LEAF, TAKEOVER);
    expect(item.type).toBe(CAMPAIGN_VIEW);
    expect(item.state).toEqual({ page: "funds", path: "Pale Moon/Items/Silvered lantern.md" });
  });

  it("opens any other note of the campaign in the campaign tab on its own note page", () => {
    const place = campaignStateFor({ type: "markdown", state: { file: "Pale Moon/Places/Old Mill.md" } }, LEAF, TAKEOVER);
    expect(place.type).toBe(CAMPAIGN_VIEW);
    expect(place.state).toEqual({ page: "note", path: "Pale Moon/Places/Old Mill.md" });
  });

  it("hands back the very same state for a file the campaign tab doesn't show", () => {
    const places = { type: "bases", state: { file: "Pale Moon/Places.base" } };
    const outside = { type: "markdown", state: { file: "Gilded Stag.md" } };
    expect(campaignStateFor(places, LEAF, TAKEOVER)).toBe(places);
    expect(campaignStateFor(outside, LEAF, TAKEOVER)).toBe(outside);
  });

  it("hands back the very same state for a file outside the Campaigns folder, even one in a campaign it was told of", () => {
    const takeover = takeoverWith({ fenced: false });
    const mira = { type: "markdown", state: { file: MIRA } };
    expect(campaignStateFor(mira, LEAF, takeover)).toBe(mira);
    expect(takeover.holds).toHaveBeenCalledExactlyOnceWith(MIRA);
    expect(takeover.campaignFolders).not.toHaveBeenCalled();
  });

  it("hands back the very same state for any other kind of tab, its own included", () => {
    const pdf = { type: "pdf", state: { file: MIRA } };
    const campaign = { type: CAMPAIGN_VIEW, state: { page: "cast", path: MIRA } };
    expect(campaignStateFor(pdf, LEAF, TAKEOVER)).toBe(pdf);
    expect(campaignStateFor(campaign, LEAF, TAKEOVER)).toBe(campaign);
  });

  it("hands back the very same state when the campaign tab isn't registered, so the note opens in the editor", () => {
    const takeover = takeoverWith({ registered: false });
    const mira = { type: "markdown", state: { file: MIRA } };
    expect(campaignStateFor(mira, LEAF, takeover)).toBe(mira);
    expect(takeover.campaignViewRegistered).toHaveBeenCalledOnce();
  });

  it("doesn't look for campaigns when a tab of another kind opens", () => {
    const takeover = takeoverWith();
    campaignStateFor({ type: "pdf", state: { file: MIRA } }, LEAF, takeover);
    campaignStateFor({ type: CAMPAIGN_VIEW, state: { page: "cast", path: MIRA } }, LEAF, takeover);
    campaignStateFor({ type: "markdown", state: { mode: "source" } }, LEAF, takeover);
    expect(takeover.campaignFolders).not.toHaveBeenCalled();
  });

  it("hands back the very same state when it names no file", () => {
    const noState = { type: "markdown" };
    const noFile = { type: "markdown", state: { mode: "source" } };
    const oddFile = { type: "markdown", state: { file: 7 } };
    expect(campaignStateFor(noState, LEAF, TAKEOVER)).toBe(noState);
    expect(campaignStateFor(noFile, LEAF, TAKEOVER)).toBe(noFile);
    expect(campaignStateFor(oddFile, LEAF, TAKEOVER)).toBe(oddFile);
  });

  it("keeps a note opened in Obsidian's editor there when its tab sets it again, as switching to reading view does", () => {
    const takeover = takeoverWith({ kept: keptInEditor(LEAF, MIRA) });
    const reading = { type: "markdown", state: { file: MIRA, mode: "preview" } };
    expect(campaignStateFor(reading, LEAF, takeover)).toBe(reading);
    expect(takeover.keptInEditor).toHaveBeenCalledExactlyOnceWith(LEAF, MIRA);
  });

  it("opens that note in the campaign tab from any other tab", () => {
    const takeover = takeoverWith({ kept: keptInEditor(LEAF, MIRA) });
    const opened = campaignStateFor({ type: "markdown", state: { file: MIRA } }, {}, takeover);
    expect(opened.type).toBe(CAMPAIGN_VIEW);
  });

  it("opens another note of the campaign in the campaign tab from the tab kept in the editor", () => {
    const takeover = takeoverWith({ kept: keptInEditor(LEAF, MIRA) });
    const opened = campaignStateFor({ type: "markdown", state: { file: "Pale Moon/Places/Old Mill.md" } }, LEAF, takeover);
    expect(opened.state).toEqual({ page: "note", path: "Pale Moon/Places/Old Mill.md" });
  });

  it("keeps only Obsidian's editor, so a tab of the old character sheet still opens on the sheet", () => {
    const takeover = takeoverWith({ kept: keptInEditor(LEAF, MIRA) });
    const old = campaignStateFor({ type: "dungeons-and-dinthla-character-sheet", state: { file: MIRA } }, LEAF, takeover);
    expect(old.type).toBe(CAMPAIGN_VIEW);
  });

  it("doesn't ask about the editor for a note outside the Campaigns folder", () => {
    const takeover = takeoverWith({ fenced: false, kept: keptInEditor(LEAF, MIRA) });
    campaignStateFor({ type: "markdown", state: { file: MIRA } }, LEAF, takeover);
    expect(takeover.keptInEditor).not.toHaveBeenCalled();
  });
});
