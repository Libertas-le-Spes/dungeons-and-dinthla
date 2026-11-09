import { ItemView, type Component, type ViewStateResult, type WorkspaceLeaf } from "obsidian";
import type { CampaignStore } from "../campaign/campaign-store";
import type { NavSection, PageEntry, PageId } from "./campaign-pages";

export const CAMPAIGN_VIEW = "dungeons-and-dinthla-campaign";

const TITLE = "Campaign";
const NO_CAMPAIGN_TITLE = "No campaign open";

interface NavLink {
  entry: PageEntry;
  link: HTMLElement;
  count: HTMLElement;
}

export class CampaignView extends ItemView {
  private current: PageEntry | null = null;
  private shownPage: Component | null = null;
  private pageEl: HTMLElement | null = null;
  private campaignName!: HTMLElement;
  private links: NavLink[] = [];

  constructor(
    leaf: WorkspaceLeaf,
    private readonly store: CampaignStore,
    private readonly sections: NavSection[],
  ) {
    super(leaf);
  }

  getViewType(): string {
    return CAMPAIGN_VIEW;
  }

  getDisplayText(): string {
    return TITLE;
  }

  override getIcon(): string {
    return "shield";
  }

  get page(): Component | null {
    return this.shownPage;
  }

  override getState(): Record<string, unknown> {
    if (this.current === null) return {};
    return { page: this.current.id };
  }

  override async setState(state: unknown, result: ViewStateResult): Promise<void> {
    this.show(this.entryToShow(state));
    await super.setState(state, result);
  }

  override async onOpen(): Promise<void> {
    const root = this.contentEl;
    root.empty();
    root.addClass("dd-tokens", "dd-root", "dd-campaign-frame");
    const frame = root.createDiv({ cls: "dd-campaign" });
    const nav = frame.createEl("nav", { cls: "dd-nav", attr: { "aria-label": TITLE } });
    this.campaignName = nav.createDiv({ cls: "dd-nav-campaign" });
    for (const section of this.sections) this.addSection(nav, section);
    this.pageEl = frame.createDiv({ cls: "dd-page" });
    this.register(this.store.subscribe(() => this.campaignChanged()));
    this.campaignChanged();
  }

  private addSection(nav: HTMLElement, section: NavSection): void {
    if (section.heading !== null) nav.createDiv({ cls: "dd-nav-group", text: section.heading });
    for (const entry of section.pages) this.addLink(nav, entry);
  }

  private addLink(nav: HTMLElement, entry: PageEntry): void {
    const link = nav.createEl("button", { cls: "dd-nav-link" });
    link.createSpan({ cls: ["dd-nav-glyph", entry.glyphClass], text: entry.glyph, attr: { "aria-hidden": "true" } });
    link.createSpan({ cls: "dd-nav-label", text: entry.label });
    const count = link.createSpan({ cls: "dd-nav-count" });
    this.registerDomEvent(link, "click", () => this.show(entry));
    this.links.push({ entry, link, count });
  }

  private showId(id: PageId): void {
    const entry = this.entryWithId(id);
    if (entry !== null) this.show(entry);
  }

  private show(entry: PageEntry): void {
    if (entry === this.current && this.shownPage !== null) return;
    this.current = entry;
    const pageEl = this.pageEl;
    if (pageEl === null) return;
    this.closePage();
    pageEl.empty();
    const show = (id: PageId) => this.showId(id);
    this.shownPage = this.addChild(entry.make(pageEl.createDiv({ cls: "dd-page-body" }), show));
    this.markCurrent();
    this.app.workspace.requestSaveLayout();
  }

  private closePage(): void {
    if (this.shownPage === null) return;
    this.removeChild(this.shownPage);
    this.shownPage = null;
  }

  private markCurrent(): void {
    for (const { entry, link } of this.links) {
      if (entry === this.current) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    }
  }

  private campaignChanged(): void {
    for (const { entry, count } of this.links) {
      const shown = entry.countOf(this.store.current);
      if (shown === 0) count.setText("");
      else count.setText(String(shown));
    }
    this.campaignName.setText(this.campaignTitle());
  }

  private campaignTitle(): string {
    const folder = this.store.campaignFolder;
    if (folder === null) return NO_CAMPAIGN_TITLE;
    return folder;
  }

  private entryToShow(state: unknown): PageEntry {
    const named = this.entryNamedIn(state);
    if (named !== null) return named;
    if (this.current !== null) return this.current;
    return this.firstEntry();
  }

  private entryNamedIn(state: unknown): PageEntry | null {
    if (typeof state !== "object" || state === null || !("page" in state)) return null;
    if (typeof state.page !== "string") return null;
    return this.entryWithId(state.page);
  }

  private entryWithId(id: string): PageEntry | null {
    const entry = this.allEntries().find((candidate) => candidate.id === id);
    if (entry === undefined) return null;
    return entry;
  }

  private firstEntry(): PageEntry {
    const [first] = this.allEntries();
    if (first === undefined) throw new Error("The campaign tab has no pages to show.");
    return first;
  }

  private allEntries(): PageEntry[] {
    return this.sections.flatMap((section) => section.pages);
  }
}
