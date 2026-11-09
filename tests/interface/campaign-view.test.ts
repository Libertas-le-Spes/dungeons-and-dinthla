import { describe, expect, it, vi } from "vitest";
import { Component, type ViewStateResult, type WorkspaceLeaf } from "obsidian";
import { buildCampaign } from "../../src/campaign/build-campaign";
import type { Campaign } from "../../src/campaign/campaign";
import type { CampaignStore } from "../../src/campaign/campaign-store";
import type { NavSection, PageEntry, PageId } from "../../src/interface/campaign-pages";
import { CAMPAIGN_VIEW, CampaignView } from "../../src/interface/campaign-view";
import { obsidianDocument } from "../views/obsidian-dom";

class FakePage extends Component {
  loaded = false;

  constructor(
    readonly id: PageId,
    readonly contentEl: HTMLElement,
  ) {
    super();
  }

  override onload(): void {
    this.loaded = true;
    this.contentEl.setText(`page ${this.id}`);
  }

  override onunload(): void {
    this.loaded = false;
  }
}

function campaignOf(lines: string[]): Campaign {
  return buildCampaign([{ path: "Pale Moon/Sessions/Session 1.md", number: 1, firstLine: 0, text: lines.join("\n") }]);
}

function entryOf(id: PageId, made: FakePage[], countOf: (campaign: Campaign) => number = () => 0): PageEntry {
  const make = (contentEl: HTMLElement) => {
    const page = new FakePage(id, contentEl);
    made.push(page);
    return page;
  };
  return { id, label: `Label ${id}`, glyph: "?", glyphClass: "dd-marker-question", make, countOf };
}

async function openView({ folder = "Pale Moon" as string | null, questionCount = (campaign: Campaign) => campaign.questions.length } = {}) {
  let listener = () => {};
  const unsubscribe = vi.fn();
  const store = {
    campaignFolder: folder,
    current: campaignOf([]),
    subscribe: (next: () => void) => {
      listener = next;
      return unsubscribe;
    },
  };
  const made: FakePage[] = [];
  const sections: NavSection[] = [
    { heading: null, pages: [entryOf("home", made), entryOf("cast", made)] },
    { heading: "From the notes", pages: [entryOf("questions", made, questionCount), entryOf("funds", made)] },
  ];
  const requestSaveLayout = vi.fn();
  const view = new CampaignView({} as WorkspaceLeaf, store as unknown as CampaignStore, sections);
  view.app = { workspace: { requestSaveLayout } } as unknown as CampaignView["app"];
  const root = obsidianDocument().createElement("div");
  view.contentEl = root;
  view.load();
  await view.onOpen();
  const change = (lines: string[], nextFolder: string | null = folder) => {
    store.current = campaignOf(lines);
    store.campaignFolder = nextFolder;
    listener();
  };
  return { view, root, made, change, unsubscribe, requestSaveLayout };
}

function linkLabelled(root: HTMLElement, label: string): HTMLElement {
  return [...root.querySelectorAll<HTMLElement>(".dd-nav-link")].find((link) => link.textContent!.includes(label))!;
}

function currentLabels(root: HTMLElement): string[] {
  return [...root.querySelectorAll<HTMLElement>('.dd-nav-link[aria-current="page"] .dd-nav-label')].map((label) => label.textContent!);
}

function pageText(root: HTMLElement): string | null {
  return root.querySelector(".dd-page")!.textContent;
}

describe("CampaignView", () => {
  it("gives its type while Obsidian is still building it", () => {
    const view = new CampaignView({} as WorkspaceLeaf, {} as CampaignStore, [{ heading: null, pages: [entryOf("home", [])] }]);
    expect(view.containerEl.getAttribute("data-type")).toBe(CAMPAIGN_VIEW);
  });

  it("opens on its first page, marked as the current one", async () => {
    const { root, made } = await openView();
    expect(made.map((page) => page.id)).toEqual(["home"]);
    expect(made[0]!.loaded).toBe(true);
    expect(pageText(root)).toBe("page home");
    expect(currentLabels(root)).toEqual(["Label home"]);
  });

  it("lists every page in the sidebar, each group under its heading", async () => {
    const { root } = await openView();
    const nav = root.querySelector(".dd-nav")!;
    const shown = [...nav.children].map((child) => child.textContent);
    expect(shown).toEqual(["Pale Moon", "?Label home", "?Label cast", "From the notes", "?Label questions", "?Label funds"]);
  });

  it("shows a page when its link is pressed, closing the one shown before", async () => {
    const { root, made, requestSaveLayout } = await openView();
    linkLabelled(root, "Label funds").click();
    expect(made.map((page) => page.id)).toEqual(["home", "funds"]);
    expect(made[0]!.loaded).toBe(false);
    expect(made[1]!.loaded).toBe(true);
    expect(pageText(root)).toBe("page funds");
    expect(currentLabels(root)).toEqual(["Label funds"]);
    expect(requestSaveLayout).toHaveBeenCalledTimes(2);
  });

  it("leaves the page as it is when its own link is pressed again", async () => {
    const { root, made } = await openView();
    linkLabelled(root, "Label home").click();
    expect(made).toHaveLength(1);
    expect(made[0]!.loaded).toBe(true);
  });

  it("shows the page its state names, and keeps that page in its state", async () => {
    const { view, root } = await openView();
    await view.setState({ page: "cast" }, {} as ViewStateResult);
    expect(pageText(root)).toBe("page cast");
    expect(view.getState()).toEqual({ page: "cast" });
  });

  it("stays on its page when the state names no page it has", async () => {
    const { view, root, made } = await openView();
    await view.setState({ page: "notes" }, {} as ViewStateResult);
    await view.setState({}, {} as ViewStateResult);
    expect(made).toHaveLength(1);
    expect(pageText(root)).toBe("page home");
  });

  it("shows a page's count beside its link, and none for a count of nothing", async () => {
    const { root, change } = await openView();
    change(["? Who sent the letter", "? Who is the pale woman"]);
    expect(linkLabelled(root, "Label questions").querySelector(".dd-nav-count")!.textContent).toBe("2");
    expect(linkLabelled(root, "Label funds").querySelector(".dd-nav-count")!.textContent).toBe("");
  });

  it("names the open campaign at the top of the sidebar, and says when none is open", async () => {
    const { root, change } = await openView();
    change([], null);
    expect(root.querySelector(".dd-nav-campaign")!.textContent).toBe("No campaign open");
  });

  it("closes the shown page and stops listening to the campaign when it is closed", async () => {
    const { view, made, unsubscribe } = await openView();
    await view.onClose();
    view.unload();
    expect(made[0]!.loaded).toBe(false);
    expect(unsubscribe).toHaveBeenCalledOnce();
  });
});
