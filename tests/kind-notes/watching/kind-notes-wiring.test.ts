import { describe, expect, it, vi } from "vitest";
import type { SavedCampaign } from "../../../src/campaign/reading/saved-campaign";
import type { Gate } from "../../../src/fence/gate/gatekeeper";
import { NoteReporter } from "../../../src/fence/gate/written-notes";
import { startKindNotes } from "../../../src/kind-notes/watching/kind-notes-wiring";
import type { NotesMade } from "../../../src/settings/saved/notes-made";
import { firstOf } from "../../stubs/lists";
import { FakeCampaign } from "../fake-campaign";
import { FakeNotes } from "../fake-notes";
import { CAMPAIGN, FUNDS, QUESTIONS, SESSION, settled } from "../keeper-setup";

const QUESTS = `${CAMPAIGN}/Quests/Session 2.md`;
const SESSION_THREE = `${CAMPAIGN}/Sessions/Session 3.md`;
const TWO_LINES = "? Who sent [[Lady Vess]] to the Old Mill\n! Find the caravan, from: [[Lady Vess]]\n$ 5 gp rooms at the Old Mill\n$ [[Mira]] Silvered lantern";

function startWith(notes: FakeNotes, campaign: FakeCampaign, alreadyMade: string[] = []) {
  const written = new NoteReporter();
  const asked: { message: string; fix: () => void; keep: () => void }[] = [];
  const marked: string[] = [];
  const made = { hasMadeFor: (folder: string) => alreadyMade.includes(folder), markMadeFor: vi.fn(async (folder: string) => void marked.push(folder)) };
  const items = { sessionSaved: vi.fn(), makeMissing: vi.fn(async () => ({ made: 0, failed: 0 })) };
  const references = { sessionSaved: vi.fn() };
  const gate = { files: notes.files, metadata: notes.metadata, fileActions: notes.actions } as unknown as Gate;
  const stop = startKindNotes({
    gate,
    written: written.notes,
    saved: campaign as unknown as SavedCampaign,
    made: made as unknown as NotesMade,
    items,
    references,
    say: (message) => notes.said.push(message),
    ask: (message, fix, keep) => void asked.push({ message, fix, keep }),
  });
  return { written, asked, marked, stop, made, items, references };
}

function saveHere(written: NoteReporter, campaign: FakeCampaign, path: string, text: string): void {
  written.textSaved(path, text);
  campaign.arrive(path, text);
}

function world() {
  const notes = new FakeNotes();
  notes.addSession(SESSION);
  notes.addSession(SESSION_THREE);
  return { notes, campaign: new FakeCampaign() };
}

