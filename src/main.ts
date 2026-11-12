import { debounce, MarkdownView, Notice, Plugin, WorkspaceLeaf, type MarkdownFileInfo, type PaneType, type TFile, type ViewState } from "obsidian";
import type { Source } from "./campaign/record/campaign";
import type { SheetValue } from "./characters/reading/character-sheet";
import { messageOf } from "./views/dialogs/message-of";
import {
  campaignFolderOf,
  chosenCampaignFolder,
  findCampaignFolders,
  isSessionNote,
  startingCampaignFolder,
} from "./campaign/paths/campaign-folders";
import { CampaignStore } from "./campaign/reading/campaign-store";
import { SavedCampaign } from "./campaign/reading/saved-campaign";
import { characterNotesOf } from "./characters/reading/character-notes";
import { CHARACTERS_VIEW, CharactersView } from "./characters/pages/characters-view";
import { addEditCharacterItem, editActiveCharacter, editCharacter, openNewCharacter } from "./characters/editing/open-character";
import { chooseSheetValue, openCharacterSheet } from "./characters/editing/open-character-sheet";
import { sheetNotesOf } from "./characters/reading/sheet-notes";
import { mentionNotesOf } from "./characters/reading/mention-notes";
import { editorTextOf } from "./campaign/reading/editor-text";
import { markerColouring } from "./editor/marker-decorations";
import type { LookupOpeners } from "./kinds/lookup-openers";
import { openNewQuestion } from "./questions/dialogs/open-new-question";
import { openQuestion } from "./questions/dialogs/open-question";
import { questionsKind } from "./questions/list/questions-kind";
import { openNewQuest } from "./quests/dialogs/open-new-quest";
import { openQuest } from "./quests/dialogs/open-quest";
import { questsKind } from "./quests/list/quests-kind";
import { openAddCoin } from "./funds/coins/open-add-coin";
import { openItemDialog } from "./funds/items/open-item";
import { ItemHolders } from "./funds/item-notes/item-holders";
import { askInNotice } from "./kind-notes/differing-notice";
import { startKindNotes } from "./kind-notes/kind-notes-wiring";
import { NotesMade } from "./settings/saved/notes-made";
import { ledgerEntryOpener } from "./funds/coins/open-ledger-entry";
import { ListPage } from "./views/lists/list-page";
import { activePathOf, openSource } from "./views/opening/open-view";
import { openLink } from "./views/opening/open-link";
import type { DashboardActions } from "./dashboard/dashboard-page";
import { campaignSections, type PageId, type ShowPage } from "./interface/view/campaign-pages";
import { campaignStateFor, type Takeover } from "./interface/takeover/campaign-takeover";
import { isCampaignViewRegistered } from "./interface/view/campaign-view-registered";
import { castSection } from "./interface/sections/cast-section";
import { fundsSection } from "./interface/sections/funds-section";
import { noteSection } from "./interface/sections/note-section";
import { openInEditor } from "./interface/view/open-in-editor";
import { notesSection } from "./interface/sections/notes-section";
import { keepOneCampaignTab } from "./interface/tabs/one-campaign-tab";
import { pathYouAreIn, shownCampaignPathOf } from "./interface/view/shown-campaign-path";
import { takeOpenLeaves } from "./interface/takeover/take-open-leaves";
import { patchSetViewState, type ChangeViewState } from "./interface/takeover/view-state-patch";
import { CAMPAIGN_VIEW, CampaignView } from "./interface/view/campaign-view";
import { lookAgain } from "./interface/view/look-again";
import { openCampaignPage } from "./interface/tabs/open-campaign";
import { TabBackground } from "./interface/view/tab-background";
import { closeRetiredViews } from "./interface/takeover/retired-views";
import { colourMarkers } from "./reading/colour-markers";
import { BackgroundRefresh, showBackground, shownBackgroundOf } from "./reading/note-background";
import { CampaignSettingTab } from "./settings/choosing/campaign-setting-tab";
import { FolderSuggestModal } from "./settings/choosing/folder-suggest-modal";
import { flushWhenClosing, type Closing } from "./settings/drafts/flush-when-closing";
import { LocalDrafts, type LocalStorage } from "./settings/drafts/local-drafts";
import { OldDrafts } from "./settings/drafts/old-drafts";
import { CampaignsFolderSetting } from "./settings/saved/campaigns-folder-setting";
import { ChosenCampaign } from "./settings/saved/chosen-campaign";
import { settingsOf, type PluginSettings } from "./settings/saved/plugin-settings";
import { SettingsSaver } from "./settings/saved/settings-saver";
import type { Help } from "./welcome/opening/help";
import { welcomeOpenerOf } from "./welcome/opening/welcome-opener";
import { Gatekeeper } from "./fence/gate/gatekeeper";
import { homeSection } from "./interface/sections/home-section";
import { welcomeWiring } from "./interface/sections/welcome-wiring";
import { sessionNotesWiring } from "./interface/sections/session-notes-wiring";
import { campaignsFolderFirst } from "./interface/view/campaigns-folder-first";
import { sessionHeadingOf } from "./sessions/session-heading";
import { startSession } from "./sessions/start-session";
import { Drafts } from "./session-notes/drafts/drafts";
import type { KeptDrafts } from "./session-notes/kept/kept-drafts";
import { DraftKeeping } from "./session-notes/kept/draft-keeping";
import { ConfirmModal, type ConfirmText } from "./views/dialogs/confirm-modal";
import { usesCommunityTheme } from "./theme/community-theme";
import { FollowThemeClass } from "./theme/follow-theme-class";

