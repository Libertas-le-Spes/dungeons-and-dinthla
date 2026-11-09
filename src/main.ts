import { debounce, MarkdownView, Notice, Plugin, WorkspaceLeaf, type EditorSuggestContext, type MarkdownFileInfo, type TFile, type ViewState } from "obsidian";
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
import { chooseSheetValue, openCharacterSheet } from "./characters/open-character-sheet";
import { sheetNotesOf } from "./characters/sheet-notes";
import { mentionNotesOf } from "./characters/mention-notes";
import { editorTextOf } from "./campaign/editor-text";
import { markerColouring } from "./editor/marker-decorations";
import type { LookupMatch } from "./lookups/lookup";
import { LookupSuggest } from "./lookups/lookup-suggest";
import { openLookup } from "./lookups/open-lookup";
import type { LookupOpeners } from "./lookups/open-match";
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
import type { DashboardActions } from "./dashboard/dashboard-page";
import { campaignSections, type PageId, type ShowPage } from "./interface/campaign-pages";
import { campaignStateFor, type Takeover } from "./interface/campaign-takeover";
import { isCampaignViewRegistered } from "./interface/campaign-view-registered";
import { castSection } from "./interface/cast-section";
import { fundsSection } from "./interface/funds-section";
import { noteSection } from "./interface/note-section";
import { openInEditor } from "./interface/open-in-editor";
import { notesSection } from "./interface/notes-section";
import { keepOneCampaignTab } from "./interface/one-campaign-tab";
import { pathYouAreIn, shownCampaignPathOf } from "./interface/shown-campaign-path";
import { takeOpenLeaves } from "./interface/take-open-leaves";
import { patchSetViewState, type ChangeViewState } from "./interface/view-state-patch";
import { CAMPAIGN_VIEW, CampaignView } from "./interface/campaign-view";
import { openCampaignPage } from "./interface/open-campaign";
import { TabBackground } from "./interface/tab-background";
import { closeRetiredViews } from "./interface/retired-views";
import { colourMarkers } from "./reading/colour-markers";
import { BackgroundRefresh, showBackground, shownBackgroundOf } from "./reading/note-background";
import { CampaignSettingTab } from "./settings/campaign-setting-tab";
import { CampaignsFolder } from "./settings/campaigns-folder";
import { CampaignsFolderSetup } from "./settings/campaigns-folder-setup";
import { FolderSuggestModal } from "./settings/folder-suggest-modal";
import { ChosenCampaign } from "./settings/chosen-campaign";
import { flushWhenClosing, type Closing } from "./settings/flush-when-closing";
import { LocalDrafts, type LocalStorage } from "./settings/local-drafts";
import { OldDrafts } from "./settings/old-drafts";
import { settingsOf, type PluginSettings } from "./settings/plugin-settings";
import { CampaignMaker } from "./campaign/campaign-maker";
import { Help } from "./welcome/help";
import { welcomeOpenerOf } from "./welcome/welcome-opener";
import { Gatekeeper } from "./fence/gatekeeper";
import { homeSection } from "./interface/home-section";
import { welcomeSection } from "./interface/welcome-section";
import { campaignsFolderFirst } from "./interface/campaigns-folder-first";
import { NEWS_BY_VERSION } from "./whats-new/news-by-version";
import { sessionHeadingOf } from "./sessions/session-heading";
import { startSession } from "./sessions/start-session";
import { sessionPropertiesOf } from "./sessions/session-properties";
import { AppendWriter } from "./session-notes/append-writer";
import { Drafts } from "./session-notes/drafts";
import { KeptDrafts } from "./session-notes/kept-drafts";
import { setAsideGoneNotes } from "./session-notes/gone-notes";
import { noteTextsOf } from "./campaign/note-texts";
import { NoteDrafts } from "./note-editing/note-drafts";
import { NoteSaver } from "./note-editing/note-saver";
import { SessionClearer } from "./session-notes/session-clearer";
import { SessionTrash } from "./session-notes/session-trash";
import { deletesPermanently } from "./session-notes/trash-option";
import { ConfirmModal, type ConfirmText } from "./views/confirm-modal";
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
  private campaignsFolder = this.campaignsFolderFrom(settingsOf(null));
  private readonly gate = new Gatekeeper(this.app, () => this.campaignsFolder.path);
  private readonly store = new CampaignStore(this.gate.files);
  private readonly localStorage: LocalStorage = {
    load: (key) => this.app.loadLocalStorage(key),
    save: (key, value) => this.app.saveLocalStorage(key, value),
  };
  private oldDrafts = new OldDrafts(null, this.localStorage);
  private chosen = this.chosenCampaignFrom(settingsOf(null));

  override async onload(): Promise<void> {
    const saved: unknown = await this.loadData();
    const settings = settingsOf(saved);
    this.oldDrafts = new OldDrafts(saved, this.localStorage);
    this.chosen = this.chosenCampaignFrom(settings);
    this.campaignsFolder = this.campaignsFolderFrom(settings);
    const gate = this.gate;
    this.addChild(gate.files);
    const helpFiles = {
      campaignFolders: () => this.campaignFolders(),
      filePaths: () => gate.files.getFiles().map((file) => file.path),
    };
    const help = new Help(settings, this.manifest, NEWS_BY_VERSION, (changed) => this.saveSettings(changed), helpFiles, welcomeOpenerOf(this.app));
    const pickFolder = (folders: string[], chosen: (folder: string) => void) => new FolderSuggestModal(this.app, folders, chosen).open();
    const campaignsFolderSetup = new CampaignsFolderSetup(this.campaignsFolder, gate.folders, pickFolder);
    const campaignChoice = {
      folders: () => this.campaignFolders(),
      chosen: () => chosenCampaignFolder(this.chosen.folder, this.campaignFolders()),
      choose: (folder: string) => this.chosen.choose(folder),
    };
    this.addSettingTab(new CampaignSettingTab(this.app, this, gate, campaignsFolderSetup, campaignChoice, () => help.showWelcome()));
    const actions = {
      openRow: (source: Source) => void openSource(this.app, gate, source),
      openLink: (linktext: string, sourcePath: string) => void this.app.workspace.openLinkText(linktext, sourcePath),
    };
    const openQuestionAt = (source: Source, onClosed: (changed: boolean) => void) =>
      openQuestion(this.app, gate, this.store, source, () => void openSource(this.app, gate, source), onClosed, pathYouAreIn(this.app));
    const createQuestion = {
      label: "New question",
      open: (returnFocus: () => void) => openNewQuestion(this.app, gate, this.store, returnFocus),
    };
    const openQuestAt = (source: Source, onClosed: (changed: boolean) => void) =>
      openQuest(this.app, gate, this.store, source, () => void openSource(this.app, gate, source), onClosed, pathYouAreIn(this.app));
    const createQuest = {
      label: "New quest",
      open: (returnFocus: () => void) => openNewQuest(this.app, gate, this.store, returnFocus),
    };
    const noteExists = (name: string, sourcePath: string) => gate.metadata.getFirstLinkpathDest(name, sourcePath) !== null;
    const addCoin = (returnFocus: () => void) => openAddCoin(this.app, gate, this.store, returnFocus, pathYouAreIn(this.app));
    const openItem = (name: string, source: Source, onClosed: (changed: boolean) => void) =>
      openItemDialog(this.app, gate, this.store, name, () => void openSource(this.app, gate, source), onClosed, pathYouAreIn(this.app));
    const openLedgerEntry = ledgerEntryOpener(this.app, gate, this.store, openItem);
    const campaignFolders = () => this.campaignFolders();
    const characterNotes = characterNotesOf(gate, campaignFolders);
    const sheetNotes = sheetNotesOf(gate, campaignFolders);
    const sheetActions = {
      ...actions,
      editCharacter: (file: TFile) => editCharacter(this.app, gate, characterNotes, file),
      chooseValue: (file: TFile, value: SheetValue, onClosed: () => void) =>
        void chooseSheetValue(this.app, gate, this.store, sheetNotes, file, value, actions.openRow, onClosed),
    };
    const mentionNotes = mentionNotesOf(gate, campaignFolders);
    const galleryActions = { ...actions, openRow: (source: Source) => void openCharacterSheet(this.app, gate, source.path) };
    const newCharacter = (returnFocus: () => void) => openNewCharacter(this.app, gate, this.store.campaignFolder, returnFocus);
    this.registerBasesView(CHARACTERS_VIEW, {
      name: "Characters",
      icon: "users",
      factory: (controller, containerEl) => new CharactersView(controller, containerEl, this.store, characterNotes, galleryActions, newCharacter),
    });
    const shownPath = () => shownCampaignPathOf(this.app.workspace);
    this.addCommand({ id: "edit-character", name: "Edit character", checkCallback: (checking) => editActiveCharacter(this.app, gate, characterNotes, shownPath, checking) });
    this.registerEvent(this.app.workspace.on("file-menu", (menu, file) => addEditCharacterItem(this.app, gate, characterNotes, menu, file)));
    const openNotes = (path: string) => openCampaignPage(this.app, "notes", path);
    const newSession = () => startSession(this.app, gate, this.store.campaignFolder, openNotes);
    this.addRibbonIcon("calendar-plus", "Start a new session", newSession);
    const dashboardActionsFor = (show: ShowPage): DashboardActions => ({
      ...actions,
      openQuestion: openQuestionAt,
      openQuest: openQuestAt,
      openLedgerEntry,
      showQuestions: () => show({ page: "questions", path: null }),
      showQuests: () => show({ page: "quests", path: null }),
      showFunds: () => show({ page: "funds", path: null }),
      showCharacters: () => show({ page: "cast", path: null }),
      openCharacterSheet: (path: string) => show({ page: "cast", path }),
      startSession: newSession,
      writeNotes: (path: string) => show({ page: "notes", path }),
      sessionHeadingOf: (path: string) => sessionHeadingOf(path, gate.metadata),
    });
    const watchFiles = (changed: (path: string) => void) => this.watchFiles(changed);
    const castNeeds = { store: this.store, characterNotes, sheetNotes, mentionNotes, actions, sheetActions, newCharacter, watchFiles };
    const openers: LookupOpeners = { question: openQuestionAt, quest: openQuestAt, item: openItem };
    const local = this.localDrafts(settings);
    const drafts = new Drafts(local.read(), () => local.changed(drafts.all()));
    flushWhenClosing(local, this.closing());
    const keptDrafts = new KeptDrafts(drafts, () => Date.now());
    const noteDrafts = new NoteDrafts(drafts);
    this.moveOldDrafts(keptDrafts, local, settings);
    this.registerEvent(gate.files.on("rename", (file, oldPath) => keptDrafts.noteRenamed(oldPath, file.path)));
    this.registerEvent(gate.files.on("rename", (file, oldPath) => noteDrafts.moved(oldPath, file.path)));
    this.registerEvent(gate.files.on("delete", (file) => keptDrafts.noteDeleted(file.path)));
    this.app.workspace.onLayoutReady(() => setAsideGoneNotes(keptDrafts, this.campaignsFolder.path, (key) => this.draftStaysLive(noteDrafts, key)));
    const texts = noteTextsOf(gate);
    const wholeText = { texts, drafts: noteDrafts, saver: new NoteSaver(gate.files) };
    const notesNeeds = {
      store: this.store,
      drafts,
      keptDrafts,
      writer: new AppendWriter(gate.files),
      propertiesOf: (path: string) => sessionPropertiesOf(path, gate.metadata),
      openers,
      actions,
      wholeText,
      removal: {
        clearer: new SessionClearer(gate.files),
        trash: new SessionTrash(gate.files, gate.fileActions, () => deletesPermanently(gate.settings)),
        confirm: (text: ConfirmText, confirmed: () => void, closed: () => void) => new ConfirmModal(this.app, text, confirmed, closed).open(),
      },
      startSession: newSession,
    };
    const welcome = welcomeSection({
      store: this.store,
      campaignsFolder: campaignsFolderSetup,
      maker: new CampaignMaker(gate.files, () => this.campaignsFolder.path, (folder) => this.chosen.choose(folder)),
      startSession: newSession,
    });
    const pages = campaignSections({
      home: homeSection({ store: this.store, characterNotes, news: help.whatsNew, actionsFor: dashboardActionsFor }),
      cast: castSection(castNeeds),
      notes: notesSection(notesNeeds),
      questions: (contentEl) => new ListPage(contentEl, this.store, actions.openLink, openQuestionAt, questionsKind, createQuestion),
      quests: (contentEl) => new ListPage(contentEl, this.store, actions.openLink, openQuestAt, questsKind, createQuest),
      funds: fundsSection({
        store: this.store,
        texts,
        actions,
        noteExists,
        addCoin,
        openLedgerEntry,
        openItem,
        campaignFolders: () => this.campaignFolders(),
      }),
      note: noteSection({
        ...wholeText,
        actions,
        isCampaignNote: (path: string) => campaignFolderOf(path, this.campaignFolders()) !== null,
        openInEditor: (path: string) => void openInEditor(this.app, gate, path),
      }),
      welcome,
    });
    const sections = campaignsFolderFirst(pages, welcome, () => this.campaignsFolder.path);
    const backdropFor = (frameEl: HTMLElement) => new TabBackground(frameEl, this.store, gate.metadata, gate.files);
    this.registerView(CAMPAIGN_VIEW, (leaf) => new CampaignView(leaf, this.store, sections, (path) => void this.followCampaignOf(path), backdropFor, gate.files));
    for (const opener of PAGE_OPENERS) {
      const open = () => void openCampaignPage(this.app, opener.page, null);
      this.addRibbonIcon(opener.icon, opener.name, open);
      this.addCommand({ id: opener.id, name: opener.name, callback: open });
    }
    this.addCommand({ id: "start-session", name: "Start a new session", callback: newSession });
    const inSession = (path: string) => isSessionNote(path, this.campaignsFolder.path, (notePath) => gate.files.getFileByPath(notePath) !== null);
    this.registerEditorExtension(markerColouring(inSession));
    const noteChanged = (path: string, text: string) => this.store.noteChanged(path, text);
    const pickLookup = (match: LookupMatch, context: EditorSuggestContext) => {
      openLookup(this.app, match, context, noteChanged, openers).catch((error: unknown) => new Notice(`Couldn't open it: ${messageOf(error)}`));
    };
    this.registerEditorSuggest(new LookupSuggest(this.app, (path, text) => this.store.currentAsEdited(path, text), inSession, pickLookup));
    this.registerMarkdownPostProcessor((element, context) => {
      if (inSession(context.sourcePath)) colourMarkers(element);
    });
    this.followTheme();
    this.app.workspace.onLayoutReady(() => {
      this.startCampaign(help).catch((error: unknown) => new Notice(`Couldn't start the campaign: ${messageOf(error)}`));
    });
    this.app.workspace.onLayoutReady(() => this.watchBackgrounds());
    this.takeOverOpening();
  }

  private takeOverOpening(): void {
    const takeover: Takeover = {
      campaignViewRegistered: () => isCampaignViewRegistered(this.app),
      holds: (path: string) => this.gate.fence.holds(path),
      campaignFolders: () => this.campaignFolders(),
    };
    const change = (viewState: ViewState) => campaignStateFor(viewState, takeover);
    const settled = keepOneCampaignTab(this.app.workspace, (run) => window.setTimeout(run, 0));
    this.register(patchSetViewState(WorkspaceLeaf.prototype, { change, settled }));
    this.app.workspace.onLayoutReady(() => void this.openCampaignFiles(change));
  }

  private async openCampaignFiles(change: ChangeViewState): Promise<void> {
    await takeOpenLeaves(this.app.workspace, change);
    closeRetiredViews(this.app.workspace);
  }

  private localDrafts(settings: PluginSettings): LocalDrafts {
    const timer = {
      start: (run: () => void, ms: number) => window.setTimeout(run, ms),
      stop: (id: number) => window.clearTimeout(id),
    };
    return new LocalDrafts(this.localStorage, timer, {
      written: () => this.oldDraftsKept(settings),
      failed: (error) => new Notice(`Couldn't keep the text typed in the campaign tab: ${messageOf(error)}`),
    });
  }

  private draftStaysLive(noteDrafts: NoteDrafts, key: string): boolean {
    if (noteDrafts.owns(key)) return true;
    return this.gate.files.getFileByPath(key) !== null;
  }

  private closing(): Closing {
    return {
      onUnload: (run) => this.register(run),
      onQuit: (run) => this.registerEvent(this.app.workspace.on("quit", run)),
      onVisibilityChange: (run) => this.registerDomEvent(document, "visibilitychange", run),
      onPageHide: (run) => this.registerDomEvent(window, "pagehide", run),
      pageHidden: () => document.visibilityState === "hidden",
    };
  }

  private moveOldDrafts(keptDrafts: KeptDrafts, local: LocalDrafts, settings: PluginSettings): void {
    if (this.oldDrafts.waiting) {
      keptDrafts.keepMoved(this.oldDrafts.texts);
      local.flush();
    }
    this.dropOldDrafts(settings);
  }

  private oldDraftsKept(settings: PluginSettings): void {
    this.oldDrafts.keptOnDevice();
    this.dropOldDrafts(settings);
  }

  private dropOldDrafts(settings: PluginSettings): void {
    if (!this.oldDrafts.leftInFile) return;
    this.saveSettings(settings)
      .then(() => this.oldDrafts.fileRewritten())
      .catch((error: unknown) => new Notice(`Couldn't tidy the plugin's settings file: ${messageOf(error)}`));
  }

  private async saveSettings(settings: PluginSettings): Promise<void> {
    await this.saveData(this.oldDrafts.dataOf(settings));
  }

  private chosenCampaignFrom(settings: PluginSettings): ChosenCampaign {
    return new ChosenCampaign(settings, (changed) => this.saveSettings(changed), (folder) => this.store.open(folder));
  }

  private campaignsFolderFrom(settings: PluginSettings): CampaignsFolder {
    return new CampaignsFolder(settings, (changed) => this.saveSettings(changed), () => this.lookAgain());
  }

  private async lookAgain(): Promise<void> {
    const folder = this.startingCampaignFolder();
    if (folder === null) this.store.close();
    else await this.chosen.choose(folder);
    this.showBackgrounds();
  }

  private watchBackgrounds(): void {
    const refresh = new BackgroundRefresh(() => this.showBackgrounds(), () => this.campaignsFolder.path);
    const layoutChanged = () => refresh.layoutChanged();
    this.registerEvent(this.app.workspace.on("layout-change", layoutChanged));
    this.registerEvent(this.app.workspace.on("file-open", layoutChanged));
    this.registerEvent(this.gate.metadata.on("changed", (file) => refresh.noteChanged(file.path)));
    this.registerEvent(this.gate.files.on("create", layoutChanged));
    this.registerEvent(this.gate.files.on("rename", layoutChanged));
    this.registerEvent(this.gate.files.on("delete", layoutChanged));
    this.register(() => refresh.cancel());
    this.register(() => this.eachNoteView((view) => showBackground(view.contentEl, null)));
    this.showBackgrounds();
  }

  private showBackgrounds(): void {
    const folders = this.campaignFolders();
    const urlOf = (picture: TFile) => this.gate.files.getResourcePath(picture);
    this.eachNoteView((view) => {
      if (view.file === null) showBackground(view.contentEl, null);
      else showBackground(view.contentEl, shownBackgroundOf(view.file.path, folders, this.gate.metadata, urlOf));
    });
  }

  private eachNoteView(act: (view: MarkdownView) => void): void {
    this.app.workspace.iterateAllLeaves((leaf) => {
      if (leaf.view instanceof MarkdownView) act(leaf.view);
    });
  }

  private followTheme(): void {
    const followThemeClass = new FollowThemeClass(() => usesCommunityTheme(this.gate.settings));
    followThemeClass.add(document.body);
    this.registerEvent(this.app.workspace.on("css-change", () => followThemeClass.update()));
    this.registerEvent(this.app.workspace.on("window-open", (popout) => followThemeClass.add(popout.doc.body)));
    this.registerEvent(this.app.workspace.on("window-close", (popout) => followThemeClass.remove(popout.doc.body)));
    this.register(() => followThemeClass.clear());
    this.app.workspace.onLayoutReady(() => {
      this.app.workspace.iterateAllLeaves((leaf) => followThemeClass.add(leaf.view.containerEl.doc.body));
    });
  }

  private async startCampaign(help: Help): Promise<void> {
    await this.watchCampaign();
    await help.start();
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
    this.registerEvent(this.gate.metadata.on("changed", (file, text) => this.store.noteChanged(file.path, text)));
    this.registerEvent(this.gate.files.on("delete", (file) => this.store.noteDeleted(file.path)));
    this.registerEvent(this.gate.files.on("rename", (file, oldPath) => void this.store.noteRenamed(file.path, oldPath)));
    this.registerEvent(this.gate.files.on("rename", (file, oldPath) => {
      this.chosen.renamed(file.path, oldPath).catch((error: unknown) => new Notice(`Couldn't keep the chosen campaign: ${messageOf(error)}`));
    }));
    this.registerEvent(this.app.workspace.on("file-open", (file) => {
      if (file !== null) void this.followCampaignOf(file.path);
    }));
  }

  private readEditor(info: MarkdownFileInfo, file: TFile): void {
    const text = editorTextOf(info, file, this.gate.files);
    if (text !== null) this.store.noteChanged(file.path, text);
  }

  private watchFiles(changed: (path: string) => void): () => void {
    const events = [
      this.gate.files.on("create", (file) => changed(file.path)),
      this.gate.files.on("delete", (file) => changed(file.path)),
      this.gate.files.on("rename", (file, oldPath) => {
        changed(file.path);
        changed(oldPath);
      }),
    ];
    return () => {
      for (const event of events) this.gate.files.offref(event);
    };
  }

  private campaignFolders(): string[] {
    return findCampaignFolders(this.gate.files.getFiles().map((file) => file.path), this.campaignsFolder.path);
  }

  private startingCampaignFolder(): string | null {
    return startingCampaignFolder(activePathOf(this.app), this.chosen.folder, this.campaignFolders());
  }

  private async followCampaignOf(path: string): Promise<void> {
    const folder = campaignFolderOf(path, this.campaignFolders());
    if (folder === null || folder === this.store.campaignFolder) return;
    await this.chosen.choose(folder);
  }
}
