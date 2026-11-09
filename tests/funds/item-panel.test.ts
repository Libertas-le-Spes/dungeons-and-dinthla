import { describe, expect, it, vi } from "vitest";
import { buildCampaign } from "../../src/campaign/build-campaign";
import type { Campaign } from "../../src/campaign/campaign";
import type { NoteChanged, NoteTexts } from "../../src/campaign/note-texts";
import { CHANGE_ITEM, CLOSE_ITEM, EDIT_NOTE, EMPTY_STORY, ItemPanel, NOTE_MISSING, noLineText } from "../../src/funds/item-panel";
import { obsidianDocument } from "../views/obsidian-dom";

const LANTERN = "Pale Moon/Items/Silvered lantern.md";
const STORY = "Mira found it in the cellar of the [[Gilded Stag]].\n\nIts light shows things the moon hides.";

function campaignOf(...sessions: string[][]): Campaign {
  return buildCampaign(
    sessions.map((lines, index) => ({ path: `Pale Moon/Sessions/Session ${index + 1}.md`, number: index + 1, firstLine: 0, text: lines.join("\n") })),
  );
}

async function openPanel(campaign: Campaign, story: string | null = STORY, path = LANTERN) {
  let campaignChanged = () => {};
  const stopHearingCampaign = vi.fn();
  const store = {
    current: campaign,
    subscribe: (listener: () => void) => {
      campaignChanged = listener;
      return stopHearingCampaign;
    },
  };
  const changedListeners = new Set<NoteChanged>();
  const read = vi.fn(async () => story);
  const texts: NoteTexts = {
    read,
    onChanged: (changed) => {
      changedListeners.add(changed);
      return () => changedListeners.delete(changed);
    },
    onGone: () => () => {},
  };
  const needs = { store, texts, actions: { openRow: vi.fn(), openLink: vi.fn() }, openItem: vi.fn(), editNote: vi.fn(), close: vi.fn() };
  const document = obsidianDocument();
  const root = document.createElement("section");
  document.body.append(root);
  const panel = new ItemPanel(root, path, needs);
  panel.load();
  await vi.waitFor(() => expect(read).toHaveBeenCalledExactlyOnceWith(path));
  await Promise.resolve();
  const change = (next: Campaign) => {
    store.current = next;
    campaignChanged();
  };
  const noteChanged = (notePath: string, text: string) => {
    for (const listener of changedListeners) listener(notePath, text);
  };
  const facts = () => Array.from(root.querySelectorAll(".dd-item-fact-list > *")).map((fact) => fact.textContent);
  const storyLines = () => Array.from(root.querySelectorAll(".dd-item-story p")).map((line) => line.textContent);
  const button = (text: string) => Array.from(root.querySelectorAll("button")).find((candidate) => candidate.textContent === text)!;
  return { root, panel, needs, change, noteChanged, facts, story: storyLines, button, changedListeners, stopHearingCampaign };
}

