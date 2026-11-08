import { describe, expect, it, vi } from "vitest";
import type { WorkspaceLeaf } from "obsidian";
import { buildCampaign } from "../../src/campaign/build-campaign";
import type { Campaign } from "../../src/campaign/campaign";
import type { CampaignStore } from "../../src/campaign/campaign-store";
import { questsKind } from "../../src/quests/quests-kind";
import { CampaignListView } from "../../src/views/list-view";
import { obsidianDocument } from "./obsidian-dom";

function campaignOf(lines: string[]): Campaign {
  return buildCampaign([{ path: "Pale Moon/Sessions/Session 1.md", number: 1, firstLine: 0, text: lines.join("\n") }]);
}

async function openView(campaign: Campaign) {
  let listener: (campaign: Campaign) => void = () => {};
  const unsubscribe = vi.fn();
  const store = {
    current: campaign,
    subscribe: (next: (campaign: Campaign) => void) => {
      listener = next;
      return unsubscribe;
    },
  };
  const view = new CampaignListView({} as WorkspaceLeaf, store as unknown as CampaignStore, { openSource: vi.fn(), openLink: vi.fn() }, questsKind);
  const document = obsidianDocument();
  const root = document.createElement("div");
  document.body.append(root);
  view.contentEl = root;
  const registered: (() => void)[] = [];
  view.register = (callback) => {
    registered.push(callback);
  };
  await view.onOpen();
  const typeFilter = (text: string) => {
    const filter = root.querySelector(".dd-filter") as HTMLInputElement;
    filter.value = text;
    filter.dispatchEvent(new filter.ownerDocument.defaultView!.Event("input"));
  };
  const change = (next: Campaign) => {
    store.current = next;
    listener(next);
  };
  const close = () => {
    for (const callback of registered) callback();
  };
  return { root, view, typeFilter, change, close, unsubscribe };
}

function textOf(root: HTMLElement, selector: string): string | null | undefined {
  return root.querySelector(selector)?.textContent;
}

describe("CampaignListView", () => {
  it("titles the list and counts what is open, with the folded section named and counted", async () => {
    const { root } = await openView(campaignOf(["! Find it", "! Guard it", "!= Guard it: done"]));
    expect(textOf(root, ".dd-title")).toBe("Active quests1 active");
    expect(textOf(root, ".dd-folded summary")).toBe("Finished1");
    expect((root.querySelector(".dd-folded") as HTMLDetailsElement).open).toBe(false);
  });

  it("gives the empty hint when nothing is open, and says nothing is finished yet", async () => {
    const { root } = await openView(campaignOf([]));
    expect(textOf(root, ".dd-title .dd-count")).toBe("");
    expect(textOf(root, ".dd-list .dd-empty")).toBe("No active quests. Start a note with ! to add one.");
    expect(textOf(root, ".dd-folded .dd-empty")).toBe("Nothing finished yet.");
  });

  it("filters as you type, and says when nothing matches", async () => {
    const { root, typeFilter } = await openView(campaignOf(["! Find the caravan", "! Guard the bridge", "!= Guard the bridge: done"]));
    typeFilter("caravan");
    expect(root.querySelectorAll(".dd-list > li .dd-row")).toHaveLength(1);
    expect(textOf(root, ".dd-folded .dd-empty")).toBe("No finished quest matches “caravan”.");
    typeFilter("zzz");
    expect(textOf(root, ".dd-list .dd-empty")).toBe("No active quest matches “zzz”.");
  });

  it("redraws when the campaign changes", async () => {
    const { root, change } = await openView(campaignOf([]));
    change(campaignOf(["! A new quest"]));
    expect(textOf(root, ".dd-row .dd-text")).toBe("A new quest");
  });

  it("stops listening to the campaign when the view closes", async () => {
    const { close, unsubscribe } = await openView(campaignOf([]));
    close();
    expect(unsubscribe).toHaveBeenCalled();
  });

  it("puts focus back on a row, even once the list has been redrawn", async () => {
    const { root, view, change } = await openView(campaignOf(["! Find it", "! Guard it"]));
    view.focusRow({ path: "Pale Moon/Sessions/Session 1.md", line: 1 });
    expect((root.ownerDocument.activeElement as HTMLElement).dataset.line).toBe("1");
    view.focusRow({ path: "Pale Moon/Sessions/Session 1.md", line: 2 });
    change(campaignOf(["! Find it", "! Guard it", "! A third"]));
    expect((root.ownerDocument.activeElement as HTMLElement).dataset.line).toBe("2");
  });
});
