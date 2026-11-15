import { describe, expect, it, vi } from "vitest";
import { NoteReporter } from "../../../src/fence/gate/written-notes";
import { SessionWants } from "../../../src/kind-notes/wanting/session-wants";
import { KindNoteWatcher } from "../../../src/kind-notes/watching/kind-note-watcher";
import { SavesHere } from "../../../src/kind-notes/watching/saves-here";
import type { WantedNote } from "../../../src/kind-notes/wanting/wanted-note";
import { firstOf } from "../../stubs/lists";
import { FakeCampaign } from "../fake-campaign";
import { fileAt } from "../fake-notes";
import { CAMPAIGN, QUESTIONS, SESSION } from "../keeper-setup";

const TEXT = "? Who sent Mira";
const SESSION_RENAMED = SESSION.replace("Session 2", "Session 5");

function watcherWith(campaign: FakeCampaign) {
  const written = new NoteReporter();
  const keeper = { keep: vi.fn(), noteRead: vi.fn() };
  const differing = { check: vi.fn(), checkAll: vi.fn(), forget: vi.fn() };
  const items = { sessionSaved: vi.fn() };
  const mover = { sessionRenamed: vi.fn() };
  const references = { sessionSaved: vi.fn(), sessionGone: vi.fn() };
  const files = { getFileByPath: (path: string) => fileAt(path) };
  const watcher = new KindNoteWatcher({ store: campaign, wants: new SessionWants(campaign, files), written: written.notes, keeper, differing, saves: new SavesHere(), items, references, mover });
  const stop = watcher.start();
  return { written, keeper, differing, watcher, stop, items, references, mover };
}

function keptNotes(keep: { mock: { calls: unknown[][] } }): WantedNote[] {
  const [notes] = firstOf(keep.mock.calls);
  return notes as WantedNote[];
}

function linesWanted(notes: WantedNote[]): Record<string, string[]> {
  return Object.fromEntries(notes.map((note) => [note.folder, note.lines]));
}

