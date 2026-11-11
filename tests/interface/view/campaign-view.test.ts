import { describe, expect, it, vi } from "vitest";
import { Component, type ViewStateResult, type WorkspaceLeaf } from "obsidian";
import { buildCampaign } from "../../../src/campaign/reading/build-campaign";
import type { Campaign } from "../../../src/campaign/record/campaign";
import type { CampaignStore } from "../../../src/campaign/reading/campaign-store";
import type { NavSection, PageEntry, PageId, PathAfterDelete, ShowPage, StayOn } from "../../../src/interface/view/campaign-pages";
import { CAMPAIGN_VIEW, CampaignView, type ViewFiles } from "../../../src/interface/view/campaign-view";
import { campaignsFolderFirst } from "../../../src/interface/view/campaigns-folder-first";
import { obsidianDocument } from "../../stubs/obsidian-dom";

class FakePage extends Component {
  loaded = false;

  constructor(
    readonly id: PageId,
    readonly contentEl: HTMLElement,
    readonly show: ShowPage,
    readonly path: string | null,
    readonly stayOn: StayOn,
  ) {
    super();
  }

  override onload(): void {
    this.loaded = true;
    this.contentEl.setText(`page ${this.id} ${String(this.path)}`);
  }

  override onunload(): void {
    this.loaded = false;
  }
}

class FakeBackdrop extends Component {
  loaded = false;

  constructor(readonly frameEl: HTMLElement) {
    super();
  }

  override onload(): void {
    this.loaded = true;
  }

  override onunload(): void {
    this.loaded = false;
  }
}

function backdropsInto(backdrops: FakeBackdrop[]): (frameEl: HTMLElement) => FakeBackdrop {
  return (frameEl) => {
    const backdrop = new FakeBackdrop(frameEl);
    backdrops.push(backdrop);
    return backdrop;
  };
}

class FakeVault {
  readonly listeners = new Map<string, (...args: unknown[]) => void>();
  readonly removed: string[] = [];

  on(name: string, listener: (...args: unknown[]) => void): string {
    this.listeners.set(name, listener);
    return name;
  }

  offref(ref: string): void {
    this.removed.push(ref);
  }

  renamed(path: string, oldPath: string): void {
    this.listeners.get("rename")!({ path }, oldPath);
  }

  deleted(path: string): void {
    this.listeners.get("delete")!({ path });
  }
}

const MIRA = "Pale Moon/Characters/Mira.md";

function campaignOf(lines: string[]): Campaign {
  return buildCampaign([{ path: "Pale Moon/Sessions/Session 1.md", number: 1, firstLine: 0, text: lines.join("\n") }]);
}

const LEAVE_DELETED: PathAfterDelete = () => null;

const KEEP_DELETED: PathAfterDelete = (path) => path;

interface EntryOptions {
  countOf?: (campaign: Campaign) => number;
  inBar?: boolean;
  listed?: boolean;
  pathAfterDelete?: PathAfterDelete;
}

function entryOf(id: PageId, made: FakePage[], { countOf = () => 0, inBar = true, listed = true, pathAfterDelete = LEAVE_DELETED }: EntryOptions = {}): PageEntry {
  const make = (contentEl: HTMLElement, show: ShowPage, path: string | null, stayOn: StayOn) => {
    const page = new FakePage(id, contentEl, show, path, stayOn);
    made.push(page);
    return page;
  };
  return { id, label: `Label ${id}`, shortLabel: `Short ${id}`, listed, inBar, glyph: "?", glyphClass: "dd-marker-question", make, pathAfterDelete, countOf };
}

