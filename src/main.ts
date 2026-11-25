import { debounce, MarkdownView, Notice, Plugin, WorkspaceLeaf, type MarkdownFileInfo, type PaneType, type TFile, type ViewState } from "obsidian";
import type { Source } from "./campaign/record/campaign";
import type { SheetValue } from "./characters/reading/character-sheet";
import { messageOf } from "./views/dialogs/message-of";
import {
  campaignFolderOf,
  charactersFolderOf,
  chosenCampaignFolder,
  findCampaignFolders,
  isCampaignNote,
  isSessionNote,
  startingCampaignFolder,
} from "./campaign/paths/campaign-folders";
import { NewCampaignDialog } from "./campaign/writing/new-campaign-dialog";
import { CampaignStore } from "./campaign/reading/campaign-store";
import { HostCharacterNotes } from "./characters/reading/character-notes";
import { editCharacter, openNewCharacter } from "./characters/editing/open-character";
import { addEditCharacterItem, editActiveCharacter, openMadeNote } from "./obsidian/characters/character-editing-hooks";
import { chooseSheetValue } from "./characters/editing/open-character-sheet";
import { OldCharactersBases } from "./characters/retiring/old-characters-bases";
import { OBSIDIAN_SPELLING } from "./obsidian/notes/obsidian-spelling";
import { FencedNotes } from "./fence/notes/fenced-notes";
import type { NoteRef } from "./host/notes/note-ref";
import { readSessions } from "./campaign/reading/read-campaign";
import { ObsidianNotes } from "./obsidian/notes/obsidian-notes";
import { OBSIDIAN_SYNTAX } from "./obsidian/notes/obsidian-syntax";
import { GATE_REPORTS_WRITES } from "./obsidian/notes/quiet-report";
import { HostSheetNotes } from "./characters/reading/sheet-notes";
import { HostMentionNotes } from "./characters/reading/mention-notes";
import { editorTextOf } from "./obsidian/campaign/editor-text";
import { markerColouring } from "./obsidian/editor/marker-decorations";
import type { LookupOpeners } from "./kinds/lookup-openers";
import { openNewQuestion } from "./questions/dialogs/open-new-question";
import { openQuestion } from "./questions/dialogs/open-question";
import { questionsKind } from "./questions/list/questions-kind";
import { openNewQuest } from "./quests/dialogs/open-new-quest";
import { openQuest } from "./quests/dialogs/open-quest";
import { questsKind } from "./quests/list/quests-kind";
import { openAddCoin } from "./funds/coins/open-add-coin";
import type { CoinSide } from "./funds/coins/coin-sides";
import { openItemDialog } from "./funds/items/open-item";
import { FundsTracking } from "./funds/tracking/funds-tracking";
import { ledgerEntryOpener } from "./funds/coins/open-ledger-entry";
import { ListPage } from "./views/lists/list-page";
import { PageFrame } from "./obsidian/views/frames/page-frame";
import { PLAIN_KIT } from "./obsidian/views/mount/mount-kit";
import { OBSIDIAN_PAUSES } from "./obsidian/host/obsidian-pauses";
import { activePathOf, openSource } from "./obsidian/views/opening/open-view";
import { WantedLines } from "./views/opening/wanted-lines";
import { openLink } from "./obsidian/views/opening/open-link";
import type { DashboardActions } from "./dashboard/dashboard-page";
import { campaignSections, type PageId, type ShowPage } from "./obsidian/interface/view/campaign-pages";
import { campaignStateFor, type Takeover } from "./obsidian/interface/takeover/campaign-takeover";
import { isCampaignViewRegistered } from "./obsidian/interface/view/campaign-view-registered";
import { castSection } from "./obsidian/interface/sections/cast-section";
import { fundsSection } from "./obsidian/interface/sections/funds-section";
import { noteSection } from "./obsidian/interface/sections/note-section";
import { openInEditor } from "./obsidian/interface/view/open-in-editor";
import { notesSection } from "./obsidian/interface/sections/notes-section";
import { keepOneCampaignTab } from "./obsidian/interface/tabs/one-campaign-tab";
import { pathYouAreIn, shownCampaignPathOf } from "./obsidian/interface/view/shown-campaign-path";
import { takeOpenLeaves } from "./obsidian/interface/takeover/take-open-leaves";
import { patchSetViewState, type ChangeViewState } from "./obsidian/interface/takeover/view-state-patch";
import { CAMPAIGN_VIEW, CampaignView } from "./obsidian/interface/view/campaign-view";
import { lookAgain } from "./interface/view/look-again";
import { openCampaignPage } from "./obsidian/interface/tabs/open-campaign";
import { TabBackground } from "./obsidian/interface/view/tab-background";
import { closeRetiredViews } from "./obsidian/interface/takeover/retired-views";
import { colourMarkers } from "./reading/colour-markers";
import { BEFORE_OBSIDIANS_MATHS, plainDollarsProcessor } from "./obsidian/reading/plain-dollars-processor";
import { BackgroundRefresh, showBackground, shownBackgroundOf } from "./obsidian/reading/note-background";
import { SettingsPage } from "./settings/page/settings-page";
import { SettingsFrame } from "./obsidian/settings/settings-frame";
import { ObsidianCampaignLooks } from "./obsidian/settings/obsidian-campaign-looks";
import { PictureSuggestModal } from "./obsidian/settings/picture-suggest-modal";
import { FolderSuggestModal } from "./obsidian/settings/folder-suggest-modal";
import type { Closing } from "./settings/drafts/flush-when-closing";
import type { CampaignsFolderSetting } from "./settings/saved/campaigns-folder-setting";
import type { ChosenCampaign } from "./settings/saved/chosen-campaign";
import type { SettingsSaver } from "./settings/saved/settings-saver";
import { SavedSettings } from "./plugin/saved-settings";
import { ObsidianPluginData } from "./obsidian/host/obsidian-plugin-data";
import { ObsidianDeviceStorage } from "./obsidian/host/obsidian-device-storage";
import type { Help } from "./welcome/opening/help";
import { welcomeOpenerOf } from "./obsidian/welcome/welcome-opener";
import { Gatekeeper } from "./fence/gate/gatekeeper";
import { homeSection } from "./obsidian/interface/sections/home-section";
import { welcomeWiring } from "./obsidian/interface/sections/welcome-wiring";
import { sessionNotesWiring } from "./obsidian/interface/sections/session-notes-wiring";
import { campaignsFolderFirst } from "./obsidian/interface/view/campaigns-folder-first";
import { sessionHeadingOf } from "./sessions/session-heading";
import { startSession } from "./sessions/start-session";
import { PluginDrafts } from "./plugin/plugin-drafts";
import { NoteKeeping } from "./plugin/note-keeping";
import { NOTICE_STAYS_UNTIL_DISMISSED } from "./views/dialogs/notice-stays";
import { ConfirmDialog, type ConfirmText } from "./views/dialogs/confirm-dialog";
import { BeyondOpeners, type BeyondWiring } from "./imports/dialog/opening/beyond-openers";
import { CampaignAgreement } from "./imports/agreement/campaign-agreement";
import { KeptAgreement } from "./imports/agreement/kept-agreement";
import { onlineImportFor } from "./imports/dialog/online/online-wiring";
import { OBSIDIAN_BEYOND_CALL } from "./obsidian/online/obsidian-beyond-call";
import { OBSIDIAN_TELLING } from "./obsidian/views/frames/obsidian-telling";
import { obsidianDialogsOf } from "./obsidian/views/frames/modal-frame";
import type { CharacterNotes } from "./characters/reading/character-notes";

