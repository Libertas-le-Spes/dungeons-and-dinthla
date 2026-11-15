import { ItemView, type Component, type TAbstractFile, type ViewStateResult, type WorkspaceLeaf } from "obsidian";
import { campaignNameOf } from "../../campaign/paths/campaign-folders";
import type { CampaignStore } from "../../campaign/reading/campaign-store";
import type { FencedFiles, GoneFile } from "../../fence/gate/fenced-files";
import type { NavSection, PageEntry, PageTarget } from "./campaign-pages";
import { CampaignSwitcher, type SwitchableCampaigns } from "./campaign-switcher";

export const CAMPAIGN_VIEW = "dungeons-and-dinthla-campaign";
export const CAMPAIGN_TITLE = "Campaign";
export const CAMPAIGN_ICON = "shield";

const NO_CAMPAIGN_TITLE = "No campaign open";
const IN_BAR_CLASS = "dd-nav-in-bar";

interface NavLink {
  entry: PageEntry;
  link: HTMLElement;
  count: HTMLElement;
}

interface Shown {
  entry: PageEntry;
  path: string | null;
}

export type FollowCampaign = (path: string) => void;

export type BackdropFor = (frameEl: HTMLElement) => Component;

export type ViewFiles = Pick<FencedFiles, "on" | "offref">;

function pathIn(state: object): string | null {
  if (!("path" in state) || typeof state.path !== "string") return null;
  return state.path;
}

function isListed(entry: PageEntry): boolean {
  return entry.listed;
}

export interface CampaignViewNeeds {
  leaf: WorkspaceLeaf;
  store: CampaignStore;
  sections: NavSection[];
  followCampaign: FollowCampaign;
  backdropFor: BackdropFor;
  files: ViewFiles;
  campaigns: SwitchableCampaigns;
}

export class CampaignView extends ItemView {
  override navigation = true;
  private current: Shown | null = null;
  private shownPage: Component | null = null;
  private pageEl: HTMLElement | null = null;
  private campaignName!: HTMLElement;
  private links: NavLink[] = [];

  constructor(private readonly needs: CampaignViewNeeds) {
    super(needs.leaf);
  }

  private get store(): CampaignStore {
    return this.needs.store;
  }

  private get sections(): NavSection[] {
    return this.needs.sections;
  }

  private get files(): ViewFiles {
    return this.needs.files;
  }

  getViewType(): string {
    return CAMPAIGN_VIEW;
  }

  getDisplayText(): string {
    return CAMPAIGN_TITLE;
  }

  override getIcon(): string {
    return CAMPAIGN_ICON;
  }

  shownPath(): string | null {
    if (this.current === null) return null;
    return this.current.path;
  }

  override getState(): Record<string, unknown> {
    if (this.current === null) return {};
    return { page: this.current.entry.id, path: this.current.path };
  }

  override async setState(state: unknown, result: ViewStateResult): Promise<void> {
    const shown = this.shownFor(state);
    if (!this.isShowing(shown)) result.history = true;
    this.show(shown);
    if (shown.path !== null) this.needs.followCampaign(shown.path);
    await super.setState(state, result);
  }

  override async onOpen(): Promise<void> {
    const root = this.contentEl;
    root.empty();
    root.addClass("dd-tokens", "dd-root", "dd-campaign-frame");
    const frame = root.createDiv({ cls: "dd-campaign" });
    const nav = frame.createEl("nav", { cls: "dd-nav", attr: { "aria-label": CAMPAIGN_TITLE } });
    const heading = nav.createDiv({ cls: "dd-nav-heading" });
    this.campaignName = heading.createDiv({ cls: "dd-nav-campaign" });
    this.addChild(new CampaignSwitcher({ parentEl: heading, campaigns: this.needs.campaigns }));
    for (const section of this.sections) this.addSection(nav, section);
    this.pageEl = frame.createDiv({ cls: "dd-page" });
    this.addChild(this.needs.backdropFor(root));
    this.register(this.store.subscribe(() => this.campaignChanged()));
    this.watchShownNote();
    this.campaignChanged();
  }