const TYPING_PAUSE_MS = 250;
const NOTICE_STAYS_UNTIL_DISMISSED = 0;

const PAGE_OPENERS: { page: PageId; id: string; name: string; icon: string }[] = [
  { page: "home", id: "open-dashboard", name: "Open dashboard", icon: "layout-dashboard" },
  { page: "cast", id: "open-characters", name: "Open characters", icon: "users" },
  { page: "questions", id: "open-questions", name: "Open questions", icon: "circle-help" },
  { page: "quests", id: "open-quests", name: "Open quests", icon: "scroll-text" },
  { page: "funds", id: "open-funds", name: "Open party funds", icon: "coins" },
];

export default class DungeonsAndDinthla extends Plugin {
  private readonly gate = new Gatekeeper(this.app, () => this.campaignsFolderSetting.path);
  private settingsSaver = this.settingsSaverOf(settingsOf(null, this.gate.configDir));
  private campaignsFolderSetting = this.campaignsFolderSettingFrom(this.settingsSaver);
  private readonly store = new CampaignStore(this.gate.files);
  private readonly localStorage: LocalStorage = {
    load: (key) => this.app.loadLocalStorage(key),
    save: (key, value) => this.app.saveLocalStorage(key, value),
  };
  private oldDrafts = new OldDrafts(null, this.localStorage);
  private chosen = this.chosenCampaignFrom(this.settingsSaver);

