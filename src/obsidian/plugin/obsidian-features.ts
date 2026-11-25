import { debounce, MarkdownView, Notice, WorkspaceLeaf, type App, type MarkdownFileInfo, type PaneType, type Plugin, type TFile, type ViewState } from "obsidian";
import type { Source } from "../../campaign/record/campaign";
import type { SheetValue } from "../../characters/reading/character-sheet";
import { messageOf } from "../../views/dialogs/message-of";
import {
  campaignFolderOf,
  charactersFolderOf,
  chosenCampaignFolder,
  isCampaignNote,
  isSessionNote,
} from "../../campaign/paths/campaign-folders";
import { NewCampaignDialog } from "../../campaign/writing/new-campaign-dialog";
import type { CampaignStore } from "../../campaign/reading/campaign-store";
import { HostCharacterNotes } from "../../characters/reading/character-notes";
import { editCharacter, openNewCharacter } from "../../characters/editing/open-character";
import { addEditCharacterItem, editActiveCharacter, openMadeNote } from "../characters/character-editing-hooks";
import { chooseSheetValue } from "../../characters/editing/open-character-sheet";
import { OldCharactersBases } from "../../characters/retiring/old-characters-bases";
import { OBSIDIAN_SPELLING } from "../notes/obsidian-spelling";
import type { NoteRef } from "../../host/notes/note-ref";
import { readSessions } from "../../campaign/reading/read-campaign";
import { ObsidianNotes } from "../notes/obsidian-notes";
import { OBSIDIAN_SYNTAX } from "../notes/obsidian-syntax";
import { GATE_REPORTS_WRITES } from "../notes/quiet-report";
import { HostSheetNotes } from "../../characters/reading/sheet-notes";
import { HostMentionNotes } from "../../characters/reading/mention-notes";
import { editorTextOf } from "../campaign/editor-text";
import { markerColouring } from "../editor/marker-decorations";
import type { LookupOpeners } from "../../kinds/lookup-openers";
import { openNewQuestion } from "../../questions/dialogs/open-new-question";
import { openQuestion } from "../../questions/dialogs/open-question";
import { questionsKind } from "../../questions/list/questions-kind";
import { openNewQuest } from "../../quests/dialogs/open-new-quest";
import { openQuest } from "../../quests/dialogs/open-quest";
import { questsKind } from "../../quests/list/quests-kind";
import { openAddCoin } from "../../funds/coins/open-add-coin";
import type { CoinSide } from "../../funds/coins/coin-sides";
import { openItemDialog } from "../../funds/items/open-item";
import { FundsTracking } from "../../funds/tracking/funds-tracking";
import { ledgerEntryOpener } from "../../funds/coins/open-ledger-entry";
import { ListPage } from "../../views/lists/list-page";
import { PageFrame } from "../views/frames/page-frame";
import { PLAIN_KIT } from "../views/mount/mount-kit";
import { OBSIDIAN_PAUSES } from "../host/obsidian-pauses";
import { activePathOf, openSource } from "../views/opening/open-view";
import { WantedLines } from "../../views/opening/wanted-lines";
import { openLink } from "../views/opening/open-link";
import type { DashboardActions } from "../../dashboard/dashboard-page";
import { campaignSections, type PageId, type ShowPage } from "../interface/view/campaign-pages";
import { campaignStateFor, type Takeover } from "../interface/takeover/campaign-takeover";
import { isCampaignViewRegistered } from "../interface/view/campaign-view-registered";
import { castSection } from "../interface/sections/cast-section";
import { fundsSection } from "../interface/sections/funds-section";
import { noteSection } from "../interface/sections/note-section";
import { openInEditor } from "../interface/view/open-in-editor";
import { notesSection } from "../interface/sections/notes-section";
import { keepOneCampaignTab } from "../interface/tabs/one-campaign-tab";
import { pathYouAreIn, shownCampaignPathOf } from "../interface/view/shown-campaign-path";
import { takeOpenLeaves } from "../interface/takeover/take-open-leaves";
import { patchSetViewState, type ChangeViewState } from "../interface/takeover/view-state-patch";
import { CAMPAIGN_VIEW, CampaignView } from "../interface/view/campaign-view";
import { openCampaignPage } from "../interface/tabs/open-campaign";
import { TabBackground } from "../interface/view/tab-background";
import { closeRetiredViews } from "../interface/takeover/retired-views";
import { colourMarkers } from "../../reading/colour-markers";
import { BEFORE_OBSIDIANS_MATHS, plainDollarsProcessor } from "../reading/plain-dollars-processor";
import { BackgroundRefresh, showBackground, shownBackgroundOf } from "../reading/note-background";
import { SettingsPage } from "../../settings/page/settings-page";
import { SettingsFrame } from "../settings/settings-frame";
import { ObsidianCampaignLooks } from "../settings/obsidian-campaign-looks";
import { PictureSuggestModal } from "../settings/picture-suggest-modal";
import { FolderSuggestModal } from "../settings/folder-suggest-modal";
import type { Closing } from "../../settings/drafts/flush-when-closing";
import type { CampaignsFolderSetting } from "../../settings/saved/campaigns-folder-setting";
import type { ChosenCampaign } from "../../settings/saved/chosen-campaign";
import type { SettingsSaver } from "../../settings/saved/settings-saver";
import { startPlugin, type StartedPlugin } from "../../plugin/start-plugin";
import type { SavedSettings } from "../../plugin/saved-settings";
import type { CampaignFollowing } from "../../plugin/campaign-following";
import type { FencedNotes } from "../../fence/notes/fenced-notes";
import type { KeptAgreement } from "../../imports/agreement/kept-agreement";
import type { OnlineImport } from "../../imports/dialog/online/online-import";
import type { Dialogs } from "../../views/dialogs/dialog-view";
import type { Telling } from "../../host/showing/telling";
import { ObsidianPluginData } from "../host/obsidian-plugin-data";
import { ObsidianDeviceStorage } from "../host/obsidian-device-storage";
import type { Help } from "../../welcome/opening/help";
import { welcomeOpenerOf } from "../welcome/welcome-opener";
import type { Gatekeeper } from "../../fence/gate/gatekeeper";
import { homeSection } from "../interface/sections/home-section";
import { welcomeWiring } from "../interface/sections/welcome-wiring";
import { sessionNotesWiring } from "../interface/sections/session-notes-wiring";
import { campaignsFolderFirst } from "../interface/view/campaigns-folder-first";
import { sessionHeadingOf } from "../../sessions/session-heading";
import { startSession } from "../../sessions/start-session";
import { PluginDrafts } from "../../plugin/plugin-drafts";
import { NOTICE_STAYS_UNTIL_DISMISSED } from "../../views/dialogs/notice-stays";
import { ConfirmDialog, type ConfirmText } from "../../views/dialogs/confirm-dialog";
import { BeyondOpeners, type BeyondWiring } from "../../imports/dialog/opening/beyond-openers";
import { CampaignAgreement } from "../../imports/agreement/campaign-agreement";
import { onlineImportFor } from "../../imports/dialog/online/online-wiring";
import { OBSIDIAN_BEYOND_CALL } from "../online/obsidian-beyond-call";
import { OBSIDIAN_TELLING } from "../views/frames/obsidian-telling";
import { obsidianDialogsOf } from "../views/frames/modal-frame";
import type { CharacterNotes } from "../../characters/reading/character-notes";

