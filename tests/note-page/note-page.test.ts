import { describe, expect, it, vi } from "vitest";
import type { App, TAbstractFile, TFile } from "obsidian";
import { noteTextsOf, type NoteTexts } from "../../src/campaign/note-texts";
import { NoteDrafts } from "../../src/note-page/note-drafts";
import { LEFT_CAMPAIGN } from "../../src/note-page/left-campaign";
import { CHANGED_ELSEWHERE, NOTE_GONE_HERE, NotePage } from "../../src/note-page/note-page";
import { NoteSaver, type SaverVault } from "../../src/note-page/note-saver";
import { Drafts } from "../../src/session-notes/drafts";
import { isShown, obsidianDocument } from "../views/obsidian-dom";

const OLD_MILL = "Pale Moon/Places/Old Mill.md";
const LOADED = "The wheel turns at night.";
const TYPED = "The wheel turns at night. [[Lady Vess]] owns it.";
const WINDOWS_NOTE = "The wheel turns.\r\nRain.\r\n";
const WINDOWS_NOTE_IN_BOX = "The wheel turns.\nRain.\n";

type ChangedListener = (file: TFile, text: string) => void;

type GoneListener = (file: TAbstractFile) => void;

const BOM = "\uFEFF";

function readByObsidian(disk: string): string {
  if (!disk.startsWith(BOM)) return disk;
  return disk.substring(BOM.length);
}

class FakeNotes {
  text: string | null;
  readonly changedListeners = new Set<ChangedListener>();
  readonly goneListeners = new Set<GoneListener>();
  readonly writes: string[] = [];
  private readGate: Promise<void> = Promise.resolve();
  readonly process = vi.fn(async (_file: TFile, change: (now: string) => string) => {
    const now = String(this.text);
    const changed = change(now);
    if (changed !== now) this.writes.push(changed);
    this.text = changed;
    return changed;
  });
  readonly read = vi.fn(async () => {
    await this.readGate;
    return readByObsidian(String(this.text));
  });

  constructor(text: string | null) {
    this.text = text;
  }

  get texts(): NoteTexts {
    return noteTextsOf(this.app);
  }

  get vault(): SaverVault {
    return { getFileByPath: (path: string) => this.fileAt(path), process: this.process } as unknown as SaverVault;
  }

  holdRead(): () => void {
    let release = () => {};
    this.readGate = new Promise<void>((resolve) => {
      release = resolve;
    });
    return () => release();
  }

  changeElsewhere(text: string, path = OLD_MILL): void {
    this.text = text;
    for (const listener of this.changedListeners) listener({ path } as TFile, text);
  }

  deleteNote(path = OLD_MILL): void {
    this.text = null;
    for (const listener of this.goneListeners) listener({ path } as TAbstractFile);
  }

  private fileAt(path: string): TFile | null {
    if (this.text === null || path !== OLD_MILL) return null;
    return { path } as TFile;
  }

  private get app(): App {
    const metadataCache = {
      on: (_name: string, listener: ChangedListener) => this.listen(this.changedListeners, listener),
      offref: (listener: ChangedListener) => this.changedListeners.delete(listener),
    };
    const vault = {
      getFileByPath: (path: string) => this.fileAt(path),
      read: this.read,
      on: (_name: string, listener: GoneListener) => this.listen(this.goneListeners, listener),
      offref: (listener: GoneListener) => this.goneListeners.delete(listener),
    };
    return { metadataCache, vault } as unknown as App;
  }

  private listen<T>(listeners: Set<T>, listener: T): T {
    listeners.add(listener);
    return listener;
  }
}

function flushed(): Promise<void> {
  return new Promise((done) => setTimeout(done, 0));
}

interface Setup {
  text?: string | null;
  drafts?: Drafts;
  notes?: FakeNotes;
  inCampaign?: boolean;
}

async function openNote({ text = LOADED, drafts = new Drafts({}, () => {}), notes = new FakeNotes(text), inCampaign = true }: Setup = {}) {
  const document = obsidianDocument();
  const root = document.createElement("div");
  document.body.append(root);
  const actions = { openRow: vi.fn(), openLink: vi.fn() };
  const noteDrafts = new NoteDrafts(drafts);
  const isCampaignNote = vi.fn(() => inCampaign);
  const openInEditor = vi.fn();
  const needs = { texts: notes.texts, drafts: noteDrafts, saver: new NoteSaver(notes.vault), actions, isCampaignNote, openInEditor };
  const page = new NotePage(root, OLD_MILL, needs);
  page.load();
  await flushed();
  const box = root.querySelector("textarea")!;
  const window = document.defaultView!;
  const type = (typed: string) => {
    box.value = typed;
    box.dispatchEvent(new window.Event("input"));
  };
  const press = (key: string, modifiers: KeyboardEventInit = {}) => {
    const event = new window.KeyboardEvent("keydown", { key, cancelable: true, bubbles: true, ...modifiers });
    box.dispatchEvent(event);
    return event;
  };
  const saveButton = root.querySelector<HTMLButtonElement>(".dd-save")!;
  const reloadButton = root.querySelector<HTMLButtonElement>(".dd-reload")!;
  const message = () => root.querySelector(".dd-save-message")!.textContent;
  const settle = () => vi.waitFor(() => expect(noteDrafts.isSaving(OLD_MILL)).toBe(false));
  return { root, page, box, notes, noteDrafts, drafts, actions, type, press, saveButton, reloadButton, message, settle, isCampaignNote, openInEditor };
}

