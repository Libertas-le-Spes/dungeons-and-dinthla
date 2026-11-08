import { debounce, Plugin, type MarkdownFileInfo, type TFile } from "obsidian";
import type { Source } from "./campaign/campaign";
import { campaignFolderOf, findCampaignFolders, isSessionNote } from "./campaign/campaign-folders";
import { CampaignStore } from "./campaign/campaign-store";
import { editorTextOf } from "./campaign/editor-text";
import { markerColouring } from "./editor/marker-decorations";
import { openQuestionsView, openSource } from "./questions/open-questions";
import { QUESTIONS_VIEW, QuestionsView } from "./questions/questions-view";
import { colourMarkers } from "./reading/colour-markers";
import { startSession } from "./sessions/start-session";
import { usesCommunityTheme } from "./theme/community-theme";
import { FollowThemeClass } from "./theme/follow-theme-class";

const TYPING_PAUSE_MS = 250;

export default class DungeonsAndDinthla extends Plugin {
  private readonly store = new CampaignStore(this.app.vault);

  override async onload(): Promise<void> {
    const actions = {
      openSource: (source: Source) => void openSource(this.app, source),
      openLink: (linktext: string, sourcePath: string) => void this.app.workspace.openLinkText(linktext, sourcePath),
    };
    this.registerView(QUESTIONS_VIEW, (leaf) => new QuestionsView(leaf, this.store, actions));
    this.addRibbonIcon("circle-help", "Open questions", () => void openQuestionsView(this.app));
    this.addCommand({ id: "open-questions", name: "Open questions", callback: () => void openQuestionsView(this.app) });
    this.addRibbonIcon("calendar-plus", "Start a new session", () => startSession(this.app, this.store.campaignFolder));
    this.addCommand({ id: "start-session", name: "Start a new session", callback: () => startSession(this.app, this.store.campaignFolder) });
    const inSession = (path: string) => isSessionNote(path, (notePath) => this.app.vault.getFileByPath(notePath) !== null);
    this.registerEditorExtension(markerColouring(inSession));
    this.registerMarkdownPostProcessor((element, context) => {
      if (inSession(context.sourcePath)) colourMarkers(element);
    });
    this.followTheme();
    this.app.workspace.onLayoutReady(() => void this.watchCampaign());
  }

  private followTheme(): void {
    const followThemeClass = new FollowThemeClass(() => usesCommunityTheme(this.app.vault));
    followThemeClass.add(document.body);
    this.registerEvent(this.app.workspace.on("css-change", () => followThemeClass.update()));
    this.registerEvent(this.app.workspace.on("window-open", (popout) => followThemeClass.add(popout.doc.body)));
    this.registerEvent(this.app.workspace.on("window-close", (popout) => followThemeClass.remove(popout.doc.body)));
    this.register(() => followThemeClass.clear());
    this.app.workspace.onLayoutReady(() => {
      this.app.workspace.iterateAllLeaves((leaf) => followThemeClass.add(leaf.view.containerEl.doc.body));
    });
  }

  private async watchCampaign(): Promise<void> {
    this.watchNotes();
    const folder = this.startingCampaignFolder();
    if (folder !== null) await this.store.open(folder);
  }

  private watchNotes(): void {
    const editorChanged = debounce((info: MarkdownFileInfo, file: TFile) => this.readEditor(info, file), TYPING_PAUSE_MS, true);
    this.register(() => editorChanged.cancel());
    this.registerEvent(this.app.workspace.on("editor-change", (_editor, info) => {
      if (info.file !== null) editorChanged(info, info.file);
    }));
    this.registerEvent(this.app.metadataCache.on("changed", (file, text) => this.store.noteChanged(file.path, text)));
    this.registerEvent(this.app.vault.on("delete", (file) => this.store.noteDeleted(file.path)));
    this.registerEvent(this.app.vault.on("rename", (file, oldPath) => void this.store.noteRenamed(file.path, oldPath)));
    this.registerEvent(this.app.workspace.on("file-open", (file) => void this.followCampaignOf(file)));
  }

  private readEditor(info: MarkdownFileInfo, file: TFile): void {
    const text = editorTextOf(info, file, this.app.vault);
    if (text !== null) this.store.noteChanged(file.path, text);
  }

  private campaignFolders(): string[] {
    return findCampaignFolders(this.app.vault.getFiles().map((file) => file.path));
  }

  private startingCampaignFolder(): string | null {
    const folders = this.campaignFolders();
    const activeFile = this.app.workspace.getActiveFile();
    if (activeFile !== null) {
      const folder = campaignFolderOf(activeFile.path, folders);
      if (folder !== null) return folder;
    }
    const [first] = folders;
    if (first === undefined) return null;
    return first;
  }

  private async followCampaignOf(file: TFile | null): Promise<void> {
    if (file === null) return;
    const folder = campaignFolderOf(file.path, this.campaignFolders());
    if (folder === null || folder === this.store.campaignFolder) return;
    await this.store.open(folder);
  }
}
