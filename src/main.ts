import { debounce, MarkdownView, Notice, Plugin, type EditorSuggestContext, type MarkdownFileInfo, type TFile } from "obsidian";
import type { Source } from "./campaign/campaign";
import type { SheetValue } from "./characters/character-sheet";
import { messageOf } from "./views/message-of";
import {
  campaignFolderOf,
  chosenCampaignFolder,
  findCampaignFolders,
  isSessionNote,
  startingCampaignFolder,
} from "./campaign/campaign-folders";
import { CampaignStore } from "./campaign/campaign-store";
import { characterNotesOf } from "./characters/character-notes";
import { CHARACTERS_VIEW, CharactersView } from "./characters/characters-view";
import { addEditCharacterItem, editActiveCharacter, editCharacter, openNewCharacter } from "./characters/open-character";
import { CHARACTER_SHEET_VIEW, CharacterSheetView } from "./characters/character-sheet-view";
import { chooseSheetValue, openCharacterSheet } from "./characters/open-character-sheet";
import { sheetNotesOf } from "./characters/sheet-notes";
import { mentionNotesOf } from "./characters/mention-notes";
import { editorTextOf } from "./campaign/editor-text";
import { markerColouring } from "./editor/marker-decorations";
import type { LookupMatch } from "./lookups/lookup";
import { LookupSuggest } from "./lookups/lookup-suggest";
import { openLookup, type LookupOpeners } from "./lookups/open-lookup";
import { openNewQuestion } from "./questions/open-new-question";
import { openQuestion } from "./questions/open-question";
import { questionsKind } from "./questions/questions-kind";
import { openNewQuest } from "./quests/open-new-quest";
import { openQuest } from "./quests/open-quest";
import { questsKind } from "./quests/quests-kind";
import { openAddCoin } from "./funds/open-add-coin";
import { openItemDialog } from "./funds/open-item";
import { ledgerEntryOpener } from "./funds/open-ledger-entry";
import { ListPage } from "./views/list-page";
import { activePathOf, openSource } from "./views/open-view";
import { CastPage } from "./characters/cast-page";
import { DashboardPage, type DashboardActions } from "./dashboard/dashboard-page";
import { FundsPage } from "./funds/funds-page";
import { campaignSections, type PageId, type ShowPage } from "./interface/campaign-pages";
import { CAMPAIGN_VIEW, CampaignView } from "./interface/campaign-view";
import { openCampaignPage } from "./interface/open-campaign";
import { closeRetiredViews } from "./interface/retired-views";
import { colourMarkers } from "./reading/colour-markers";
import { BackgroundRefresh, showBackground, shownBackgroundOf } from "./reading/note-background";
import { CampaignSettingTab } from "./settings/campaign-setting-tab";
import { ChosenCampaign } from "./settings/chosen-campaign";
import { settingsOf, type PluginSettings } from "./settings/plugin-settings";
import { sessionHeadingOf } from "./sessions/session-heading";
import { startSession } from "./sessions/start-session";
import { usesCommunityTheme } from "./theme/community-theme";
import { FollowThemeClass } from "./theme/follow-theme-class";

const TYPING_PAUSE_MS = 250;

const PAGE_OPENERS: { page: PageId; id: string; name: string; icon: string }[] = [
  { page: "home", id: "open-dashboard", name: "Open dashboard", icon: "layout-dashboard" },
  { page: "cast", id: "open-characters", name: "Open characters", icon: "users" },
  { page: "questions", id: "open-questions", name: "Open questions", icon: "circle-help" },
  { page: "quests", id: "open-quests", name: "Open quests", icon: "scroll-text" },
  { page: "funds", id: "open-funds", name: "Open party funds", icon: "coins" },
];

export default class DungeonsAndDinthla extends Plugin {
  private readonly store = new CampaignStore(this.app.vault);
  private chosen = this.chosenCampaignFrom(settingsOf(null));