  override async onload(): Promise<void> {
    await this.loadSettings();
    const gate = this.gate;
    this.addChild(gate.files);
    const openNotes = (path: string) => openCampaignPage(this.app, "notes", path);
    const newSession = () => startSession(this.app, gate, this.store.campaignFolder, openNotes);
    const { help, campaignsFolderSetup, welcome } = welcomeWiring({
      gate,
      store: this.store,
      saver: this.settingsSaver,
      manifest: this.manifest,
      setting: this.campaignsFolderSetting,
      campaignFolders: () => this.campaignFolders(),
      chooseCampaign: (folder: string) => this.chosen.choose(folder),
      openWelcome: welcomeOpenerOf(this.app),
      pickFolder: (folders: string[], chosen: (folder: string) => void) => new FolderSuggestModal(this.app, folders, chosen).open(),
      startSession: newSession,
    });
    const campaignChoice = {
      folders: () => this.campaignFolders(),
      chosen: () => chosenCampaignFolder(this.chosen.folder, this.campaignFolders()),
      choose: (folder: string) => this.chosen.choose(folder),
    };
    this.addSettingTab(new CampaignSettingTab(this.app, this, gate, campaignsFolderSetup, campaignChoice, () => help.showWelcome()));
    const linkPlace = { gate, campaignFolders: () => this.campaignFolders() };
    const actions = {
      openRow: (source: Source) => void openSource(this.app, gate, source),
      openLink: (linktext: string, sourcePath: string, newLeaf: PaneType | boolean) =>
        void openLink(this.app, linkPlace, linktext, sourcePath, newLeaf),
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
    const { drafts, keeping } = this.keepDrafts();
    const sessionNotes = sessionNotesWiring({
      gate,
      store: this.store,
      drafts,
      keeping,
      openers,
      actions,
      confirm: (text: ConfirmText, confirmed: () => void, closed: () => void) => new ConfirmModal(this.app, text, confirmed, closed).open(),
      campaignFolders: () => this.campaignFolders(),
      report: (message: string) => new Notice(message, NOTICE_STAYS_UNTIL_DISMISSED),
      startSession: newSession,
    });
    const pages = campaignSections({
      home: homeSection({ store: this.store, characterNotes, news: help.whatsNew, actionsFor: dashboardActionsFor }),
      cast: castSection(castNeeds),
      notes: notesSection(sessionNotes.notes),
      questions: (contentEl) => new ListPage(contentEl, this.store, actions.openLink, openQuestionAt, questionsKind, createQuestion),
      quests: (contentEl) => new ListPage(contentEl, this.store, actions.openLink, openQuestAt, questsKind, createQuest),
      funds: fundsSection({
        store: this.store,
        texts: sessionNotes.wholeText.texts,
        actions,
        noteExists,
        addCoin,
        openLedgerEntry,
        openItem,
        campaignFolders: () => this.campaignFolders(),
      }),
      note: noteSection({
        ...sessionNotes.wholeText,
        actions,
        isCampaignNote: (path: string) => campaignFolderOf(path, this.campaignFolders()) !== null,
        openInEditor: (path: string) => void openInEditor(this.app, gate, path),
      }),
      welcome,
    });
    const sections = campaignsFolderFirst(pages, welcome, () => this.campaignsFolderSetting.path);
    const backdropFor = (frameEl: HTMLElement) => new TabBackground(frameEl, this.store, gate.metadata, gate.files);
    this.registerView(CAMPAIGN_VIEW, (leaf) => new CampaignView(leaf, this.store, sections, (path) => void this.followCampaignOf(path), backdropFor, gate.files));
    this.addPageOpeners(newSession);
    this.colourSessionNotes();
    this.followTheme();
    this.app.workspace.onLayoutReady(() => {
      this.startCampaign(help).catch((error: unknown) => new Notice(`Couldn't start the campaign: ${messageOf(error)}`));
    });
    this.app.workspace.onLayoutReady(() => this.watchBackgrounds());
    this.takeOverOpening();
  }

  private async loadSettings(): Promise<void> {
    const saved: unknown = await this.loadData();
    const settings = settingsOf(saved, this.gate.configDir);
    this.oldDrafts = new OldDrafts(saved, this.localStorage);
    this.settingsSaver = this.settingsSaverOf(settings);
    this.chosen = this.chosenCampaignFrom(this.settingsSaver);
    this.campaignsFolderSetting = this.campaignsFolderSettingFrom(this.settingsSaver);
  }

  private keepDrafts(): { drafts: Drafts; keeping: DraftKeeping } {
    const local = this.localDrafts();
    const drafts = new Drafts(local.read(), () => local.changed(drafts.all()));
    flushWhenClosing(local, this.closing());
    const needs = { files: this.gate.files, fence: this.gate.fence, campaignsFolder: () => this.campaignsFolderSetting.path, now: () => Date.now() };
    const keeping = this.addChild(new DraftKeeping(drafts, needs));
    this.moveOldDrafts(keeping.keptDrafts, local);
    this.app.workspace.onLayoutReady(() => keeping.setAsideGoneNotes());
    return { drafts, keeping };
  }

  private addPageOpeners(newSession: () => void): void {
    for (const opener of PAGE_OPENERS) {
      const open = () => void openCampaignPage(this.app, opener.page, null);
      this.addRibbonIcon(opener.icon, opener.name, open);
      this.addCommand({ id: opener.id, name: opener.name, callback: open });
    }
    this.addCommand({ id: "start-session", name: "Start a new session", callback: newSession });
  }

  private colourSessionNotes(): void {
    const inSession = (path: string) => isSessionNote(path, this.campaignsFolderSetting.path, (notePath) => this.gate.files.getFileByPath(notePath) !== null);
    this.registerEditorExtension(markerColouring(inSession));
    this.registerMarkdownPostProcessor((element, context) => {
      if (inSession(context.sourcePath)) colourMarkers(element);
    });
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

  private localDrafts(): LocalDrafts {
    const timer = {
      start: (run: () => void, ms: number) => window.setTimeout(run, ms),
      stop: (id: number) => window.clearTimeout(id),
    };
    return new LocalDrafts(this.localStorage, timer, {
      written: () => this.oldDraftsKept(),
      failed: (error) => new Notice(`Couldn't keep the text typed in the campaign tab: ${messageOf(error)}`),
    });
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

  private moveOldDrafts(keptDrafts: KeptDrafts, local: LocalDrafts): void {
    if (this.oldDrafts.waiting) {
      keptDrafts.keepMoved(this.oldDrafts.texts);
      local.flush();
    }
    this.dropOldDrafts();
  }

  private oldDraftsKept(): void {
    this.oldDrafts.keptOnDevice();
    this.dropOldDrafts();
  }

  private dropOldDrafts(): void {
    if (!this.oldDrafts.leftInFile) return;
    this.settingsSaver
      .save({})
      .then(() => this.oldDrafts.fileRewritten())
      .catch((error: unknown) => new Notice(`Couldn't tidy the plugin's settings file: ${messageOf(error)}`));
  }

  private async writeSettings(settings: PluginSettings): Promise<void> {
    await this.saveData(this.oldDrafts.dataOf(settings));
  }

  private settingsSaverOf(settings: PluginSettings): SettingsSaver {
    return new SettingsSaver(settings, (written) => this.writeSettings(written));
  }

  private chosenCampaignFrom(saver: SettingsSaver): ChosenCampaign {
    return new ChosenCampaign(saver, this.store);
  }

  private campaignsFolderSettingFrom(saver: SettingsSaver): CampaignsFolderSetting {
    return new CampaignsFolderSetting(saver, () => this.lookAgain(), this.gate.configDir);
  }

  private async lookAgain(): Promise<void> {
    await lookAgain({
      startingCampaignFolder: () => this.startingCampaignFolder(),
      closeCampaign: () => this.store.close(),
      chooseCampaign: (folder) => this.chosen.choose(folder),
      showBackgrounds: () => this.showBackgrounds(),
      showCampaignTabsAgain: () => this.showCampaignTabsAgain(),
    });
  }

  private showCampaignTabsAgain(): void {
    for (const leaf of this.app.workspace.getLeavesOfType(CAMPAIGN_VIEW)) {
      if (leaf.view instanceof CampaignView) leaf.view.showAgain();
    }
  }

  private watchBackgrounds(): void {
    const refresh = new BackgroundRefresh(() => this.showBackgrounds(), () => this.campaignsFolderSetting.path);
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
    const followThemeClass = new FollowThemeClass(() => usesCommunityTheme(this.gate.vaultSettings));
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
    this.keepItemHolders();
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

  private keepItemHolders(): void {
    const gate = this.gate;
    const notRead = (error: unknown) => new Notice(`Couldn't read the saved session notes: ${messageOf(error)}`);
    const saved = new SavedCampaign({ shown: this.store, files: gate.files, metadata: gate.metadata, failed: notRead });
    const failed = (error: unknown) => new Notice(`Couldn't write an item's holder: ${messageOf(error)}`);
    const holders = new ItemHolders({ store: saved, files: gate.files, metadata: gate.metadata, actions: gate.fileActions, failed });
    const say = (message: string) => new Notice(message, NOTICE_STAYS_UNTIL_DISMISSED);
    const made = new NotesMade(this.settingsSaver);
    this.register(holders.start());
    this.register(startKindNotes({ gate, written: gate.written, saved, made, say, ask: askInNotice }));
    this.register(saved.start());
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
    return findCampaignFolders(this.gate.files.getFiles().map((file) => file.path), this.campaignsFolderSetting.path);
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