describe("ItemPanel", () => {
  it("shows the item's name, who holds it and that it is held", async () => {
    const { root, facts } = await openPanel(campaignOf(["$ [[Mira]] [[Silvered lantern]]"]));
    expect(root.querySelector(".dd-item-name")!.textContent).toBe("Silvered lantern");
    expect(facts()).toEqual(["Held by", "Mira", "Status", "Held"]);
  });

  it("names the party as the holder of an item no one holds", async () => {
    const { facts } = await openPanel(campaignOf(["$$ Silvered lantern :changed to the party"]));
    expect(facts()).toEqual(["Held by", "The party", "Status", "Held"]);
  });

  it("says who last held an item that is gone, and how it went", async () => {
    const sold = await openPanel(campaignOf(["$ [[Mira]] [[Silvered lantern]]"], ["$$ Silvered lantern :sold 30 gp"]));
    expect(sold.facts()).toEqual(["Last held by", "Mira", "Status", "Sold"]);
    const used = await openPanel(campaignOf(["$ Potion of healing", "$$ Potion of healing :used"]), "", "Pale Moon/Items/Potion of healing.md");
    expect(used.facts()).toEqual(["Last held by", "The party", "Status", "Used up"]);
    const lost = await openPanel(campaignOf(["$ [[Mira]] [[Silvered lantern]]", "$$ Silvered lantern :lost"]));
    expect(lost.facts()).toEqual(["Last held by", "Mira", "Status", "Lost"]);
  });

  it("finds the item whatever the capitals of its note's name", async () => {
    const { facts } = await openPanel(campaignOf(["$ [[Mira]] silvered Lantern"]));
    expect(facts()).toEqual(["Held by", "Mira", "Status", "Held"]);
  });

  it("says when no line names the item yet, and how to add one, offering no change", async () => {
    const { root, facts, button } = await openPanel(campaignOf(["$ Potion of healing"]));
    expect(facts()).toEqual([]);
    expect(root.querySelector(".dd-item-facts .dd-empty")!.textContent).toBe(noLineText("Silvered lantern"));
    expect(noLineText("Silvered lantern")).toBe(
      "No session line names Silvered lantern yet, so no one holds it. A line like “$$ [[Silvered lantern]] :changed to the party” in a session gives it to the party.",
    );
    expect(button(CHANGE_ITEM)).toBeUndefined();
  });

  it("opens a story link with the line it sits on in the note, counting blank lines and properties", async () => {
    const { root, needs } = await openPanel(campaignOf([]), `---\nrarity: rare\n---\nFound in a cellar.\n\nIt lit @[[Old Mill]].`);
    (root.querySelector(".dd-item-story a") as HTMLElement).click();
    expect(needs.actions.openLink).toHaveBeenCalledExactlyOnceWith("Old Mill", { path: LANTERN, line: 5 }, false);
  });

  it("shows the story written in its note below its properties, line by line, with its links", async () => {
    const { story, root, needs } = await openPanel(campaignOf([]), `---\nrarity: rare\n---\n${STORY}`);
    expect(story()).toEqual(["Mira found it in the cellar of the [[Gilded Stag]].", "Its light shows things the moon hides."]);
    (root.querySelector(".dd-item-story a") as HTMLElement).click();
    expect(needs.actions.openLink).toHaveBeenCalledExactlyOnceWith("Gilded Stag", { path: LANTERN, line: 3 }, false);
  });

  it("says when its note has no story yet, or isn't there", async () => {
    expect((await openPanel(campaignOf([]), "---\nrarity: rare\n---\n")).story()).toEqual([EMPTY_STORY]);
    expect((await openPanel(campaignOf([]), null)).story()).toEqual([NOTE_MISSING]);
  });

  it("follows changes to the item and to its note, and to no other note", async () => {
    const { change, noteChanged, facts, story } = await openPanel(campaignOf(["$ [[Mira]] [[Silvered lantern]]"]));
    change(campaignOf(["$ [[Mira]] [[Silvered lantern]]", "$$ Silvered lantern :changed to [[Thessaly]]"]));
    expect(facts()).toEqual(["Held by", "Thessaly", "Status", "Held"]);
    noteChanged("Pale Moon/Places/Old Mill.md", "The wheel turns.");
    expect(story()).toEqual(["Mira found it in the cellar of the [[Gilded Stag]].", "Its light shows things the moon hides."]);
    noteChanged(LANTERN, "Lady Vess wants it back.");
    expect(story()).toEqual(["Lady Vess wants it back."]);
  });

  it("opens the item's dialog to change its holder or status, and puts focus back after", async () => {
    const { button, needs, root } = await openPanel(campaignOf(["$ [[Mira]] [[Silvered lantern]]"]));
    const change = button(CHANGE_ITEM);
    change.click();
    expect(needs.openItem).toHaveBeenCalledOnce();
    const [name, source, onClosed] = needs.openItem.mock.calls[0]!;
    expect([name, source]).toEqual(["Silvered lantern", { path: "Pale Moon/Sessions/Session 1.md", line: 0 }]);
    onClosed(true);
    expect(root.ownerDocument.activeElement).toBe(change);
  });

  it("opens its note to edit, and goes back to all items", async () => {
    const { button, needs } = await openPanel(campaignOf([]));
    button(EDIT_NOTE).click();
    expect(needs.editNote).toHaveBeenCalledExactlyOnceWith(LANTERN);
    button(CLOSE_ITEM).click();
    expect(needs.close).toHaveBeenCalledOnce();
  });

  it("stops listening to the campaign and the note when it is closed", async () => {
    const { panel, changedListeners, stopHearingCampaign } = await openPanel(campaignOf([]));
    panel.unload();
    expect(changedListeners.size).toBe(0);
    expect(stopHearingCampaign).toHaveBeenCalledOnce();
  });
});