const TYPING_PAUSE_MS = 250;

const PAGE_OPENERS: { page: PageId; id: string; name: string; icon: string }[] = [
  { page: "home", id: "open-dashboard", name: "Open dashboard", icon: "layout-dashboard" },
  { page: "cast", id: "open-characters", name: "Open characters", icon: "users" },
  { page: "questions", id: "open-questions", name: "Open questions", icon: "circle-help" },
  { page: "quests", id: "open-quests", name: "Open quests", icon: "scroll-text" },
  { page: "funds", id: "open-funds", name: "Open party funds", icon: "coins" },
];

export default class DungeonsAndDinthla extends Plugin {
  private readonly gate = new Gatekeeper(this.app, () => this.campaignsFolderSetting.path);
  private readonly notes = this.gate.notes;
  private readonly store = new CampaignStore(this.gate.notes.store, OBSIDIAN_SYNTAX);
  private readonly localStorage = new ObsidianDeviceStorage((key: string) => this.app.loadLocalStorage(key), (key: string, value: unknown) => this.app.saveLocalStorage(key, value));
  private readonly saved = new SavedSettings(
    { data: new ObsidianPluginData(() => this.loadData(), (data: unknown) => this.saveData(data)), device: this.localStorage, settingsFolder: this.gate.configDir, telling: OBSIDIAN_TELLING },
    this.store,
    () => this.lookAgain(),
  );
  private readonly keptAgreement = new KeptAgreement({
    settings: {
      agreed: () => this.settingsSaver.settings.beyondAgreed,
      keepAgreed: () => this.settingsSaver.save({ beyondAgreed: true }),
    },
    device: this.localStorage,
    notKept: (error: unknown) => new Notice(`Couldn't remember your answer about D&D Beyond: ${messageOf(error)}`),
  });
  private readonly showing = { dialogs: obsidianDialogsOf(this.app), telling: OBSIDIAN_TELLING };
  private readonly onlineImport = onlineImportFor(this.showing.dialogs, this.keptAgreement, OBSIDIAN_BEYOND_CALL);