async function openView({
  folder = "Pale Moon" as string | null,
  questionCount = (campaign: Campaign) => campaign.questions.length,
  castAfterDelete = LEAVE_DELETED,
  sectionsAround = (sections: NavSection[]) => sections,
} = {}) {
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
    { heading: null, pages: [entryOf("home", made), entryOf("cast", made, { pathAfterDelete: castAfterDelete })] },
    { heading: "From the notes", pages: [entryOf("questions", made, { countOf: questionCount, inBar: false }), entryOf("funds", made)] },
    { heading: null, pages: [entryOf("note", made, { listed: false, inBar: false, pathAfterDelete: KEEP_DELETED })] },
  ];
  const requestSaveLayout = vi.fn();
  const followCampaign = vi.fn();
  const results: ViewStateResult[] = [];
  const leaf = {
    setViewState: vi.fn(async ({ state }: { state: unknown }) => {
      const result = { history: false };
      results.push(result);
      await view.setState(state, result);
    }),
  };
  const vault = new FakeVault();
  const backdrops: FakeBackdrop[] = [];
  const view = new CampaignView(
    leaf as unknown as WorkspaceLeaf,
    store as unknown as CampaignStore,
    sectionsAround(sections),
    followCampaign,
    backdropsInto(backdrops),
    vault as unknown as ViewFiles,
  );
  view.app = { workspace: { requestSaveLayout } } as unknown as CampaignView["app"];
  const root = obsidianDocument().createElement("div");
  view.contentEl = root;
  view.load();
  await view.onOpen();
  await view.setState({}, { history: false });
  const change = (lines: string[], nextFolder: string | null = folder) => {
    store.current = campaignOf(lines);
    store.campaignFolder = nextFolder;
    listener();
  };
  return { view, root, made, change, unsubscribe, requestSaveLayout, leaf, results, vault, followCampaign, backdrops };
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
    const view = new CampaignView({} as WorkspaceLeaf, {} as CampaignStore, [{ heading: null, pages: [entryOf("home", [])] }], vi.fn(), backdropsInto([]), {} as ViewFiles);
    expect(view.containerEl.getAttribute("data-type")).toBe(CAMPAIGN_VIEW);
  });

  it("asks Obsidian to keep its pages in the back and forward history", async () => {
    const { view } = await openView();
    expect(view.navigation).toBe(true);
  });

  it("opens on its first page, marked as the current one", async () => {
    const { root, made } = await openView();
    expect(made.map((page) => page.id)).toEqual(["home"]);
    expect(made[0]!.loaded).toBe(true);
    expect(pageText(root)).toBe("page home null");
    expect(currentLabels(root)).toEqual(["Label home"]);
  });

  it("lists every page in the sidebar, each group under its heading", async () => {
    const { root } = await openView();
    const nav = root.querySelector(".dd-nav")!;
    const shown = [...nav.children].map((child) => child.textContent);
    expect(shown).toEqual(["Pale Moon", "?Label homeShort home", "?Label castShort cast", "From the notes", "?Label questionsShort questions", "?Label fundsShort funds"]);
  });

  it("leaves a page that isn't listed out of the sidebar, and marks no link current while it is shown", async () => {
    const { view, root } = await openView();
    await view.setState({ page: "note", path: "Pale Moon/Places/Old Mill.md" }, { history: false });
    expect(pageText(root)).toBe("page note Pale Moon/Places/Old Mill.md");
    expect(root.querySelectorAll(".dd-nav-link")).toHaveLength(4);
    expect(currentLabels(root)).toEqual([]);
  });

  it("gives each link its short name for the bottom bar, and marks the links the bar holds", async () => {
    const { root } = await openView();
    const links = [...root.querySelectorAll<HTMLElement>(".dd-nav-link")];
    const shown = links.map((link) => [link.querySelector(".dd-nav-short")!.textContent, link.classList.contains("dd-nav-in-bar")]);
    expect(shown).toEqual([
      ["Short home", true],
      ["Short cast", true],
      ["Short questions", false],
      ["Short funds", true],
    ]);
  });

  it("marks the current page on the link the bottom bar shows too", async () => {
    const { root } = await openView();
    linkLabelled(root, "Label funds").click();
    await vi.waitFor(() => expect(root.querySelector('.dd-nav-in-bar[aria-current="page"] .dd-nav-short')!.textContent).toBe("Short funds"));
    expect(root.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
  });

  it("shows a page when its link is pressed, through Obsidian so it is kept in the history", async () => {
    const { root, made, requestSaveLayout, leaf, results } = await openView();
    linkLabelled(root, "Label funds").click();
    await vi.waitFor(() => expect(made.map((page) => page.id)).toEqual(["home", "funds"]));
    expect(leaf.setViewState).toHaveBeenCalledExactlyOnceWith({ type: CAMPAIGN_VIEW, state: { page: "funds", path: null } });
    expect(results).toEqual([{ history: true }]);
    expect(made[0]!.loaded).toBe(false);
    expect(made[1]!.loaded).toBe(true);
    expect(pageText(root)).toBe("page funds null");
    expect(currentLabels(root)).toEqual(["Label funds"]);
    expect(requestSaveLayout).toHaveBeenCalledTimes(2);
  });

  it("leaves the page as it is, and the history alone, when its own link is pressed again", async () => {
    const { root, made, results } = await openView();
    linkLabelled(root, "Label home").click();
    await vi.waitFor(() => expect(results).toHaveLength(1));
    expect(results).toEqual([{ history: false }]);
    expect(made).toHaveLength(1);
    expect(made[0]!.loaded).toBe(true);
  });

  it("shows the page and note its state names, and keeps both in its state", async () => {
    const { view, root } = await openView();
    await view.setState({ page: "cast", path: MIRA }, { history: false });
    expect(pageText(root)).toBe(`page cast ${MIRA}`);
    expect(view.getState()).toEqual({ page: "cast", path: MIRA });
  });

  it("tells which note it shows, and none on a page without one", async () => {
    const { view } = await openView();
    expect(view.shownPath()).toBeNull();
    await view.setState({ page: "cast", path: MIRA }, { history: false });
    expect(view.shownPath()).toBe(MIRA);
  });

  it("never names its note under file, which Obsidian on a phone would open in the editor", async () => {
    const { view } = await openView();
    await view.setState({ page: "cast", path: MIRA }, { history: false });
    expect(Object.keys(view.getState())).toEqual(["page", "path"]);
  });

  it("builds the page again for another note on the same page, and marks the change for the history", async () => {
    const { view, made } = await openView();
    await view.setState({ page: "cast", path: null }, { history: false });
    const result = { history: false };
    await view.setState({ page: "cast", path: MIRA }, result);
    expect(made.map((page) => [page.id, page.path])).toEqual([["home", null], ["cast", null], ["cast", MIRA]]);
    expect(made[1]!.loaded).toBe(false);
    expect(result).toEqual({ history: true });
  });

  it("chooses the campaign of the note it is given, and none for a page with no note", async () => {
    const { view, followCampaign } = await openView();
    await view.setState({ page: "funds", path: null }, { history: false });
    expect(followCampaign).not.toHaveBeenCalled();
    await view.setState({ page: "cast", path: "Ashen Road/Characters/Thessaly.md" }, { history: false });
    expect(followCampaign).toHaveBeenCalledExactlyOnceWith("Ashen Road/Characters/Thessaly.md");
  });

  it("takes a path that isn't text as no note", async () => {
    const { view, root } = await openView();
    await view.setState({ page: "cast", path: 7 }, { history: false });
    expect(pageText(root)).toBe("page cast null");
  });

  it("stays on its page when the state names no page it has", async () => {
    const { view, root, made } = await openView();
    await view.setState({ page: "notes" }, { history: false });
    await view.setState({}, { history: false });
    expect(made).toHaveLength(1);
    expect(pageText(root)).toBe("page home null");
  });

  it("keeps the page it is on when a later state names no page", async () => {
    const { view, root, made } = await openView();
    await view.setState({ page: "funds" }, { history: false });
    await view.setState({}, { history: false });
    expect(made.map((page) => page.id)).toEqual(["home", "funds"]);
    expect(pageText(root)).toBe("page funds null");
  });

  it("follows its note when the note is renamed, without a step in the history", async () => {
    const { view, root, results, requestSaveLayout, vault } = await openView();
    await view.setState({ page: "cast", path: MIRA }, { history: false });
    const saves = requestSaveLayout.mock.calls.length;
    vault.renamed("Pale Moon/Characters/Mirabel.md", MIRA);
    expect(pageText(root)).toBe("page cast Pale Moon/Characters/Mirabel.md");
    expect(view.getState()).toEqual({ page: "cast", path: "Pale Moon/Characters/Mirabel.md" });
    expect(requestSaveLayout).toHaveBeenCalledTimes(saves + 1);
    expect(results).toEqual([]);
  });

  it("ignores other notes being renamed or deleted", async () => {
    const { view, vault, made } = await openView();
    await view.setState({ page: "cast", path: MIRA }, { history: false });
    vault.renamed("Pale Moon/Characters/Lady Vess.md", "Pale Moon/Characters/Vess.md");
    vault.deleted("Pale Moon/Characters/Brother Aldric.md");
    expect(made).toHaveLength(2);
    expect(view.getState()).toEqual({ page: "cast", path: MIRA });
  });

  it("goes back to the page without a note when its note is deleted", async () => {
    const { view, vault, root } = await openView();
    await view.setState({ page: "cast", path: MIRA }, { history: false });
    vault.deleted(MIRA);
    expect(pageText(root)).toBe("page cast null");
    expect(view.getState()).toEqual({ page: "cast", path: null });
  });

  it("stays on a page that keeps its note when the note is deleted", async () => {
    const { view, vault, made } = await openView({ castAfterDelete: KEEP_DELETED });
    const session = "Pale Moon/Sessions/Session 3.md";
    await view.setState({ page: "cast", path: session }, { history: false });
    const pages = made.length;
    vault.deleted(session);
    expect(made).toHaveLength(pages);
    expect(view.getState()).toEqual({ page: "cast", path: session });
  });

  it("records the note a page settles on when opened without one, without a new page or a step in the history", async () => {
    const { view, made, results, requestSaveLayout } = await openView();
    const session = "Pale Moon/Sessions/Session 3.md";
    await view.setState({ page: "cast", path: null }, { history: false });
    const saves = requestSaveLayout.mock.calls.length;
    const pages = made.length;
    made.at(-1)!.stayOn(session);
    expect(view.getState()).toEqual({ page: "cast", path: session });
    expect(view.shownPath()).toBe(session);
    expect(requestSaveLayout).toHaveBeenCalledTimes(saves + 1);
    expect(made).toHaveLength(pages);
    expect(results).toEqual([]);
  });

  it("ignores a page settling on a note once the tab has moved on or already shows one", async () => {
    const { view, made } = await openView();
    await view.setState({ page: "cast", path: null }, { history: false });
    const notes = made.at(-1)!;
    await view.setState({ page: "funds" }, { history: false });
    notes.stayOn("Pale Moon/Sessions/Session 3.md");
    expect(view.getState()).toEqual({ page: "funds", path: null });
    await view.setState({ page: "cast", path: "Pale Moon/Sessions/Session 4.md" }, { history: false });
    made.at(-1)!.stayOn("Pale Moon/Sessions/Session 3.md");
    expect(view.getState()).toEqual({ page: "cast", path: "Pale Moon/Sessions/Session 4.md" });
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

  it("builds the page it shows again when asked, so a page that asked for the Campaigns folder shows once one is set", async () => {
    let campaignsFolder: string | null = null;
    const asked: FakePage[] = [];
    const sectionsAround = (sections: NavSection[]) => campaignsFolderFirst(sections, entryOf("welcome", asked).make, () => campaignsFolder);
    const { view, root, made } = await openView({ sectionsAround });
    expect(pageText(root)).toBe("page welcome null");
    campaignsFolder = "D&D";
    view.showAgain();
    expect(pageText(root)).toBe("page home null");
    await view.setState({ page: "home" }, { history: false });
    expect(pageText(root)).toBe("page home null");
    expect(asked.map((page) => page.loaded)).toEqual([false]);
    expect(made.map((page) => page.id)).toEqual(["home"]);
  });

  it("builds no page when asked to build its page again before it shows one", async () => {
    const made: FakePage[] = [];
    const store = { subscribe: () => () => {}, current: campaignOf([]), campaignFolder: null };
    const view = new CampaignView(
      {} as WorkspaceLeaf,
      store as unknown as CampaignStore,
      [{ heading: null, pages: [entryOf("home", made)] }],
      vi.fn(),
      backdropsInto([]),
      new FakeVault() as unknown as ViewFiles,
    );
    view.app = { workspace: { requestSaveLayout: vi.fn() } } as unknown as CampaignView["app"];
    view.contentEl = obsidianDocument().createElement("div");
    view.load();
    await view.onOpen();
    view.showAgain();
    expect(made).toEqual([]);
  });

  it("names the open campaign at the top of the sidebar by its name, not the path of its folder", async () => {
    const { root } = await openView({ folder: "D&D/Pale Moon" });
    expect(root.querySelector(".dd-nav-campaign")?.textContent).toBe("Pale Moon");
  });

  it("builds no page until Obsidian gives it its state", async () => {
    const made: FakePage[] = [];
    const store = { subscribe: () => () => {}, current: campaignOf([]), campaignFolder: null };
    const view = new CampaignView(
      {} as WorkspaceLeaf,
      store as unknown as CampaignStore,
      [{ heading: null, pages: [entryOf("home", made), entryOf("funds", made)] }],
      vi.fn(),
      backdropsInto([]),
      new FakeVault() as unknown as ViewFiles,
    );
    view.app = { workspace: { requestSaveLayout: vi.fn() } } as unknown as CampaignView["app"];
    view.contentEl = obsidianDocument().createElement("div");
    view.load();
    await view.onOpen();
    expect(made).toEqual([]);
    expect(view.getState()).toEqual({});
    await view.setState({ page: "funds" }, { history: false });
    expect(made.map((page) => page.id)).toEqual(["funds"]);
  });

  it("lets a page show another page or note in the same tab, through Obsidian", async () => {
    const { root, made, leaf } = await openView();
    made[0]!.show({ page: "cast", path: MIRA });
    await vi.waitFor(() => expect(made.map((page) => page.id)).toEqual(["home", "cast"]));
    expect(leaf.setViewState).toHaveBeenCalledExactlyOnceWith({ type: CAMPAIGN_VIEW, state: { page: "cast", path: MIRA } });
    expect(made[0]!.loaded).toBe(false);
    expect(pageText(root)).toBe(`page cast ${MIRA}`);
  });

  it("ignores a page asking for a page the tab doesn't have", async () => {
    const { root, made, leaf } = await openView();
    made[0]!.show({ page: "quests", path: null });
    await vi.waitFor(() => expect(leaf.setViewState).toHaveBeenCalledOnce());
    expect(made).toHaveLength(1);
    expect(pageText(root)).toBe("page home null");
  });

  it("puts the campaign's picture behind the whole tab, around the sidebar and the page", async () => {
    const { root, backdrops } = await openView();
    expect(backdrops).toHaveLength(1);
    expect(backdrops[0]!.frameEl).toBe(root);
    expect(backdrops[0]!.loaded).toBe(true);
    expect(root.querySelector(".dd-campaign")!.parentElement).toBe(root);
  });

  it("holds only the sidebar and the page, with the page's content in one solid body", async () => {
    const { root } = await openView();
    const campaign = root.querySelector(".dd-campaign")!;
    expect([...campaign.children].map((child) => child.className)).toEqual(["dd-nav", "dd-page"]);
    const page = campaign.querySelector(".dd-page")!;
    expect([...page.children].map((child) => child.className)).toEqual(["dd-page-body"]);
  });

  it("closes the shown page and stops listening to the campaign and the vault when it is closed", async () => {
    const { view, made, unsubscribe, vault, backdrops } = await openView();
    view.unload();
    expect(made[0]!.loaded).toBe(false);
    expect(backdrops[0]!.loaded).toBe(false);
    expect(unsubscribe).toHaveBeenCalledOnce();
    expect(vault.removed.sort()).toEqual(["delete", "rename"]);
  });
});
