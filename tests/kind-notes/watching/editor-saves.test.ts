import { describe, expect, it, vi } from "vitest";
import { EditorSaves } from "../../../src/kind-notes/watching/editor-saves";
import { SavesHere } from "../../../src/kind-notes/watching/saves-here";
import { TypingPauses } from "../../../src/kind-notes/watching/typing-pauses";
import { SessionWants } from "../../../src/kind-notes/wanting/session-wants";
import { FakeCampaign } from "../fake-campaign";
import { FileEvents } from "../file-events";
import { fileAt } from "../fake-notes";
import { QUESTIONS, SESSION } from "../keeper-setup";

const READ = "? Who sent Mira\n";
const HALF_TYPED = "? Who sent Mira\n? Why is the fe\n";
const TYPED = "? Who sent Mira\n? Why is the ferry gone\n";
const TYPED_ON = "? Who sent Mira\n? Why is the ferry gone\n! Find the ferryman\n";
const RENAMED = SESSION.replace("Session 2", "Session 5");

const FILES = { getFileByPath: fileAt };

function editorSavesWith(campaign: FakeCampaign) {
  const events = new FileEvents();
  const pauses = new TypingPauses();
  const saves = new SavesHere();
  const shown: string[] = [];
  const editorTexts = vi.fn();
  editorTexts.mockReturnValue(shown);
  const savedInEditor = { sessionSavedInEditor: vi.fn() };
  const editorSaves = new EditorSaves({ files: events, store: campaign, wants: new SessionWants(campaign, FILES), saves, editorTexts, pauses });
  const stop = editorSaves.start(savedInEditor);
  return { events, pauses, saves, shown, editorTexts, savedInEditor, editorSaves, stop };
}

function campaignHolding(text: string): FakeCampaign {
  const campaign = new FakeCampaign();
  campaign.hold(SESSION, text);
  return campaign;
}

function show(shown: string[], text: string): void {
  shown.length = 0;
  shown.push(text);
}

describe("EditorSaves, a save that follows a typing pause", () => {
  it("holds what the editor shows as a save made here when Obsidian saves the text shown at the pause", () => {
    const { events, pauses, saves, shown, editorTexts } = editorSavesWith(campaignHolding(READ));
    show(shown, TYPED);
    pauses.paused(SESSION, TYPED);
    events.trigger("modify", fileAt(SESSION));
    expect(editorTexts).toHaveBeenCalledExactlyOnceWith(SESSION);
    expect(saves.takeIfSavedHere(SESSION, TYPED)).toBe(true);
  });

  it("doesn't take a save after a pause for one made while typing", () => {
    const { events, pauses, shown, editorSaves } = editorSavesWith(campaignHolding(READ));
    show(shown, TYPED);
    pauses.paused(SESSION, TYPED);
    events.trigger("modify", fileAt(SESSION));
    expect(editorSaves.readWhileTyping(SESSION, TYPED)).toBe(false);
  });

  it("holds a session saved in the editor for the first time, before the campaign has read it", () => {
    const { events, pauses, saves, shown } = editorSavesWith(new FakeCampaign());
    show(shown, TYPED);
    pauses.paused(SESSION, TYPED);
    events.trigger("modify", fileAt(SESSION));
    expect(saves.takeIfSavedHere(SESSION, TYPED)).toBe(true);
  });

  it("holds a line break added at the end of the note as a change", () => {
    const { events, pauses, saves, shown } = editorSavesWith(campaignHolding(READ));
    show(shown, `${READ}\n`);
    pauses.paused(SESSION, `${READ}\n`);
    events.trigger("modify", fileAt(SESSION));
    expect(saves.takeIfSavedHere(SESSION, `${READ}\n`)).toBe(true);
  });

  it("holds the save when Obsidian saved just before the pause, and the pause comes before the campaign reads it", () => {
    const { events, pauses, saves, shown, savedInEditor } = editorSavesWith(campaignHolding(READ));
    show(shown, TYPED);
    events.trigger("modify", fileAt(SESSION));
    pauses.paused(SESSION, TYPED);
    expect(saves.takeIfSavedHere(SESSION, TYPED)).toBe(true);
    expect(savedInEditor.sessionSavedInEditor).not.toHaveBeenCalled();
  });

  it("no longer takes that save for one made while typing once the pause has held it", () => {
    const { events, pauses, shown, editorSaves } = editorSavesWith(campaignHolding(READ));
    show(shown, TYPED);
    events.trigger("modify", fileAt(SESSION));
    pauses.paused(SESSION, TYPED);
    expect(editorSaves.readWhileTyping(SESSION, TYPED)).toBe(false);
  });

  it("counts the save at the pause when Obsidian saved just before it and the campaign has already read it", () => {
    const { events, pauses, shown, savedInEditor, editorSaves } = editorSavesWith(campaignHolding(READ));
    show(shown, TYPED);
    events.trigger("modify", fileAt(SESSION));
    expect(editorSaves.readWhileTyping(SESSION, TYPED)).toBe(true);
    pauses.paused(SESSION, TYPED);
    expect(savedInEditor.sessionSavedInEditor).toHaveBeenCalledExactlyOnceWith(SESSION);
  });

  it("counts that save once, though the pause comes again with the same text", () => {
    const { events, pauses, shown, savedInEditor, editorSaves } = editorSavesWith(campaignHolding(READ));
    show(shown, TYPED);
    events.trigger("modify", fileAt(SESSION));
    editorSaves.readWhileTyping(SESSION, TYPED);
    pauses.paused(SESSION, TYPED);
    pauses.paused(SESSION, TYPED);
    expect(savedInEditor.sessionSavedInEditor).toHaveBeenCalledOnce();
  });
});