  override async onload(): Promise<void> {
    await this.saved.load();
    const gate = this.gate;
    this.addChild(gate.files);
    const openNotes = (path: string) => openCampaignPage(this.app, "notes", path);
    const newSession = () => startSession(this.showing, this.notes, this.store.campaignFolder, openNotes);
    const { maker, help, campaignsFolderSetup, welcome } = welcomeWiring({
      gate,
      store: this.store,
      saver: this.settingsSaver,
      manifest: this.manifest,
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
    this.addSettingTab(new SettingsFrame(this.app, this, settings));
    const linkPlace = { gate, campaignFolders: () => this.campaignFolders() };
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
    const sessionsOf = (campaignFolder: string) => readSessions(gate.notes.store, campaignFolder, OBSIDIAN_SYNTAX);
    const characterParts = { notes: this.notes, campaignFolders, sessionsOf };
    const characterNotes = new HostCharacterNotes(characterParts);
    const editing = { showing: this.showing, notes: this.notes, characters: characterNotes, spelling: OBSIDIAN_SPELLING, syntax: OBSIDIAN_SYNTAX };
    const sheetNotes = new HostSheetNotes(characterParts);
    const beyond = new BeyondOpeners(new PluginBeyondWiring({ showSheet: (path: string) => void openCampaignPage(this.app, "cast", path), showing: this.showing, files: gate.notes.store, actions: gate.notes.keeping, metadata: gate.notes.links, online: this.onlineImport, store: this.store, characterNotes, campaignFolders }), OBSIDIAN_SYNTAX);
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
    this.addCommand({ id: "edit-character", name: "Edit character", checkCallback: (checking) => editActiveCharacter(this.app, editing, shownPath, checking) });
    this.registerEvent(this.app.workspace.on("file-menu", (menu, file) => addEditCharacterItem(editing, menu, file)));
    this.addRibbonIcon("calendar-plus", "Start a new session", newSession);
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
      sessionHeadingOf: (path: string) => sessionHeadingOf(path, gate.notes),
    });
    const watchFiles = (changed: (path: string) => void) => this.watchFiles(changed);
    const castNeeds = { store: this.store, characterNotes, sheetNotes, mentionNotes, actions, sheetActions, creators, watchFiles, pauses: OBSIDIAN_PAUSES };
    const openers: LookupOpeners = { question: openQuestionAt, quest: openQuestAt, item: openItem };
    const { drafts, keeping } = this.keepDrafts();
    const wantedLines = new WantedLines();
    const sessionNotes = sessionNotesWiring({
      gate,
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
    this.registerView(CAMPAIGN_VIEW, (leaf) => new CampaignView({ leaf, store: this.store, sections, followCampaign: (path) => void this.followCampaignOf(path), backdropFor, files: gate.files, campaigns: campaignChoice, wantedLines }));
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
    const plugin = new PluginDrafts({
      device: this.localStorage,
      timer: { start: (run: () => void, ms: number) => window.setTimeout(run, ms), stop: (id: number) => window.clearTimeout(id) },
      closing: this.closing(),
      clock: { now: () => Date.now() },
      telling: OBSIDIAN_TELLING,
      changes: this.notes.changes,
      store: this.notes.store,
      fence: this.gate.fence,
    }, this.saved);
    plugin.start();
    this.register(plugin.stop.bind(plugin));
    this.app.workspace.onLayoutReady(() => plugin.setAsideGoneNotes());
    return plugin;
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
    const inSession = this.isSessionNote.bind(this);
    this.registerEditorExtension(markerColouring(inSession, OBSIDIAN_SYNTAX));
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

  private closing(): Closing {
    return {
      onUnload: (run) => this.register(run),
      onQuit: (run) => this.registerEvent(this.app.workspace.on("quit", run)),
      onVisibilityChange: (run) => this.registerDomEvent(document, "visibilitychange", run),
      onPageHide: (run) => this.registerDomEvent(window, "pagehide", run),
      pageHidden: () => document.visibilityState === "hidden",
    };
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

  private async startCampaign(help: Help): Promise<void> {
    await this.watchCampaign();
    await help.start();
  }

  private async watchCampaign(): Promise<void> {
    this.watchNotes();
    this.keepNotes();
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

  private keepNotes(): void {
    const keeping = new NoteKeeping({
      notes: this.notes,
      syntax: OBSIDIAN_SYNTAX,
      written: this.gate.written,
      shown: this.store,
      saver: this.settingsSaver,
      telling: OBSIDIAN_TELLING,
      dialogs: this.showing.dialogs,
      campaignFolders: () => this.campaignFolders(),
    });
    keeping.start();
    this.register(keeping.stop.bind(keeping));
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

  private keepDollarsPlain(): void {
    const inCampaign = this.isCampaignNote.bind(this);
    this.registerMarkdownPostProcessor(plainDollarsProcessor(inCampaign), BEFORE_OBSIDIANS_MATHS);
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

  private async followCampaignOf(path: string): Promise<void> {
    const folder = campaignFolderOf(path, this.campaignFolders());
    if (folder === null || folder === this.store.campaignFolder) return;
    await this.chosen.choose(folder);
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