describe("kind notes, from saving a session to the notes", () => {
  it("makes the Questions, Quests and Funds notes when Session 2 is saved, each linking Session 2", async () => {
    const { notes, campaign } = world();
    const { written } = startWith(notes, campaign);
    saveHere(written, campaign, SESSION, TWO_LINES);
    await settled();
    for (const path of [QUESTIONS, QUESTS, FUNDS]) expect(notes.noteAt(path)?.properties?.session).toBe("[[Session 2]]");
    expect(notes.noteAt(QUESTIONS)?.properties?.lines).toEqual(["? Who sent [[Lady Vess]] to the Old Mill"]);
    expect(notes.noteAt(QUESTS)?.properties?.lines).toEqual(["! Find the caravan, from: [[Lady Vess]]"]);
  });

  it("puts a coin line and an item line both in Funds", async () => {
    const { notes, campaign } = world();
    const { written } = startWith(notes, campaign);
    saveHere(written, campaign, SESSION, TWO_LINES);
    await settled();
    expect(notes.noteAt(FUNDS)?.properties?.lines).toEqual(["$ 5 gp rooms at the Old Mill", "$ [[Mira]] Silvered lantern"]);
  });

  it("puts an answer written in Session 3 in Session 3's Questions note, not Session 2's", async () => {
    const { notes, campaign } = world();
    const { written } = startWith(notes, campaign);
    campaign.hold(SESSION, TWO_LINES);
    saveHere(written, campaign, SESSION_THREE, "?= Who sent [[Lady Vess]] to the Old Mill: Lady Vess herself");
    await settled();
    expect(notes.noteAt(`${CAMPAIGN}/Questions/Session 3.md`)?.properties?.lines).toEqual(["?= Who sent [[Lady Vess]] to the Old Mill: Lady Vess herself"]);
    expect(notes.noteAt(QUESTIONS)).toBeNull();
  });

  it("makes nothing for a change that arrives without a save here", async () => {
    const { notes, campaign } = world();
    startWith(notes, campaign);
    campaign.arrive(SESSION, TWO_LINES);
    await settled();
    expect(notes.created).toEqual([]);
    expect(notes.actions.processFrontMatter).not.toHaveBeenCalled();
  });

  it("removes a deleted line from its note, and trashes the note when its last line goes", async () => {
    const { notes, campaign } = world();
    const { written } = startWith(notes, campaign);
    saveHere(written, campaign, SESSION, TWO_LINES);
    await settled();
    saveHere(written, campaign, SESSION, "$ 5 gp rooms at the Old Mill");
    await settled();
    expect(notes.noteAt(QUESTIONS)).toBeNull();
    expect(notes.noteAt(QUESTS)).toBeNull();
    expect(notes.noteAt(FUNDS)?.properties?.lines).toEqual(["$ 5 gp rooms at the Old Mill"]);
  });

  it("keeps a note with his words when the last line goes", async () => {
    const { notes, campaign } = world();
    const { written } = startWith(notes, campaign);
    saveHere(written, campaign, SESSION, TWO_LINES);
    await settled();
    notes.addNote(QUESTIONS, { session: "[[Session 2]]", lines: ["? Who sent [[Lady Vess]] to the Old Mill"] }, "My thoughts");
    saveHere(written, campaign, SESSION, "We rested.");
    await settled();
    expect(notes.noteAt(QUESTIONS)?.properties?.lines).toEqual([]);
    expect(notes.noteAt(QUESTIONS)?.words).toBe("My thoughts");
  });

  it("trashes a session's notes when the session is deleted", async () => {
    const { notes, campaign } = world();
    const { written } = startWith(notes, campaign);
    saveHere(written, campaign, SESSION, TWO_LINES);
    await settled();
    written.trashed(SESSION);
    await settled();
    expect(notes.trashed.sort()).toEqual([FUNDS, QUESTIONS, QUESTS].sort());
  });
});

describe("kind notes, when a session changed on another device", () => {
  it("asks once, in one line, when a note's lines differ from its session, and writes nothing", async () => {
    const { notes, campaign } = world();
    const { asked } = startWith(notes, campaign);
    notes.addNote(QUESTIONS, { session: "[[Session 2]]", lines: ["? Old"] }, "");
    campaign.arrive(SESSION, "? Who sent Mira");
    await settled();
    expect(asked.map((ask) => ask.message)).toEqual(["Questions for Session 2 differ from the session."]);
    expect(notes.actions.processFrontMatter).not.toHaveBeenCalled();
  });

  it("rewrites only the lines when the answer is Fix", async () => {
    const { notes, campaign } = world();
    const { asked } = startWith(notes, campaign);
    notes.addNote(QUESTIONS, { session: "[[Session 2]]", tags: ["pale"], lines: ["? Old"] }, "His words");
    campaign.arrive(SESSION, "? Who sent Mira");
    firstOf(asked).fix();
    await settled();
    expect(notes.noteAt(QUESTIONS)?.properties).toEqual({ session: "[[Session 2]]", tags: ["pale"], lines: ["? Who sent Mira"] });
    expect(notes.noteAt(QUESTIONS)?.words).toBe("His words");
  });

  it("leaves the note until the next save when the answer is Keep", async () => {
    const { notes, campaign } = world();
    const { asked, written } = startWith(notes, campaign);
    notes.addNote(QUESTIONS, { session: "[[Session 2]]", lines: ["? Old"] }, "");
    campaign.arrive(SESSION, "? Who sent Mira");
    firstOf(asked).keep();
    campaign.arrive(SESSION, "? Who sent Mira");
    await settled();
    expect(asked).toHaveLength(1);
    expect(notes.noteAt(QUESTIONS)?.properties?.lines).toEqual(["? Old"]);
    saveHere(written, campaign, SESSION, "? Who sent Mira");
    await settled();
    expect(notes.noteAt(QUESTIONS)?.properties?.lines).toEqual(["? Who sent Mira"]);
  });

  it("asks about nothing and makes nothing when a session arrives and its notes aren't there yet", async () => {
    const { notes, campaign } = world();
    const { asked } = startWith(notes, campaign);
    campaign.arrive(SESSION, "? Who sent Mira");
    await settled();
    expect(asked).toEqual([]);
    expect(notes.created).toEqual([]);
  });
});

