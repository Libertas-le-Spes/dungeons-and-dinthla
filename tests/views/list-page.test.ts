import { describe, expect, it, vi } from "vitest";
import { buildCampaign } from "../../src/campaign/build-campaign";
import type { Campaign } from "../../src/campaign/campaign";
import type { CampaignStore } from "../../src/campaign/campaign-store";
import { questsKind } from "../../src/quests/quests-kind";
import { ListPage, type ListCreate } from "../../src/views/list-page";
import { obsidianDocument } from "./obsidian-dom";

function campaignOf(lines: string[]): Campaign {
  return buildCampaign([{ path: "Pale Moon/Sessions/Session 1.md", number: 1, firstLine: 0, text: lines.join("\n") }]);
}

async function openPage(campaign: Campaign, create: ListCreate | null = null) {
  let listener: (campaign: Campaign) => void = () => {};
  const unsubscribe = vi.fn();
  const store = {
    current: campaign,
    subscribe: (next: (campaign: Campaign) => void) => {
      listener = next;
      return unsubscribe;
    },
  };
  const document = obsidianDocument();
  const root = document.createElement("div");
  document.body.append(root);
  const openRow = vi.fn();
  const view = new ListPage(root, store as unknown as CampaignStore, vi.fn(), openRow, questsKind, create);
  view.load();
  const typeFilter = (text: string) => {
    const filter = root.querySelector(".dd-filter") as HTMLInputElement;
    filter.value = text;
    filter.dispatchEvent(new filter.ownerDocument.defaultView!.Event("input"));
  };
  const change = (next: Campaign) => {
    store.current = next;
    listener(next);
  };
  const close = () => view.unload();
  const closeDialogOpenedAt = (line: number, changed: boolean) => {
    root.querySelector<HTMLElement>(`[data-line="${line}"]`)!.click();
    const [, onClosed] = openRow.mock.lastCall!;
    onClosed(changed);
  };
  return { root, view, openRow, typeFilter, change, close, closeDialogOpenedAt, unsubscribe };
}

function focusedLine(root: HTMLElement): string | undefined {
  return (root.ownerDocument.activeElement as HTMLElement).dataset.line;
}

function textOf(root: HTMLElement, selector: string): string | null | undefined {
  return root.querySelector(selector)?.textContent;
}

describe("ListPage", () => {
  it("titles the list and counts what is open, with the folded section named and counted", async () => {
    const { root } = await openPage(campaignOf(["! Find it", "! Guard it", "!= Guard it: done"]));
    expect(textOf(root, ".dd-title")).toBe("Active quests1 active");
    expect(textOf(root, ".dd-folded summary")).toBe("Finished1");
    expect((root.querySelector(".dd-folded") as HTMLDetailsElement).open).toBe(false);
  });

  it("gives the empty hint when nothing is open, and says nothing is finished yet", async () => {
    const { root } = await openPage(campaignOf([]));
    expect(textOf(root, ".dd-title .dd-count")).toBe("");
    expect(textOf(root, ".dd-list .dd-empty")).toBe("No active quests. Start a note with ! to add one.");
    expect(textOf(root, ".dd-folded .dd-empty")).toBe("Nothing finished yet.");
  });

  it("filters as you type, and says when nothing matches", async () => {
    const { root, typeFilter } = await openPage(campaignOf(["! Find the caravan", "! Guard the bridge", "!= Guard the bridge: done"]));
    typeFilter("caravan");
    expect(root.querySelectorAll(".dd-list > li .dd-row")).toHaveLength(1);
    expect(textOf(root, ".dd-folded .dd-empty")).toBe("No finished quest matches “caravan”.");
    typeFilter("zzz");
    expect(textOf(root, ".dd-list .dd-empty")).toBe("No active quest matches “zzz”.");
  });

  it("redraws when the campaign changes", async () => {
    const { root, change } = await openPage(campaignOf([]));
    change(campaignOf(["! A new quest"]));
    expect(textOf(root, ".dd-row .dd-text")).toBe("A new quest");
  });

  it("stops listening to the campaign when the view closes", async () => {
    const { close, unsubscribe } = await openPage(campaignOf([]));
    close();
    expect(unsubscribe).toHaveBeenCalled();
  });

  it("puts focus straight back on a row when nothing changed", async () => {
    const { root, closeDialogOpenedAt } = await openPage(campaignOf(["! Find it", "! Guard it"]));
    closeDialogOpenedAt(1, false);
    expect(focusedLine(root)).toBe("1");
  });

  it("puts focus back on a row once the list has redrawn after a change", async () => {
    const { root, change, closeDialogOpenedAt } = await openPage(campaignOf(["! Find it", "! Guard it"]));
    closeDialogOpenedAt(1, true);
    change(campaignOf(["! Find it", "! Guard it", "! A third"]));
    expect(focusedLine(root)).toBe("1");
    expect(root.ownerDocument.activeElement?.isConnected).toBe(true);
  });

  it("opens the folded section to reach a row that moved into it", async () => {
    const { root, change, closeDialogOpenedAt } = await openPage(campaignOf(["! Find it"]));
    closeDialogOpenedAt(0, true);
    change(campaignOf(["! Find it", "!= Find it: found"]));
    expect((root.querySelector(".dd-folded") as HTMLDetailsElement).open).toBe(true);
    expect(focusedLine(root)).toBe("0");
  });

  it("puts focus on the filter when the row is gone", async () => {
    const { root, change, closeDialogOpenedAt } = await openPage(campaignOf(["! Find it"]));
    closeDialogOpenedAt(0, true);
    change(campaignOf([]));
    expect(root.ownerDocument.activeElement?.classList.contains("dd-filter")).toBe(true);
  });

  it("forgets a focus request after one redraw, so it can't steal focus later", async () => {
    const { root, change, closeDialogOpenedAt } = await openPage(campaignOf(["! Find it"]));
    closeDialogOpenedAt(0, true);
    change(campaignOf(["! Find it"]));
    const editor = root.ownerDocument.createElement("input");
    root.ownerDocument.body.append(editor);
    editor.focus();
    change(campaignOf(["! Find it", "! Pay the ferryman"]));
    expect(root.ownerDocument.activeElement).toBe(editor);
  });

  it("shows a create button only when the list can make new items, and hands it a way back", async () => {
    expect((await openPage(campaignOf([]))).root.querySelector(".dd-create")).toBeNull();
    const open = vi.fn();
    const { root } = await openPage(campaignOf([]), { label: "New quest", open });
    const button = root.querySelector(".dd-create") as HTMLElement;
    expect(button.textContent).toBe("New quest");
    button.click();
    expect(open).toHaveBeenCalledTimes(1);
    open.mock.calls[0]![0]();
    expect(root.ownerDocument.activeElement).toBe(button);
  });
});
