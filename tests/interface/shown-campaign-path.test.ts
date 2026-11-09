import { describe, expect, it, vi } from "vitest";
import type { Workspace } from "obsidian";
import { CampaignView } from "../../src/interface/campaign-view";
import { shownCampaignPathOf } from "../../src/interface/shown-campaign-path";

function workspaceShowing(view: unknown) {
  const getActiveViewOfType = vi.fn(() => view);
  return { workspace: { getActiveViewOfType } as unknown as Workspace, getActiveViewOfType };
}

describe("shownCampaignPathOf", () => {
  it("is the note the active campaign tab shows", () => {
    const { workspace, getActiveViewOfType } = workspaceShowing({ shownPath: () => "Pale Moon/Characters/Mira.md" });
    expect(shownCampaignPathOf(workspace)).toBe("Pale Moon/Characters/Mira.md");
    expect(getActiveViewOfType).toHaveBeenCalledExactlyOnceWith(CampaignView);
  });

  it("is nothing when the active tab isn't the campaign tab", () => {
    const { workspace } = workspaceShowing(null);
    expect(shownCampaignPathOf(workspace)).toBeNull();
  });
});