const TYPING_PAUSE_MS = 250;

const PAGE_OPENERS: { page: PageId; id: string; name: string; icon: string }[] = [
  { page: "home", id: "open-dashboard", name: "Open dashboard", icon: "layout-dashboard" },
  { page: "cast", id: "open-characters", name: "Open characters", icon: "users" },
  { page: "questions", id: "open-questions", name: "Open questions", icon: "circle-help" },
  { page: "quests", id: "open-quests", name: "Open quests", icon: "scroll-text" },
  { page: "funds", id: "open-funds", name: "Open party funds", icon: "coins" },
];

export class ObsidianFeatures {
  private readonly app: App;
  private readonly localStorage: ObsidianDeviceStorage;
  private readonly showing: { dialogs: Dialogs; telling: Telling };
  private readonly started: StartedPlugin;
  private readonly notes: FencedNotes;
  private readonly store: CampaignStore;
  private readonly saved: SavedSettings;
  private readonly following: CampaignFollowing;
  private readonly keptAgreement: KeptAgreement;
  private readonly onlineImport: OnlineImport;

  constructor(
    private readonly plugin: Plugin,
    private readonly gate: Gatekeeper,
  ) {
    this.app = plugin.app;
    this.localStorage = new ObsidianDeviceStorage((key: string) => this.app.loadLocalStorage(key), (key: string, value: unknown) => this.app.saveLocalStorage(key, value));
    this.showing = { dialogs: obsidianDialogsOf(this.app), telling: OBSIDIAN_TELLING };
    this.started = startPlugin(
      {
        notes: new ObsidianNotes(this.gate),
        written: this.gate.written,
        report: GATE_REPORTS_WRITES,
        spelling: OBSIDIAN_SPELLING,
        syntax: OBSIDIAN_SYNTAX,
        settingsFolder: this.gate.configDir,
        data: new ObsidianPluginData(() => this.plugin.loadData(), (data: unknown) => this.plugin.saveData(data)),
        device: this.localStorage,
        clock: { now: () => Date.now() },
        timer: { start: (run: () => void, ms: number) => window.setTimeout(run, ms), stop: (id: number) => window.clearTimeout(id) },
        closing: this.closing(),
        telling: OBSIDIAN_TELLING,
        dialogs: this.showing.dialogs,
      },
      {
        activePath: () => activePathOf(this.app),
        showBackgrounds: () => this.showBackgrounds(),
        showCampaignTabsAgain: () => this.showCampaignTabsAgain(),
      },
    );
    this.notes = this.started.notes;
    this.store = this.started.store;
    this.saved = this.started.saved;
    this.following = this.started.following;
    this.keptAgreement = this.started.agreement;
    this.onlineImport = onlineImportFor(this.showing.dialogs, this.keptAgreement, OBSIDIAN_BEYOND_CALL);
  }