describe("EditorSaves, a save made while typing", () => {
  it("holds nothing as a save made here, and knows its read as one made while typing", () => {
    const { events, saves, shown, savedInEditor, editorSaves } = editorSavesWith(campaignHolding(READ));
    show(shown, HALF_TYPED);
    events.trigger("modify", fileAt(SESSION));
    expect(saves.takeIfSavedHere(SESSION, HALF_TYPED)).toBe(false);
    expect(editorSaves.readWhileTyping(SESSION, HALF_TYPED)).toBe(true);
    expect(savedInEditor.sessionSavedInEditor).not.toHaveBeenCalled();
  });

  it("holds nothing as a save made here when the typing went on after the last pause", () => {
    const { events, pauses, saves, shown } = editorSavesWith(campaignHolding(READ));
    pauses.paused(SESSION, HALF_TYPED);
    show(shown, TYPED);
    events.trigger("modify", fileAt(SESSION));
    expect(saves.takeIfSavedHere(SESSION, TYPED)).toBe(false);
  });

  it("counts nothing at a pause that comes after more typing", () => {
    const { events, pauses, shown, savedInEditor, editorSaves } = editorSavesWith(campaignHolding(READ));
    show(shown, TYPED);
    events.trigger("modify", fileAt(SESSION));
    editorSaves.readWhileTyping(SESSION, TYPED);
    pauses.paused(SESSION, TYPED_ON);
    expect(savedInEditor.sessionSavedInEditor).not.toHaveBeenCalled();
  });

  it("keeps only the latest save made while typing", () => {
    const { events, shown, editorSaves } = editorSavesWith(campaignHolding(READ));
    show(shown, HALF_TYPED);
    events.trigger("modify", fileAt(SESSION));
    show(shown, TYPED);
    events.trigger("modify", fileAt(SESSION));
    expect(editorSaves.readWhileTyping(SESSION, HALF_TYPED)).toBe(false);
  });

  it("drops a save made while typing on any read of that session", () => {
    const { events, shown, editorSaves } = editorSavesWith(campaignHolding(READ));
    show(shown, TYPED);
    events.trigger("modify", fileAt(SESSION));
    editorSaves.readWhileTyping(SESSION, HALF_TYPED);
    expect(editorSaves.readWhileTyping(SESSION, TYPED)).toBe(false);
  });

  it("drops a save made while typing that was read, on the next read of that session, so the pause after it counts nothing", () => {
    const { events, pauses, shown, savedInEditor, editorSaves } = editorSavesWith(campaignHolding(READ));
    show(shown, HALF_TYPED);
    events.trigger("modify", fileAt(SESSION));
    editorSaves.readWhileTyping(SESSION, HALF_TYPED);
    editorSaves.readWhileTyping(SESSION, TYPED);
    pauses.paused(SESSION, HALF_TYPED);
    expect(savedInEditor.sessionSavedInEditor).not.toHaveBeenCalled();
  });

  it("forgets a save made while typing that the campaign hasn't read yet, when told to", () => {
    const { events, shown, editorSaves } = editorSavesWith(campaignHolding(READ));
    show(shown, TYPED);
    events.trigger("modify", fileAt(SESSION));
    editorSaves.forgetTyping(SESSION);
    expect(editorSaves.readWhileTyping(SESSION, TYPED)).toBe(false);
  });

  it("forgets the typing of a session when told to, so a later pause counts nothing", () => {
    const { events, pauses, shown, savedInEditor, editorSaves } = editorSavesWith(campaignHolding(READ));
    show(shown, TYPED);
    events.trigger("modify", fileAt(SESSION));
    editorSaves.readWhileTyping(SESSION, TYPED);
    editorSaves.forgetTyping(SESSION);
    pauses.paused(SESSION, TYPED);
    expect(savedInEditor.sessionSavedInEditor).not.toHaveBeenCalled();
  });
});