  override async onload(): Promise<void> {
    this.chosen = this.chosenCampaignFrom(settingsOf(await this.loadData()));
    this.addSettingTab(new CampaignSettingTab(this.app, this, {
      folders: () => this.campaignFolders(),
      chosen: () => chosenCampaignFolder(this.chosen.folder, this.campaignFolders()),
      choose: (folder) => this.chosen.choose(folder),
    }));
    const actions = {
      openRow: (source: Source) => void openSource(this.app, source),
      openLink: (linktext: string, sourcePath: string) => void this.app.workspace.openLinkText(linktext, sourcePath),
    };
    const openQuestionAt = (source: Source, onClosed: (changed: boolean) => void) =>
      openQuestion(this.app, this.store, source, () => void openSource(this.app, source), onClosed);
    const createQuestion = {
      label: "New question",
      open: (returnFocus: () => void) => openNewQuestion(this.app, this.store, returnFocus),
    };
    const openQuestAt = (source: Source, onClosed: (changed: boolean) => void) =>
      openQuest(this.app, this.store, source, () => void openSource(this.app, source), onClosed);
    const createQuest = {
      label: "New quest",
      open: (returnFocus: () => void) => openNewQuest(this.app, this.store, returnFocus),
    };
    const noteExists = (name: string, sourcePath: string) => this.app.metadataCache.getFirstLinkpathDest(name, sourcePath) !== null;
    const addCoin = (returnFocus: () => void) => openAddCoin(this.app, this.store, returnFocus);
    const openItem = (name: string, source: Source, onClosed: (changed: boolean) => void) =>
      openItemDialog(this.app, this.store, name, () => void openSource(this.app, source), onClosed);
    const openLedgerEntry = ledgerEntryOpener(this.app, this.store, openItem);
    const characterNotes = characterNotesOf(this.app);
    const sheetNotes = sheetNotesOf(this.app);
    const sheetActions = {
      ...actions,
      editCharacter: (file: TFile) => editCharacter(this.app, characterNotes, file),
      chooseValue: (file: TFile, value: SheetValue, onClosed: () => void) =>
        void chooseSheetValue(this.app, this.store, sheetNotes, file, value, actions.openRow, onClosed),
    };
    const mentionNotes = mentionNotesOf(this.app);
    this.registerView(CHARACTER_SHEET_VIEW, (leaf) => new CharacterSheetView(leaf, this.store, sheetNotes, sheetActions, mentionNotes));
    const galleryActions = { ...actions, openRow: (source: Source) => void openCharacterSheet(this.app, source.path) };
    const newCharacter = (returnFocus: () => void) => openNewCharacter(this.app, this.store.campaignFolder, returnFocus);
    this.registerBasesView(CHARACTERS_VIEW, {
      name: "Characters",
      icon: "users",
      factory: (controller, containerEl) => new CharactersView(controller, containerEl, this.store, characterNotes, galleryActions, newCharacter),
    });
    this.addCommand({ id: "edit-character", name: "Edit character", checkCallback: (checking) => editActiveCharacter(this.app, characterNotes, checking) });
    this.registerEvent(this.app.workspace.on("file-menu", (menu, file) => addEditCharacterItem(this.app, characterNotes, menu, file)));
    this.addRibbonIcon("calendar-plus", "Start a new session", () => startSession(this.app, this.store.campaignFolder));
    const dashboardActionsFor = (show: ShowPage): DashboardActions => ({
      ...actions,
      openQuestion: openQuestionAt,
      openQuest: openQuestAt,
      openLedgerEntry,
      showQuestions: () => show("questions"),
      showQuests: () => show("quests"),
      showFunds: () => show("funds"),
      showCharacters: () => show("cast"),
      openCharacterSheet: (path: string) => void openCharacterSheet(this.app, path),
      startSession: () => startSession(this.app, this.store.campaignFolder),
      sessionHeadingOf: (path: string) => sessionHeadingOf(path, this.app.metadataCache),
    });
    const watchFiles = (changed: (path: string) => void) => this.watchFiles(changed);
    const sections = campaignSections({
      home: (contentEl, show) => new DashboardPage(contentEl, this.store, characterNotes, dashboardActionsFor(show)),
      cast: (contentEl) => new CastPage(contentEl, this.store, characterNotes, galleryActions, newCharacter, watchFiles),
      questions: (contentEl) => new ListPage(contentEl, this.store, actions, openQuestionAt, questionsKind, createQuestion),
      quests: (contentEl) => new ListPage(contentEl, this.store, actions, openQuestAt, questsKind, createQuest),
      funds: (contentEl) => new FundsPage(contentEl, this.store, actions, noteExists, addCoin, openLedgerEntry, openItem),
    });
    this.registerView(CAMPAIGN_VIEW, (leaf) => new CampaignView(leaf, this.store, sections));
    for (const opener of PAGE_OPENERS) {
      const open = () => void openCampaignPage(this.app, opener.page);
      this.addRibbonIcon(opener.icon, opener.name, open);
      this.addCommand({ id: opener.id, name: opener.name, callback: open });
    }
    this.addCommand({ id: "start-session", name: "Start a new session", callback: () => startSession(this.app, this.store.campaignFolder) });
    const inSession = (path: string) => isSessionNote(path, (notePath) => this.app.vault.getFileByPath(notePath) !== null);
    this.registerEditorExtension(markerColouring(inSession));
    const openers: LookupOpeners = { question: openQuestionAt, quest: openQuestAt, item: openItem };
    const noteChanged = (path: string, text: string) => this.store.noteChanged(path, text);
    const pickLookup = (match: LookupMatch, context: EditorSuggestContext) => {
      openLookup(this.app, match, context, noteChanged, openers).catch((error: unknown) => new Notice(`Couldn't open it: ${messageOf(error)}`));
    };
    this.registerEditorSuggest(new LookupSuggest(this.app, (path, text) => this.store.currentAsEdited(path, text), inSession, pickLookup));
    this.registerMarkdownPostProcessor((element, context) => {
      if (inSession(context.sourcePath)) colourMarkers(element);
    });
    this.followTheme();
    this.app.workspace.onLayoutReady(() => closeRetiredViews(this.app.workspace));
    this.app.workspace.onLayoutReady(() => void this.watchCampaign());
    this.app.workspace.onLayoutReady(() => this.watchBackgrounds());
  }