  campaignsFolderPath(): string | null {
    return this.campaignsFolderSetting.path;
  }

  async load(): Promise<void> {
    await this.started.load();
    this.plugin.register(this.started.stop.bind(this.started));
    const gate = this.gate;
    this.plugin.addChild(gate.files);
    const openNotes = (path: string) => openCampaignPage(this.app, "notes", path);
    const newSession = () => startSession(this.showing, this.notes, this.store.campaignFolder, openNotes);
    const { maker, help, campaignsFolderSetup, welcome } = welcomeWiring({
      gate,
      notes: this.notes,
      store: this.store,
      saver: this.settingsSaver,
      manifest: this.plugin.manifest,
      setting: this.campaignsFolderSetting,
      campaignFolders: () => this.campaignFolders(),
      chooseCampaign: (folder: string) => this.chosen.choose(folder),
      openWelcome: welcomeOpenerOf(this.app),
      pickFolder: (folders: string[], chosen: (folder: string) => void) => new FolderSuggestModal(this.app, folders, chosen).open(),
      agreement: new CampaignAgreement(this.keptAgreement),
      spelling: OBSIDIAN_SPELLING,
      telling: this.showing.telling,
      startSession: newSession,
    });
    const startNewCampaign = () =>
      this.showing.dialogs.open(new NewCampaignDialog(this.showing.telling, { make: (name: string) => maker.make(name), made: () => void openCampaignPage(this.app, "home", null) }));
    const campaignChoice = {
      startNewCampaign,
      folders: () => this.campaignFolders(),
      chosen: () => chosenCampaignFolder(this.chosen.folder, this.campaignFolders()),
      choose: (folder: string) => this.chosen.choose(folder),
    };
    const settings = new SettingsPage({
      campaignsFolder: campaignsFolderSetup,
      campaigns: campaignChoice,
      looks: new ObsidianCampaignLooks(gate),
      pickPicture: (pictures: string[], chosen: (picture: string) => void) => new PictureSuggestModal(this.app, pictures, chosen).open(),
      changes: this.notes.changes,
      telling: this.showing.telling,
      showWelcome: () => help.showWelcome(),
    });
    this.plugin.addSettingTab(new SettingsFrame(this.app, this.plugin, settings));
    const linkPlace = { gate, notes: this.notes, campaignFolders: () => this.campaignFolders() };
    const actions = {
      openRow: (source: Source) => void openSource(this.app, gate, source),
      openLink: (linktext: string, sourcePath: string, newLeaf: PaneType | boolean) =>
        void openLink(this.app, linkPlace, linktext, sourcePath, newLeaf),
    };
    const openQuestionAt = (source: Source, onClosed: (changed: boolean) => void) =>
      openQuestion(this.showing, this.notes.store, this.store, source, () => void openSource(this.app, gate, source), onClosed, pathYouAreIn(this.app), OBSIDIAN_SYNTAX);
    const createQuestion = {
      label: "New question",
      open: (returnFocus: () => void) => openNewQuestion(this.showing, this.notes.store, this.store, returnFocus, OBSIDIAN_SYNTAX),
    };
    const openQuestAt = (source: Source, onClosed: (changed: boolean) => void) =>
      openQuest(this.showing, this.notes.store, this.store, source, () => void openSource(this.app, gate, source), onClosed, pathYouAreIn(this.app), OBSIDIAN_SYNTAX);
    const createQuest = {
      label: "New quest",
      open: (returnFocus: () => void) => openNewQuest(this.showing, this.notes, this.store, returnFocus, OBSIDIAN_SYNTAX),
    };
    const noteExists = (name: string, sourcePath: string) => gate.metadata.getFirstLinkpathDest(name, sourcePath) !== null;
    const addingCoin = { showing: this.showing, notes: this.notes.store, links: this.notes.links, store: this.store, syntax: OBSIDIAN_SYNTAX };
    const addCoin = (side: CoinSide, returnFocus: () => void) => openAddCoin(addingCoin, side, returnFocus, pathYouAreIn(this.app));
    const openNoteAt = (source: Source) => void openSource(this.app, gate, source);
    const itemOpening = { showing: this.showing, notes: this.notes, openNoteAt };
    const openItem = (name: string, source: Source, onClosed: (changed: boolean) => void) =>
      openItemDialog(itemOpening, this.store, name, () => openNoteAt(source), onClosed, pathYouAreIn(this.app), source, OBSIDIAN_SYNTAX);
    const openLedgerEntry = ledgerEntryOpener(this.showing, this.notes.store, this.store, openItem, openNoteAt, OBSIDIAN_SYNTAX);
    const campaignFolders = () => this.campaignFolders();
    const sessionsOf = (campaignFolder: string) => readSessions(this.notes.store, campaignFolder, OBSIDIAN_SYNTAX);
    const characterParts = { notes: this.notes, campaignFolders, sessionsOf };
    const characterNotes = new HostCharacterNotes(characterParts);
    const editing = { showing: this.showing, notes: this.notes, characters: characterNotes, spelling: OBSIDIAN_SPELLING, syntax: OBSIDIAN_SYNTAX };
    const sheetNotes = new HostSheetNotes(characterParts);
    const beyond = new BeyondOpeners(new PluginBeyondWiring({ showSheet: (path: string) => void openCampaignPage(this.app, "cast", path), showing: this.showing, files: this.notes.store, actions: this.notes.keeping, metadata: this.notes.links, online: this.onlineImport, store: this.store, characterNotes, campaignFolders }), OBSIDIAN_SYNTAX);
    const sheetActions = {
      ...actions,
      editCharacter: (file: NoteRef) => editCharacter(editing, file),
      chooseValue: (file: NoteRef, value: SheetValue, onClosed: () => void) =>
        void chooseSheetValue(this.showing, this.notes, this.store, sheetNotes, file, value, actions.openRow, onClosed, OBSIDIAN_SYNTAX),
      updateFromBeyond: beyond.updateFromBeyond.bind(beyond),
      depart: beyond.depart.bind(beyond),
      tracking: new FundsTracking(itemOpening, this.store, () => this.campaignFolders(), OBSIDIAN_SYNTAX),
    };
    const mentionNotes = new HostMentionNotes({ ...characterParts, syntax: OBSIDIAN_SYNTAX });
    const newCharacter = (returnFocus: () => void) => openNewCharacter(editing, this.store.campaignFolder, (note: NoteRef) => openMadeNote(this.app, gate, note), returnFocus);
    const creators = { newCharacter, importCharacter: beyond.importCharacter.bind(beyond), makeMain: beyond.makeMain.bind(beyond) };
    const shownPath = () => shownCampaignPathOf(this.app.workspace);
    this.plugin.addCommand({ id: "edit-character", name: "Edit character", checkCallback: (checking) => editActiveCharacter(this.app, editing, shownPath, checking) });
    this.plugin.registerEvent(this.app.workspace.on("file-menu", (menu, file) => addEditCharacterItem(editing, menu, file)));
    this.plugin.addRibbonIcon("calendar-plus", "Start a new session", newSession);
    const dashboardActionsFor = (show: ShowPage): DashboardActions => ({
      ...actions,
      openQuestion: openQuestionAt,
      openQuest: openQuestAt,
      openLedgerEntry,
      openItem,
      showQuestions: () => show({ page: "questions", path: null }),
      showQuests: () => show({ page: "quests", path: null }),
      showFunds: () => show({ page: "funds", path: null }),
      showCharacters: () => show({ page: "cast", path: null }),
      openCharacterSheet: (path: string) => show({ page: "cast", path }),
      startSession: newSession,
      writeNotes: (path: string) => show({ page: "notes", path }),
      sessionHeadingOf: (path: string) => sessionHeadingOf(path, this.notes),
    });
    const watchFiles = (changed: (path: string) => void) => this.watchFiles(changed);
    const castNeeds = { store: this.store, characterNotes, sheetNotes, mentionNotes, actions, sheetActions, creators, watchFiles, pauses: OBSIDIAN_PAUSES };
    const openers: LookupOpeners = { question: openQuestionAt, quest: openQuestAt, item: openItem };
    const { drafts, keeping } = this.keepDrafts();
    const wantedLines = new WantedLines();
    const sessionNotes = sessionNotesWiring({
      notes: this.notes,
      store: this.store,
      drafts,
      keeping,
      openers,
      actions,
      lineOpeners: {
        openQuestion: openQuestionAt,
        openQuest: openQuestAt,
        openItem,
        openLedgerEntry,
      },
      wantedLines,
      confirm: (text: ConfirmText, confirmed: () => void, closed: () => void) => this.showing.dialogs.open(new ConfirmDialog(text, confirmed, closed)),
      campaignFolders: () => this.campaignFolders(),
      report: (message: string) => new Notice(message, NOTICE_STAYS_UNTIL_DISMISSED),
      startSession: newSession,
    }, OBSIDIAN_SYNTAX);
    const pages = campaignSections({
      home: homeSection({ store: this.store, characterNotes, news: help.whatsNew, telling: OBSIDIAN_TELLING, actionsFor: dashboardActionsFor }, OBSIDIAN_SYNTAX),
      cast: castSection(castNeeds, OBSIDIAN_SYNTAX),
      notes: notesSection(sessionNotes.notes, OBSIDIAN_SYNTAX),
      questions: (contentEl) => new PageFrame(contentEl, new ListPage(this.store, actions, openQuestionAt, questionsKind, createQuestion), PLAIN_KIT),
      quests: (contentEl) => new PageFrame(contentEl, new ListPage(this.store, actions, openQuestAt, questsKind, createQuest), PLAIN_KIT),
      funds: fundsSection({
        store: this.store,
        texts: sessionNotes.wholeText.texts,
        actions,
        noteExists,
        addCoin,
        openLedgerEntry,
        openItem,
        campaignFolders: () => this.campaignFolders(),
        ownCharacterNotes: characterNotes,
      }, OBSIDIAN_SYNTAX),
      note: noteSection({
        ...sessionNotes.wholeText,
        actions,
        mentionNotes,
        pauses: OBSIDIAN_PAUSES,
        isCampaignNote: this.isCampaignNote.bind(this),
        openInEditor: (path: string) => void openInEditor(this.app, gate, path),
      }),
      welcome,
    });
    const sections = campaignsFolderFirst(pages, welcome, () => this.campaignsFolderSetting.path);
    const backdropFor = (frameEl: HTMLElement) => new TabBackground(frameEl, this.store, gate.metadata, gate.files);
    this.plugin.registerView(CAMPAIGN_VIEW, (leaf) => new CampaignView({ leaf, store: this.store, sections, followCampaign: (path) => void this.followCampaignOf(path), backdropFor, files: gate.files, campaigns: campaignChoice, wantedLines }));
    this.addPageOpeners(newSession);
    this.colourSessionNotes();
    this.app.workspace.onLayoutReady(() => {
      this.startCampaign(help).catch((error: unknown) => new Notice(`Couldn't start the campaign: ${messageOf(error)}`));
    });
    this.app.workspace.onLayoutReady(() => this.watchBackgrounds());
    this.app.workspace.onLayoutReady(() => this.sweepOldCharactersBases());
    this.keepDollarsPlain();
    this.takeOverOpening();
  }