describe("kind notes, for sessions written before", () => {
  it("makes their notes once when the campaign is opened, and says how many sessions got notes", async () => {
    const { notes, campaign } = world();
    campaign.hold(SESSION, "? Who sent Mira");
    campaign.hold(SESSION_THREE, "! Find the caravan");
    const { marked } = startWith(notes, campaign);
    campaign.open(CAMPAIGN);
    await settled();
    expect(notes.created.sort()).toEqual([QUESTIONS, `${CAMPAIGN}/Quests/Session 3.md`].sort());
    expect(notes.said).toEqual(["Made notes for 2 sessions."]);
    expect(marked).toEqual([CAMPAIGN]);
  });

  it("lets the item notes make theirs, and lets them know when a session is saved", async () => {
    const { notes, campaign } = world();
    campaign.hold(SESSION, "? Who sent Mira");
    const { items, written } = startWith(notes, campaign);
    campaign.open(CAMPAIGN);
    await settled();
    expect(items.makeMissing).toHaveBeenCalledOnce();
    saveHere(written, campaign, SESSION, "? Who sent Baka");
    expect(items.sessionSaved).toHaveBeenCalledOnce();
  });

  it("lets the people and places know which session was saved, and does nothing for the earlier sessions when the campaign opens", async () => {
    const { notes, campaign } = world();
    campaign.hold(SESSION, "? Who sent Mira");
    const { references, written } = startWith(notes, campaign);
    campaign.open(CAMPAIGN);
    await settled();
    expect(references.sessionSaved).not.toHaveBeenCalled();
    saveHere(written, campaign, SESSION, "? Who sent Baka");
    expect(references.sessionSaved).toHaveBeenCalledWith(SESSION);
  });

  it("makes nothing when the campaign was opened after the update before", async () => {
    const { notes, campaign } = world();
    campaign.hold(SESSION, "? Who sent Mira");
    startWith(notes, campaign, [CAMPAIGN]);
    campaign.open(CAMPAIGN);
    await settled();
    expect(notes.created).toEqual([]);
  });

  it("leaves a note that is already there as it is", async () => {
    const { notes, campaign } = world();
    campaign.hold(SESSION, "? Who sent Mira");
    notes.addNote(QUESTIONS, { session: "[[Session 2]]", lines: ["? Old"] }, "His words");
    startWith(notes, campaign);
    campaign.open(CAMPAIGN);
    await settled();
    expect(notes.created).toEqual([]);
    expect(notes.noteAt(QUESTIONS)?.properties?.lines).toEqual(["? Old"]);
  });

  it("says once that notes couldn't be made when marking the campaign fails", async () => {
    const { notes, campaign } = world();
    campaign.hold(SESSION, "? Who sent Mira");
    const { made } = startWith(notes, campaign);
    made.markMadeFor.mockRejectedValueOnce(new Error("disk full"));
    campaign.open(CAMPAIGN);
    await settled();
    expect(notes.said).toEqual(["Made notes for 1 session.", "Couldn't make notes for the earlier sessions: disk full"]);
  });

  it("then asks about a note that differs from its session", async () => {
    const { notes, campaign } = world();
    campaign.hold(SESSION, "? Who sent Mira");
    const { asked } = startWith(notes, campaign, [CAMPAIGN]);
    notes.addNote(QUESTIONS, { session: "[[Session 2]]", lines: ["? Old"] }, "");
    campaign.open(CAMPAIGN);
    await settled();
    expect(asked).toHaveLength(1);
  });

  it("stops watching and backfilling when stopped", async () => {
    const { notes, campaign } = world();
    campaign.hold(SESSION, "? Who sent Mira");
    const { stop, written } = startWith(notes, campaign);
    stop();
    campaign.open(CAMPAIGN);
    saveHere(written, campaign, SESSION, "? Who sent Mira");
    await settled();
    expect(notes.created).toEqual([]);
  });
});