  private chosenCampaignFrom(settings: PluginSettings): ChosenCampaign {
    return new ChosenCampaign(settings, (changed) => this.saveData(changed), (folder) => this.store.open(folder));
  }

  private watchBackgrounds(): void {
    const refresh = new BackgroundRefresh(() => this.showBackgrounds());
    const layoutChanged = () => refresh.layoutChanged();
    this.registerEvent(this.app.workspace.on("layout-change", layoutChanged));
    this.registerEvent(this.app.workspace.on("file-open", layoutChanged));
    this.registerEvent(this.app.metadataCache.on("changed", (file) => refresh.noteChanged(file.path)));
    this.registerEvent(this.app.vault.on("create", layoutChanged));
    this.registerEvent(this.app.vault.on("rename", layoutChanged));
    this.registerEvent(this.app.vault.on("delete", layoutChanged));
    this.register(() => refresh.cancel());
    this.register(() => this.eachNoteView((view) => showBackground(view.contentEl, null)));
    this.showBackgrounds();
  }

  private showBackgrounds(): void {
    const folders = this.campaignFolders();
    const urlOf = (picture: TFile) => this.app.vault.getResourcePath(picture);
    this.eachNoteView((view) => {
      if (view.file === null) showBackground(view.contentEl, null);
      else showBackground(view.contentEl, shownBackgroundOf(view.file.path, folders, this.app.metadataCache, urlOf));
    });
  }

  private eachNoteView(act: (view: MarkdownView) => void): void {
    this.app.workspace.iterateAllLeaves((leaf) => {
      if (leaf.view instanceof MarkdownView) act(leaf.view);
    });
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
    if (folder !== null) await this.chosen.choose(folder);
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
    this.registerEvent(this.app.vault.on("rename", (file, oldPath) => {
      this.chosen.renamed(file.path, oldPath).catch((error: unknown) => new Notice(`Couldn't keep the chosen campaign: ${messageOf(error)}`));
    }));
    this.registerEvent(this.app.workspace.on("file-open", (file) => void this.followCampaignOf(file)));
  }

  private readEditor(info: MarkdownFileInfo, file: TFile): void {
    const text = editorTextOf(info, file, this.app.vault);
    if (text !== null) this.store.noteChanged(file.path, text);
  }

  private watchFiles(changed: (path: string) => void): () => void {
    const events = [
      this.app.vault.on("create", (file) => changed(file.path)),
      this.app.vault.on("delete", (file) => changed(file.path)),
      this.app.vault.on("rename", (file, oldPath) => {
        changed(file.path);
        changed(oldPath);
      }),
    ];
    return () => {
      for (const event of events) this.app.vault.offref(event);
    };
  }

  private campaignFolders(): string[] {
    return findCampaignFolders(this.app.vault.getFiles().map((file) => file.path));
  }

  private startingCampaignFolder(): string | null {
    return startingCampaignFolder(activePathOf(this.app), this.chosen.folder, this.campaignFolders());
  }

  private async followCampaignOf(file: TFile | null): Promise<void> {
    if (file === null) return;
    const folder = campaignFolderOf(file.path, this.campaignFolders());
    if (folder === null || folder === this.store.campaignFolder) return;
    await this.chosen.choose(folder);
  }
}