describe("KindNoteWatcher", () => {
  it("keeps the notes of a session saved here once the campaign has read what was saved", () => {
    const campaign = new FakeCampaign();
    const { written, keeper, differing } = watcherWith(campaign);
    written.textSaved(SESSION, TEXT);
    expect(keeper.keep).not.toHaveBeenCalled();
    campaign.arrive(SESSION, TEXT);
    expect(keeper.keep).toHaveBeenCalledOnce();
    expect(linesWanted(keptNotes(keeper.keep))).toEqual({ Questions: [TEXT], Quests: [], Funds: [] });
    expect(differing.check).not.toHaveBeenCalled();
  });

  it("lets the item notes know a session was saved here, and not when a change arrives by sync", () => {
    const campaign = new FakeCampaign();
    const { written, items } = watcherWith(campaign);
    campaign.arrive(SESSION, "? Who sent Baka");
    expect(items.sessionSaved).not.toHaveBeenCalled();
    written.textSaved(SESSION, TEXT);
    campaign.arrive(SESSION, TEXT);
    expect(items.sessionSaved).toHaveBeenCalledOnce();
  });

  it("lets the people and places know which session was saved here, and not when a change arrives by sync or a session is deleted", () => {
    const campaign = new FakeCampaign();
    const { written, references } = watcherWith(campaign);
    campaign.arrive(SESSION, "? Who sent Baka");
    expect(references.sessionSaved).not.toHaveBeenCalled();
    written.textSaved(SESSION, TEXT);
    campaign.arrive(SESSION, TEXT);
    expect(references.sessionSaved).toHaveBeenCalledOnce();
    expect(references.sessionSaved).toHaveBeenCalledWith(SESSION);
    written.trashed(SESSION);
    expect(references.sessionSaved).toHaveBeenCalledOnce();
  });

  it("lets the people and places forget a session that was deleted, and one that was renamed", () => {
    const campaign = new FakeCampaign();
    const { written, references } = watcherWith(campaign);
    written.trashed(SESSION);
    expect(references.sessionGone).toHaveBeenCalledExactlyOnceWith(SESSION);
    written.renamed(SESSION, SESSION_RENAMED);
    expect(references.sessionGone).toHaveBeenCalledTimes(2);
    expect(references.sessionGone).toHaveBeenLastCalledWith(SESSION);
  });

  it("lets the item notes know a session was deleted", () => {
    const campaign = new FakeCampaign();
    const { written, items } = watcherWith(campaign);
    written.trashed(SESSION);
    expect(items.sessionSaved).toHaveBeenCalledOnce();
  });

  it("wants the notes at the paths inside the campaign, linked to the session's file", () => {
    const campaign = new FakeCampaign();
    const { written, keeper } = watcherWith(campaign);
    written.textSaved(SESSION, TEXT);
    campaign.arrive(SESSION, TEXT);
    const notes = keptNotes(keeper.keep);
    expect(notes.map((note) => note.path)).toEqual([QUESTIONS, `${CAMPAIGN}/Quests/Session 2.md`, `${CAMPAIGN}/Funds/Session 2.md`]);
    expect(notes.map((note) => note.sessionFile?.path)).toEqual([SESSION, SESSION, SESSION]);
  });

  it("makes nothing for a change that arrives without a save here, and checks whether the notes differ instead", () => {
    const campaign = new FakeCampaign();
    const { keeper, differing } = watcherWith(campaign);
    campaign.arrive(SESSION, TEXT);
    expect(keeper.keep).not.toHaveBeenCalled();
    expect(differing.check).toHaveBeenCalledOnce();
  });

  it("treats a read of other text than was saved here as arriving by sync", () => {
    const campaign = new FakeCampaign();
    const { written, keeper, differing } = watcherWith(campaign);
    written.textSaved(SESSION, TEXT);
    campaign.arrive(SESSION, "? Who sent Baka");
    expect(keeper.keep).not.toHaveBeenCalled();
    expect(differing.check).toHaveBeenCalledOnce();
  });

  it("forgets what a save made the notes differ about, so a later difference is asked again", () => {
    const campaign = new FakeCampaign();
    const { written, differing } = watcherWith(campaign);
    written.textSaved(SESSION, TEXT);
    campaign.arrive(SESSION, TEXT);
    expect(differing.forget).toHaveBeenCalledOnce();
  });

  it("takes the lines out of every note when a session is trashed, though the campaign still holds it", () => {
    const campaign = new FakeCampaign();
    campaign.hold(SESSION, TEXT);
    const { written, keeper } = watcherWith(campaign);
    written.trashed(SESSION);
    expect(keeper.keep).toHaveBeenCalledOnce();
    const notes = keptNotes(keeper.keep);
    expect(notes.map((note) => note.lines)).toEqual([[], [], []]);
    expect(notes.map((note) => note.sessionFile)).toEqual([null, null, null]);
  });

  it("ignores what is written to a note that isn't a session of the open campaign", () => {
    const campaign = new FakeCampaign();
    const { written, keeper, differing } = watcherWith(campaign);
    written.textSaved(QUESTIONS, TEXT);
    written.trashed(QUESTIONS);
    written.textSaved("D&D/Silver Road/Sessions/Session 2.md", TEXT);
    campaign.arrive(QUESTIONS, TEXT);
    expect(keeper.keep).not.toHaveBeenCalled();
    expect(differing.check).not.toHaveBeenCalled();
  });

  it("ignores a save while no campaign is open", () => {
    const campaign = new FakeCampaign();
    campaign.campaignFolder = null;
    const { written, keeper } = watcherWith(campaign);
    written.textSaved(SESSION, TEXT);
    written.trashed(SESSION);
    expect(keeper.keep).not.toHaveBeenCalled();
  });

  it("tells the keeper when any note is read, so a note it waited for can be written", () => {
    const campaign = new FakeCampaign();
    const { keeper } = watcherWith(campaign);
    campaign.arrive(QUESTIONS, "");
    expect(keeper.noteRead).toHaveBeenCalledExactlyOnceWith(QUESTIONS);
  });

  it("checks every session's notes when asked", () => {
    const campaign = new FakeCampaign();
    campaign.hold(SESSION, TEXT);
    campaign.hold(`${CAMPAIGN}/Sessions/Session 3.md`, "! Find the caravan");
    const { watcher, differing, keeper } = watcherWith(campaign);
    watcher.checkAll();
    expect(differing.checkAll).toHaveBeenCalledExactlyOnceWith([SESSION, `${CAMPAIGN}/Sessions/Session 3.md`]);
    expect(keeper.keep).not.toHaveBeenCalled();
  });

  it("stops watching when told to stop", () => {
    const campaign = new FakeCampaign();
    const { written, keeper, stop } = watcherWith(campaign);
    stop();
    written.textSaved(SESSION, TEXT);
    campaign.arrive(SESSION, TEXT);
    expect(keeper.keep).not.toHaveBeenCalled();
    expect(campaign.stopped).toHaveBeenCalledOnce();
  });

  it("keeps nothing and checks nothing for a save read while the campaign is still opening, since the campaign isn't built yet", () => {
    const campaign = new FakeCampaign();
    campaign.opening = true;
    const { written, keeper, differing, items } = watcherWith(campaign);
    written.textSaved(SESSION, TEXT);
    campaign.arrive(SESSION, TEXT);
    expect(keeper.keep).not.toHaveBeenCalled();
    expect(differing.check).not.toHaveBeenCalled();
    expect(items.sessionSaved).not.toHaveBeenCalled();
  });

  it("doesn't treat a later read of the same text as a save once the campaign was opening during the first", () => {
    const campaign = new FakeCampaign();
    campaign.opening = true;
    const { written, keeper, differing } = watcherWith(campaign);
    written.textSaved(SESSION, TEXT);
    campaign.arrive(SESSION, TEXT);
    campaign.opening = false;
    campaign.arrive(SESSION, TEXT);
    expect(keeper.keep).not.toHaveBeenCalled();
    expect(differing.check).toHaveBeenCalledOnce();
  });

  it("still takes the lines out of the notes of a session trashed while the campaign opens, but leaves the item notes", () => {
    const campaign = new FakeCampaign();
    campaign.opening = true;
    const { written, keeper, items } = watcherWith(campaign);
    written.trashed(SESSION);
    expect(keeper.keep).toHaveBeenCalledOnce();
    expect(items.sessionSaved).not.toHaveBeenCalled();
  });

  it("tells the mover when a file is renamed, whichever file it is, for it to decide", () => {
    const campaign = new FakeCampaign();
    const { written, mover } = watcherWith(campaign);
    written.renamed(`${CAMPAIGN}/Sessions/Session 3.md`, SESSION);
    expect(mover.sessionRenamed).toHaveBeenCalledExactlyOnceWith(`${CAMPAIGN}/Sessions/Session 3.md`, SESSION);
  });
});
