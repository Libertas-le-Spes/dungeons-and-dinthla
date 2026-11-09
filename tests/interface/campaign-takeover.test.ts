import { describe, expect, it } from "vitest";
import type { WorkspaceLeaf } from "obsidian";
import { campaignStateFor } from "../../src/interface/campaign-takeover";
import { CAMPAIGN_VIEW } from "../../src/interface/campaign-view";

const FOLDERS = ["Pale Moon"];
const MIRA = "Pale Moon/Characters/Mira.md";

describe("campaignStateFor", () => {
  it("opens a character's note in the campaign tab on their sheet, keeping how it was opened", () => {
    const group = {} as WorkspaceLeaf;
    const opened = { type: "markdown", state: { file: MIRA, mode: "source" }, active: true, pinned: true, group, popstate: true };
    expect(campaignStateFor(opened, FOLDERS)).toEqual({
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
    const main = campaignStateFor({ type: "markdown", state: { file: "Pale Moon/Pale Moon.md" } }, FOLDERS);
    const base = campaignStateFor({ type: "bases", state: { file: "Pale Moon/Characters.base" } }, FOLDERS);
    expect(main.state).toEqual({ page: "home", path: "Pale Moon/Pale Moon.md" });
    expect(base.state).toEqual({ page: "cast", path: "Pale Moon/Characters.base" });
  });

  it("puts the campaign tab's icon and title in place of the note's, so a tab in the background waits as the campaign tab", () => {
    const restored = { type: "markdown", state: { file: MIRA }, icon: "lucide-file", title: "Mira" };
    const taken = campaignStateFor(restored, FOLDERS);
    expect([taken.icon, taken.title]).toEqual(["shield", "Campaign"]);
  });

  it("opens a tab left by the old character sheet on that sheet", () => {
    const old = campaignStateFor({ type: "dungeons-and-dinthla-character-sheet", state: { file: MIRA } }, FOLDERS);
    expect(old.type).toBe(CAMPAIGN_VIEW);
    expect(old.state).toEqual({ page: "cast", path: MIRA });
  });

  it("hands back the very same state for a file the campaign tab doesn't show", () => {
    const session = { type: "markdown", state: { file: "Pale Moon/Sessions/Session 1.md" } };
    expect(campaignStateFor(session, FOLDERS)).toBe(session);
  });

  it("hands back the very same state for any other kind of tab, its own included", () => {
    const pdf = { type: "pdf", state: { file: MIRA } };
    const campaign = { type: CAMPAIGN_VIEW, state: { page: "cast", path: MIRA } };
    expect(campaignStateFor(pdf, FOLDERS)).toBe(pdf);
    expect(campaignStateFor(campaign, FOLDERS)).toBe(campaign);
  });

  it("hands back the very same state when it names no file", () => {
    const noState = { type: "markdown" };
    const noFile = { type: "markdown", state: { mode: "source" } };
    const oddFile = { type: "markdown", state: { file: 7 } };
    expect(campaignStateFor(noState, FOLDERS)).toBe(noState);
    expect(campaignStateFor(noFile, FOLDERS)).toBe(noFile);
    expect(campaignStateFor(oddFile, FOLDERS)).toBe(oddFile);
  });
});