describe("NotePage", () => {
  it("shows the note's name as its heading and the note's whole text in the box, with nothing to save yet", async () => {
    const { root, box, saveButton } = await openNote({ text: `---\nplace: mill\n---\n${LOADED}` });
    expect(root.querySelector("h2")!.textContent).toBe("Old Mill");
    expect(box.value).toBe(`---\nplace: mill\n---\n${LOADED}`);
    expect(box.readOnly).toBe(false);
    expect(saveButton.disabled).toBe(true);
  });

  it("can be saved once the text is changed, and not when it is typed back as it was", async () => {
    const { type, saveButton } = await openNote();
    type(TYPED);
    expect(saveButton.disabled).toBe(false);
    type(LOADED);
    expect(saveButton.disabled).toBe(true);
  });

  it("writes the box's text over the note in one change when Save is pressed, then has nothing left to save", async () => {
    const { type, saveButton, notes, noteDrafts, settle, box } = await openNote();
    type(TYPED);
    saveButton.click();
    await settle();
    expect(notes.process).toHaveBeenCalledOnce();
    expect(notes.writes).toEqual([TYPED]);
    expect(box.value).toBe(TYPED);
    expect(saveButton.disabled).toBe(true);
    expect(noteDrafts.draftOf(OLD_MILL)).toBeNull();
  });

  it("saves with Ctrl + Enter and Cmd + Enter, and not with Enter alone", async () => {
    const { type, press, notes, settle } = await openNote();
    type(TYPED);
    const plain = press("Enter");
    expect(plain.defaultPrevented).toBe(false);
    expect(notes.process).not.toHaveBeenCalled();
    expect(press("Enter", { ctrlKey: true }).defaultPrevented).toBe(true);
    await settle();
    type(LOADED);
    press("Enter", { metaKey: true });
    await settle();
    expect(notes.writes).toEqual([TYPED, LOADED]);
  });

  it("makes the box read-only while it saves", async () => {
    const { type, saveButton, box, settle } = await openNote();
    type(TYPED);
    saveButton.click();
    expect(box.readOnly).toBe(true);
    expect(saveButton.disabled).toBe(true);
    await settle();
    expect(box.readOnly).toBe(false);
  });

  it("writes nothing over a change made to the note since it was loaded, keeps what was typed, and offers to load the note again", async () => {
    const { type, saveButton, notes, noteDrafts, settle, box, message, reloadButton } = await openNote();
    type(TYPED);
    notes.text = "The wheel is still.";
    saveButton.click();
    await settle();
    expect(notes.process).toHaveBeenCalledOnce();
    expect(notes.writes).toEqual([]);
    expect(notes.text).toBe("The wheel is still.");
    expect(box.value).toBe(TYPED);
    expect(noteDrafts.draftOf(OLD_MILL)).toEqual({ base: LOADED, text: TYPED });
    expect(message()).toBe(CHANGED_ELSEWHERE);
    expect(isShown(reloadButton)).toBe(true);
  });

  it("follows a change made elsewhere when nothing is typed", async () => {
    const { notes, box, message, reloadButton, type, saveButton, settle } = await openNote();
    notes.changeElsewhere("The wheel is still.");
    expect(box.value).toBe("The wheel is still.");
    expect(message()).toBe("");
    expect(isShown(reloadButton)).toBe(false);
    type("The wheel is still. Mira saw it.");
    saveButton.click();
    await settle();
    expect(notes.writes).toEqual(["The wheel is still. Mira saw it."]);
  });

  it("keeps what is typed when the note is changed elsewhere meanwhile, and says so", async () => {
    const { notes, box, message, reloadButton, type } = await openNote();
    type(TYPED);
    notes.changeElsewhere("The wheel is still.");
    expect(box.value).toBe(TYPED);
    expect(message()).toBe(CHANGED_ELSEWHERE);
    expect(isShown(reloadButton)).toBe(true);
  });

  it("ignores changes to other notes", async () => {
    const { notes, box, message, type } = await openNote();
    type(TYPED);
    notes.changeElsewhere("Elsewhere.", "Pale Moon/Places/Gilded Stag.md");
    expect(box.value).toBe(TYPED);
    expect(message()).toBe("");
  });

  it("takes the note coming to read as the box does, such as from its own save or another box, as saved", async () => {
    const { notes, box, message, type, saveButton, noteDrafts, reloadButton } = await openNote();
    type(TYPED);
    notes.changeElsewhere(TYPED);
    expect(box.value).toBe(TYPED);
    expect(message()).toBe("");
    expect(isShown(reloadButton)).toBe(false);
    expect(saveButton.disabled).toBe(true);
    expect(noteDrafts.draftOf(OLD_MILL)).toBeNull();
  });

  it("loads the note again, dropping what was typed, only on a second press", async () => {
    const { notes, box, reloadButton, type, noteDrafts, message } = await openNote();
    type(TYPED);
    notes.changeElsewhere("The wheel is still.");
    reloadButton.click();
    expect(reloadButton.textContent).toBe("Press again to drop what you typed");
    expect(box.value).toBe(TYPED);
    reloadButton.click();
    await vi.waitFor(() => expect(box.value).toBe("The wheel is still."));
    expect(noteDrafts.draftOf(OLD_MILL)).toBeNull();
    expect(message()).toBe("");
    expect(isShown(reloadButton)).toBe(false);
  });

  it("keeps what was typed for the next time the note is shown", async () => {
    const drafts = new Drafts({}, () => {});
    const first = await openNote({ drafts });
    first.type(TYPED);
    first.page.unload();
    const again = await openNote({ drafts });
    expect(again.box.value).toBe(TYPED);
    expect(again.saveButton.disabled).toBe(false);
    expect(again.message()).toBe("");
  });

  it("says when the note changed since the kept text was typed, and won't write over it", async () => {
    const drafts = new Drafts({}, () => {});
    new NoteDrafts(drafts).keep(OLD_MILL, { base: LOADED, text: TYPED });
    const { box, message, saveButton, notes, settle } = await openNote({ drafts, text: "The wheel is still." });
    expect(box.value).toBe(TYPED);
    expect(message()).toBe(CHANGED_ELSEWHERE);
    saveButton.click();
    await settle();
    expect(notes.writes).toEqual([]);
  });

  it("keeps the box and what was typed when the note is deleted, and saves nothing", async () => {
    const { notes, box, message, type, saveButton, settle, noteDrafts } = await openNote();
    type(TYPED);
    notes.deleteNote();
    expect(message()).toBe(NOTE_GONE_HERE);
    expect(box.value).toBe(TYPED);
    saveButton.click();
    await settle();
    expect(notes.process).not.toHaveBeenCalled();
    expect(message()).toBe("Couldn't save: The note is gone. What you typed is still in the box.");
    expect(noteDrafts.draftOf(OLD_MILL)).toEqual({ base: LOADED, text: TYPED });
  });

  it("says a note that isn't there is gone, and gives no box to type in", async () => {
    const { box, message, saveButton } = await openNote({ text: null });
    expect(message()).toBe(NOTE_GONE_HERE);
    expect(box.readOnly).toBe(true);
    expect(saveButton.disabled).toBe(true);
  });

  it("lists the links in the box below it, each once, and opens one when it is pressed", async () => {
    const { root, type, actions } = await openNote();
    const section = root.querySelector<HTMLElement>(".dd-note-links")!;
    expect(isShown(section)).toBe(false);
    type("[[Lady Vess]] owns the [[Old Mill#Wheel|wheel]]. [[Lady Vess]] again.");
    const links = Array.from(section.querySelectorAll<HTMLElement>("a"));
    expect(isShown(section)).toBe(true);
    expect(links.map((link) => link.textContent)).toEqual(["Lady Vess", "wheel"]);
    links[1]!.click();
    expect(actions.openLink).toHaveBeenCalledExactlyOnceWith("Old Mill#Wheel", OLD_MILL);
  });

  it("shows what is typed in another box for the same note, so typing in either keeps the other's text", async () => {
    const drafts = new Drafts({}, () => {});
    const notes = new FakeNotes(LOADED);
    const first = await openNote({ drafts, notes });
    const second = await openNote({ drafts, notes });
    first.type(TYPED);
    expect(second.box.value).toBe(TYPED);
    expect(second.saveButton.disabled).toBe(false);
    second.type(`${TYPED} Rain.`);
    expect(first.box.value).toBe(`${TYPED} Rain.`);
    expect(first.noteDrafts.draftOf(OLD_MILL)).toEqual({ base: LOADED, text: `${TYPED} Rain.` });
  });

  it("doesn't set the text of a box that already shows the draft, so the caret stays put", async () => {
    const drafts = new Drafts({}, () => {});
    const notes = new FakeNotes(LOADED);
    const first = await openNote({ drafts, notes });
    const second = await openNote({ drafts, notes });
    const setFirst = vi.spyOn(first.box, "value", "set");
    const setSecond = vi.spyOn(second.box, "value", "set");
    first.type(TYPED);
    expect(setFirst).toHaveBeenCalledOnce();
    expect(setSecond).toHaveBeenCalledExactlyOnceWith(TYPED);
  });

  it("stops listening to the note and the drafts when it is closed", async () => {
    const drafts = new Drafts({}, () => {});
    const stopHearingSaves = vi.fn();
    vi.spyOn(drafts, "subscribe").mockReturnValue(stopHearingSaves);
    const { page, notes } = await openNote({ drafts });
    expect(notes.changedListeners.size).toBe(1);
    expect(notes.goneListeners.size).toBe(1);
    page.unload();
    expect(notes.changedListeners.size).toBe(0);
    expect(notes.goneListeners.size).toBe(0);
    expect(stopHearingSaves).toHaveBeenCalledOnce();
  });

  it("opens a note with Windows line endings with its lines in the box and nothing to save", async () => {
    const { box, saveButton, message } = await openNote({ text: WINDOWS_NOTE });
    expect(box.value).toBe(WINDOWS_NOTE_IN_BOX);
    expect(saveButton.disabled).toBe(true);
    expect(message()).toBe("");
  });

  it("saves a note with Windows line endings with them kept", async () => {
    const { type, saveButton, notes, settle } = await openNote({ text: WINDOWS_NOTE });
    type("The wheel turns.\nRain at night.\n");
    saveButton.click();
    await settle();
    expect(notes.writes).toEqual(["The wheel turns.\r\nRain at night.\r\n"]);
  });

  it("follows a change made on another device to a note with Windows line endings when nothing is typed", async () => {
    const { notes, box, message, reloadButton, saveButton } = await openNote({ text: WINDOWS_NOTE });
    notes.changeElsewhere("The wheel is still.\r\nRain.\r\n");
    expect(box.value).toBe("The wheel is still.\nRain.\n");
    expect(saveButton.disabled).toBe(true);
    expect(message()).toBe("");
    expect(isShown(reloadButton)).toBe(false);
  });

  it("saves a note that starts with a byte order mark, and keeps the mark", async () => {
    const { type, saveButton, notes, settle, message } = await openNote({ text: `${BOM}${LOADED}` });
    type(TYPED);
    saveButton.click();
    await settle();
    expect(notes.writes).toEqual([`${BOM}${TYPED}`]);
    expect(message()).toBe("");
  });

  it("leaves the box empty and read-only when the note is read only after the page was closed", async () => {
    const notes = new FakeNotes(LOADED);
    const release = notes.holdRead();
    const { page, box, saveButton } = await openNote({ notes });
    page.unload();
    release();
    await flushed();
    expect(notes.read).toHaveBeenCalledOnce();
    expect(box.value).toBe("");
    expect(box.readOnly).toBe(true);
    expect(saveButton.disabled).toBe(true);
  });

  it("says when the note was moved out of the campaign, and opens it in Obsidian's editor once nothing typed is unsaved", async () => {
    const { root, type, saveButton, settle, isCampaignNote, openInEditor } = await openNote({ inCampaign: false });
    const notice = root.querySelector(".dd-left-campaign")!;
    const open = root.querySelector<HTMLButtonElement>(".dd-open-in-editor")!;
    expect(isCampaignNote).toHaveBeenCalledExactlyOnceWith(OLD_MILL);
    expect(notice.querySelector("p")!.textContent).toBe(LEFT_CAMPAIGN);
    expect(open.disabled).toBe(false);
    type(TYPED);
    expect(open.disabled).toBe(true);
    saveButton.click();
    await settle();
    expect(open.disabled).toBe(false);
    open.click();
    expect(openInEditor).toHaveBeenCalledExactlyOnceWith(OLD_MILL);
  });

  it("can't be left for the editor before the note is loaded", async () => {
    const notes = new FakeNotes(LOADED);
    notes.holdRead();
    const { root } = await openNote({ notes, inCampaign: false });
    expect(root.querySelector<HTMLButtonElement>(".dd-open-in-editor")!.disabled).toBe(true);
  });

  it("says nothing about leaving for a note of the campaign", async () => {
    const { root } = await openNote();
    expect(root.querySelector(".dd-left-campaign")).toBeNull();
  });
});