  private sweepOldCharactersBases(): void {
    const bases = new OldCharactersBases({
      mark: { swept: () => this.settingsSaver.settings.charactersBasesSwept, keepSwept: () => this.settingsSaver.save({ charactersBasesSwept: true }) },
      campaignsFolderChosen: () => this.campaignsFolderSetting.path !== null,
      campaignFolders: () => this.campaignFolders(),
      fileAt: (path: string) => this.notes.store.note(path),
      trash: (note: NoteRef) => this.notes.keeping.throwAway(note),
      tell: (words: string) => new Notice(words),
    });
    bases.sweep().catch((error: unknown) => new Notice(`Couldn't remember that the old Characters.base files were dealt with: ${messageOf(error)}`));
  }

  private get settingsSaver(): SettingsSaver {
    return this.saved.saver;
  }

  private get chosen(): ChosenCampaign {
    return this.saved.chosen;
  }

  private get campaignsFolderSetting(): CampaignsFolderSetting {
    return this.saved.campaignsFolder;
  }

  private keepDrafts(): PluginDrafts {
    const drafts = this.started.keepDrafts();
    this.app.workspace.onLayoutReady(() => drafts.setAsideGoneNotes());
    return drafts;
  }

  private addPageOpeners(newSession: () => void): void {
    for (const opener of PAGE_OPENERS) {
      const open = () => void openCampaignPage(this.app, opener.page, null);
      this.plugin.addRibbonIcon(opener.icon, opener.name, open);
      this.plugin.addCommand({ id: opener.id, name: opener.name, callback: open });
    }
    this.plugin.addCommand({ id: "start-session", name: "Start a new session", callback: newSession });
  }

