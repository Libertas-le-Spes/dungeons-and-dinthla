import { debounce, Plugin, type MarkdownFileInfo, type TFile } from "obsidian";
import type { Source } from "./campaign/campaign";
import { campaignFolderOf, findCampaignFolders, isSessionNote } from "./campaign/campaign-folders";
import { CampaignStore } from "./campaign/campaign-store";
import { editorTextOf } from "./campaign/editor-text";
import { markerColouring } from "./editor/marker-decorations";
import { openNewQuestion } from "./questions/open-new-question";
import { openQuestion } from "./questions/open-question";
import { QUESTIONS_VIEW, questionsKind } from "./questions/questions-kind";
import { QUESTS_VIEW, questsKind } from "./quests/quests-kind";
import { FUNDS_VIEW, FundsView } from "./funds/funds-view";
import { CampaignListView } from "./views/list-view";
import { openSideView, openSource } from "./views/open-view";
import { colourMarkers } from "./reading/colour-markers";
import { startSession } from "./sessions/start-session";
import { usesCommunityTheme } from "./theme/community-theme";
import { FollowThemeClass } from "./theme/follow-theme-class";

const TYPING_PAUSE_MS = 250;

export default class DungeonsAndDinthla extends Plugin {
  private readonly store = new CampaignStore(this.app.vault);

  override async onload(): Promise<void> {
    const actions = {
      openRow: (source: Source) => void openSource(this.app, source),
      openLink: (linktext: string, sourcePath: string) => void this.app.workspace.openLinkText(linktext, sourcePath),
    };
    const questionActions = {
      ...actions,
      openRow: (source: Source) => {
        const openNote = () => void openSource(this.app, source);
        openQuestion(this.app, this.store, source, openNote, (changed) => this.focusQuestionRow(source, changed));
      },
    };
    const createQuestion = (returnFocus: () => void) => openNewQuestion(this.app, this.store, returnFocus);
    this.registerView(QUESTIONS_VIEW, (leaf) => new CampaignListView(leaf, this.store, questionActions, questionsKind, createQuestion));
    this.addRibbonIcon(questionsKind.icon, "Open questions", () => void openSideView(this.app, QUESTIONS_VIEW));
    this.addCommand({ id: "open-questions", name: "Open questions", callback: () => void openSideView(this.app, QUESTIONS_VIEW) });
    this.registerView(QUESTS_VIEW, (leaf) => new CampaignListView(leaf, this.store, actions, questsKind, null));
    this.addRibbonIcon(questsKind.icon, "Open quests", () => void openSideView(this.app, QUESTS_VIEW));
    this.addCommand({ id: "open-quests", name: "Open quests", callback: () => void openSideView(this.app, QUESTS_VIEW) });
    const noteExists = (name: string, sourcePath: string) => this.app.metadataCache.getFirstLinkpathDest(name, sourcePath) !== null;
    this.registerView(FUNDS_VIEW, (leaf) => new FundsView(leaf, this.store, actions, noteExists));
    this.addRibbonIcon("coins", "Open party funds", () => void openSideView(this.app, FUNDS_VIEW));
    this.addCommand({ id: "open-funds", name: "Open party funds", callback: () => void openSideView(this.app, FUNDS_VIEW) });
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

  private focusQuestionRow(source: Source, afterChange: boolean): void {
    for (const leaf of this.app.workspace.getLeavesOfType(QUESTIONS_VIEW)) {
      if (leaf.view instanceof CampaignListView) leaf.view.focusRow(source, afterChange);
    }
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