  private watchShownNote(): void {
    const files = this.files;
    const renamed = files.on("rename", (file: TAbstractFile, oldPath: string) => this.noteRenamed(file.path, oldPath));
    const deleted = files.on("delete", (file: GoneFile) => this.noteDeleted(file.path));
    this.register(() => files.offref(renamed));
    this.register(() => files.offref(deleted));
  }

  private noteRenamed(path: string, oldPath: string): void {
    const current = this.current;
    if (current === null || current.path !== oldPath) return;
    this.show({ entry: current.entry, path });
  }

  private noteDeleted(path: string): void {
    const current = this.current;
    if (current === null || current.path !== path) return;
    this.show({ entry: current.entry, path: current.entry.pathAfterDelete(path) });
  }

  private addSection(nav: HTMLElement, section: NavSection): void {
    if (section.heading !== null) nav.createDiv({ cls: "dd-nav-group", text: section.heading });
    for (const entry of section.pages.filter(isListed)) this.addLink(nav, entry);
  }

  private addLink(nav: HTMLElement, entry: PageEntry): void {
    const link = nav.createEl("button", { cls: "dd-nav-link" });
    link.createSpan({ cls: ["dd-nav-glyph", entry.glyphClass], text: entry.glyph, attr: { "aria-hidden": "true" } });
    link.createSpan({ cls: "dd-nav-label", text: entry.label });
    link.createSpan({ cls: "dd-nav-short", text: entry.shortLabel });
    const count = link.createSpan({ cls: "dd-nav-count" });
    link.toggleClass(IN_BAR_CLASS, entry.inBar);
    this.registerDomEvent(link, "click", () => this.navigate({ page: entry.id, path: null }));
    this.links.push({ entry, link, count });
  }

  private navigate(target: PageTarget): void {
    void this.leaf.setViewState({ type: CAMPAIGN_VIEW, state: { page: target.page, path: target.path } });
  }

  private isShowing(shown: Shown): boolean {
    const current = this.current;
    if (current === null) return false;
    return current.entry === shown.entry && current.path === shown.path;
  }

  showAgain(): void {
    if (this.current === null) return;
    this.build(this.current);
  }

  private show(shown: Shown): void {
    if (this.isShowing(shown) && this.shownPage !== null) return;
    this.build(shown);
  }

  private build(shown: Shown): void {
    this.current = shown;
    const pageEl = this.pageEl;
    if (pageEl === null) return;
    this.closePage();
    pageEl.empty();
    const navigate = (target: PageTarget) => this.navigate(target);
    const stayOn = (path: string) => this.stayOn(shown.entry, path);
    this.shownPage = this.addChild(shown.entry.make(pageEl.createDiv({ cls: "dd-page-body" }), navigate, shown.path, stayOn));
    this.markCurrent();
    this.app.workspace.requestSaveLayout();
  }

  private stayOn(entry: PageEntry, path: string): void {
    const current = this.current;
    if (current === null || current.entry !== entry || current.path !== null) return;
    this.current = { entry, path };
    this.app.workspace.requestSaveLayout();
  }

  private closePage(): void {
    if (this.shownPage === null) return;
    this.removeChild(this.shownPage);
    this.shownPage = null;
  }

  private markCurrent(): void {
    for (const { entry, link } of this.links) {
      if (this.current !== null && entry === this.current.entry) link.setAttribute("aria-current", "page");
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
    return campaignNameOf(folder);
  }

  private shownFor(state: unknown): Shown {
    const named = this.shownNamedIn(state);
    if (named !== null) return named;
    if (this.current !== null) return this.current;
    return { entry: this.firstEntry(), path: null };
  }

  private shownNamedIn(state: unknown): Shown | null {
    if (typeof state !== "object" || state === null || !("page" in state)) return null;
    if (typeof state.page !== "string") return null;
    const entry = this.entryWithId(state.page);
    if (entry === null) return null;
    return { entry, path: pathIn(state) };
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