describe("EditorSaves, a change that isn't a save in the editor", () => {
  it("holds nothing when the editor still shows what the campaign last read, as when a change arrives by sync", () => {
    const { events, pauses, saves, shown, editorSaves } = editorSavesWith(campaignHolding(READ));
    pauses.paused(SESSION, READ);
    show(shown, READ);
    events.trigger("modify", fileAt(SESSION));
    expect(saves.takeIfSavedHere(SESSION, READ)).toBe(false);
    expect(editorSaves.readWhileTyping(SESSION, READ)).toBe(false);
  });

  it("holds nothing when no editor shows the session that changed", () => {
    const { events, pauses, saves, editorSaves } = editorSavesWith(campaignHolding(READ));
    pauses.paused(SESSION, TYPED);
    events.trigger("modify", fileAt(SESSION));
    expect(saves.takeIfSavedHere(SESSION, TYPED)).toBe(false);
    expect(editorSaves.readWhileTyping(SESSION, TYPED)).toBe(false);
  });

  it("doesn't look at the editors for a note that isn't a session of the open campaign", () => {
    const { events, editorTexts } = editorSavesWith(campaignHolding(READ));
    events.trigger("modify", fileAt(QUESTIONS));
    events.trigger("modify", fileAt("D&D/Silver Road/Sessions/Session 2.md"));
    expect(editorTexts).not.toHaveBeenCalled();
  });

  it("counts nothing at a pause once the campaign is closed, though a save made while typing was read", () => {
    const campaign = campaignHolding(READ);
    const { events, pauses, shown, savedInEditor, editorSaves } = editorSavesWith(campaign);
    show(shown, TYPED);
    events.trigger("modify", fileAt(SESSION));
    editorSaves.readWhileTyping(SESSION, TYPED);
    campaign.campaignFolder = null;
    pauses.paused(SESSION, TYPED);
    expect(savedInEditor.sessionSavedInEditor).not.toHaveBeenCalled();
  });

  it("doesn't look at the editors while no campaign is open", () => {
    const campaign = campaignHolding(READ);
    campaign.campaignFolder = null;
    const { events, editorTexts } = editorSavesWith(campaign);
    events.trigger("modify", fileAt(SESSION));
    expect(editorTexts).not.toHaveBeenCalled();
  });
});

describe("EditorSaves, when a session goes", () => {
  it("drops the save held for a session that was deleted", () => {
    const { events, pauses, saves, shown } = editorSavesWith(campaignHolding(READ));
    show(shown, TYPED);
    pauses.paused(SESSION, TYPED);
    events.trigger("modify", fileAt(SESSION));
    events.trigger("delete", fileAt(SESSION));
    expect(saves.takeIfSavedHere(SESSION, TYPED)).toBe(false);
  });

  it("drops the save held under a session's old name when it is renamed", () => {
    const { events, pauses, saves, shown } = editorSavesWith(campaignHolding(READ));
    show(shown, TYPED);
    pauses.paused(SESSION, TYPED);
    events.trigger("modify", fileAt(SESSION));
    events.trigger("rename", fileAt(RENAMED), SESSION);
    expect(saves.takeIfSavedHere(SESSION, TYPED)).toBe(false);
  });

  it("forgets the pause of a deleted session, so a later save of the same text isn't held", () => {
    const { events, pauses, saves, shown } = editorSavesWith(campaignHolding(READ));
    pauses.paused(SESSION, TYPED);
    events.trigger("delete", fileAt(SESSION));
    show(shown, TYPED);
    events.trigger("modify", fileAt(SESSION));
    expect(saves.takeIfSavedHere(SESSION, TYPED)).toBe(false);
  });

  it("forgets a save made while typing in a deleted session", () => {
    const { events, shown, editorSaves } = editorSavesWith(campaignHolding(READ));
    show(shown, TYPED);
    events.trigger("modify", fileAt(SESSION));
    events.trigger("delete", fileAt(SESSION));
    expect(editorSaves.readWhileTyping(SESSION, TYPED)).toBe(false);
  });
});

describe("EditorSaves, stopped", () => {
  it("stops listening to saves", () => {
    const { events, editorTexts, stop } = editorSavesWith(campaignHolding(READ));
    stop();
    events.trigger("modify", fileAt(SESSION));
    expect(editorTexts).not.toHaveBeenCalled();
  });

  it("stops listening to deletes", () => {
    const { events, pauses, saves, shown, stop } = editorSavesWith(campaignHolding(READ));
    show(shown, TYPED);
    pauses.paused(SESSION, TYPED);
    events.trigger("modify", fileAt(SESSION));
    stop();
    events.trigger("delete", fileAt(SESSION));
    expect(saves.takeIfSavedHere(SESSION, TYPED)).toBe(true);
  });

  it("stops listening to pauses", () => {
    const { events, pauses, shown, savedInEditor, editorSaves, stop } = editorSavesWith(campaignHolding(READ));
    show(shown, TYPED);
    events.trigger("modify", fileAt(SESSION));
    editorSaves.readWhileTyping(SESSION, TYPED);
    stop();
    pauses.paused(SESSION, TYPED);
    expect(savedInEditor.sessionSavedInEditor).not.toHaveBeenCalled();
  });
});