describe("kind notes, when a session is deleted and the ones after it are renumbered", () => {
  function deleteSessionTwo(notes: FakeNotes, campaign: FakeCampaign, written: NoteReporter, three: ReturnType<FakeNotes["addSession"]>): void {
    written.trashed(SESSION);
    campaign.drop(SESSION);
    notes.removeSession(SESSION);
    notes.files.rename(three, SESSION);
    campaign.drop(SESSION_THREE);
    campaign.hold(SESSION, "? Was three");
    written.renamed(SESSION_THREE, SESSION);
  }

  it("trashes the deleted session's notes and moves the next session's notes into their place, linked to the new name", async () => {
    const notes = new FakeNotes();
    notes.addSession(SESSION);
    const three = notes.addSession(SESSION_THREE);
    const campaign = new FakeCampaign();
    campaign.hold(SESSION, "? Was two");
    campaign.hold(SESSION_THREE, "? Was three");
    notes.addNote(QUESTIONS, { session: "[[Session 2]]", lines: ["? Was two"] }, "");
    const questionsThree = `${CAMPAIGN}/Questions/Session 3.md`;
    notes.addNote(questionsThree, { session: "[[Session 3]]", lines: ["? Was three"] }, "His words");
    const { written } = startWith(notes, campaign);
    deleteSessionTwo(notes, campaign, written, three);
    await settled();
    await settled();
    expect(notes.trashed).toEqual([QUESTIONS]);
    expect(notes.noteAt(questionsThree)).toBeNull();
    expect(notes.noteAt(QUESTIONS)?.properties).toEqual({ session: "[[Session 2]]", lines: ["? Was three"] });
    expect(notes.noteAt(QUESTIONS)?.words).toBe("His words");
    expect(notes.said).toEqual([]);
  });

  it("leaves the notes of the next session where they are, and says so, when the deleted session's note has his words", async () => {
    const notes = new FakeNotes();
    notes.addSession(SESSION);
    const three = notes.addSession(SESSION_THREE);
    const campaign = new FakeCampaign();
    campaign.hold(SESSION, "? Was two");
    campaign.hold(SESSION_THREE, "? Was three");
    notes.addNote(QUESTIONS, { session: "[[Session 2]]", lines: ["? Was two"] }, "His words about two");
    const questionsThree = `${CAMPAIGN}/Questions/Session 3.md`;
    notes.addNote(questionsThree, { session: "[[Session 3]]", lines: ["? Was three"] }, "");
    const { written } = startWith(notes, campaign);
    deleteSessionTwo(notes, campaign, written, three);
    await settled();
    await settled();
    expect(notes.noteAt(QUESTIONS)?.words).toBe("His words about two");
    expect(notes.noteAt(questionsThree)).not.toBeNull();
    expect(notes.said).toHaveLength(2);
    expect(notes.said.some((message) => message.includes("holds your words, so it stays"))).toBe(true);
    expect(notes.said.some((message) => message.includes("stays where it is"))).toBe(true);
  });
});