  private colourSessionNotes(): void {
    const inSession = this.isSessionNote.bind(this);
    this.plugin.registerEditorExtension(markerColouring(inSession, OBSIDIAN_SYNTAX));
    this.plugin.registerMarkdownPostProcessor((element, context) => {
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
    this.plugin.register(patchSetViewState(WorkspaceLeaf.prototype, { change, settled }));
    this.app.workspace.onLayoutReady(() => void this.openCampaignFiles(change));
  }

  private async openCampaignFiles(change: ChangeViewState): Promise<void> {
    await takeOpenLeaves(this.app.workspace, change);
    closeRetiredViews(this.app.workspace);
  }

  private closing(): Closing {
    return {
      onUnload: (run) => this.plugin.register(run),
      onQuit: (run) => this.plugin.registerEvent(this.app.workspace.on("quit", run)),
      onVisibilityChange: (run) => this.plugin.registerDomEvent(document, "visibilitychange", run),
      onPageHide: (run) => this.plugin.registerDomEvent(window, "pagehide", run),
      pageHidden: () => document.visibilityState === "hidden",
    };
  }

  private showCampaignTabsAgain(): void {
    for (const leaf of this.app.workspace.getLeavesOfType(CAMPAIGN_VIEW)) {
      if (leaf.view instanceof CampaignView) leaf.view.showAgain();
    }
  }

  private watchBackgrounds(): void {
    const refresh = new BackgroundRefresh(() => this.showBackgrounds(), () => this.campaignsFolderSetting.path);
    const layoutChanged = () => refresh.layoutChanged();
    this.plugin.registerEvent(this.app.workspace.on("layout-change", layoutChanged));
    this.plugin.registerEvent(this.app.workspace.on("file-open", layoutChanged));
    this.plugin.registerEvent(this.gate.metadata.on("changed", (file) => refresh.noteChanged(file.path)));
    this.plugin.registerEvent(this.gate.files.on("create", layoutChanged));
    this.plugin.registerEvent(this.gate.files.on("rename", layoutChanged));
    this.plugin.registerEvent(this.gate.files.on("delete", layoutChanged));
    this.plugin.register(() => refresh.cancel());
    this.plugin.register(() => this.eachNoteView((view) => showBackground(view.contentEl, null)));
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

  private async startCampaign(help: Help): Promise<void> {
    this.watchEditors();
    await this.started.startCampaign();
    await help.start();
  }

  private watchEditors(): void {
    const editorChanged = debounce((info: MarkdownFileInfo, file: TFile) => this.readEditor(info, file), TYPING_PAUSE_MS, true);
    this.plugin.register(() => editorChanged.cancel());
    this.plugin.registerEvent(this.app.workspace.on("editor-change", (_editor, info) => {
      if (info.file !== null) editorChanged(info, info.file);
    }));
    this.plugin.registerEvent(this.app.workspace.on("file-open", (file) => {
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
    return this.following.campaignFolders();
  }

  private keepDollarsPlain(): void {
    const inCampaign = this.isCampaignNote.bind(this);
    this.plugin.registerMarkdownPostProcessor(plainDollarsProcessor(inCampaign), BEFORE_OBSIDIANS_MATHS);
  }

  private isSessionNote(path: string): boolean {
    return isSessionNote(path, this.campaignsFolderSetting.path, this.noteExists.bind(this));
  }

  private isCampaignNote(path: string): boolean {
    return isCampaignNote(path, this.campaignsFolderSetting.path, this.noteExists.bind(this));
  }

  private noteExists(path: string): boolean {
    return this.gate.files.getFileByPath(path) !== null;
  }

  private followCampaignOf(path: string): Promise<void> {
    return this.following.followCampaignOf(path);
  }
}

interface BeyondWiringParts {
  readonly showSheet: (path: string) => void;
  readonly showing: BeyondWiring["showing"];
  readonly files: BeyondWiring["files"];
  readonly actions: BeyondWiring["actions"];
  readonly metadata: BeyondWiring["metadata"];
  readonly online: BeyondWiring["online"];
  readonly store: CampaignStore;
  readonly characterNotes: CharacterNotes;
  readonly campaignFolders: () => string[];
}

class PluginBeyondWiring implements BeyondWiring {
  readonly showing: BeyondWiring["showing"];
  readonly files: BeyondWiring["files"];
  readonly actions: BeyondWiring["actions"];
  readonly metadata: BeyondWiring["metadata"];
  readonly online: BeyondWiring["online"];

  constructor(private readonly parts: BeyondWiringParts) {
    this.showing = parts.showing;
    this.files = parts.files;
    this.actions = parts.actions;
    this.metadata = parts.metadata;
    this.online = parts.online;
  }

  shownCampaignFolder(): string | null {
    return this.parts.store.campaignFolder;
  }

  campaignFolderOf(path: string): string | null {
    return campaignFolderOf(path, this.parts.campaignFolders());
  }

  charactersFolderOf(campaignFolder: string): string {
    return charactersFolderOf(campaignFolder);
  }

  notesIn(campaignFolder: string): readonly NoteRef[] {
    return this.parts.characterNotes.filesIn(campaignFolder);
  }

  showSheet(path: string): void {
    this.parts.showSheet(path);
  }

  tell(words: string): void {
    new Notice(words);
  }
}
