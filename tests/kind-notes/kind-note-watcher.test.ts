import { describe, expect, it, vi } from "vitest";
import { WrittenNotes } from "../../src/fence/gate/written-notes";
import { KindNoteWatcher } from "../../src/kind-notes/kind-note-watcher";
import { SavesHere } from "../../src/kind-notes/saves-here";
import type { WantedNote } from "../../src/kind-notes/wanted-note";
import { FakeCampaign } from "./fake-campaign";
import { fileAt } from "./fake-notes";
import { CAMPAIGN, QUESTIONS, SESSION } from "./keeper-setup";

const TEXT = "? Who sent Mira";

function watcherWith(campaign: FakeCampaign) {
  const written = new WrittenNotes();
  const keeper = { keep: vi.fn(), noteRead: vi.fn() };
  const differing = { check: vi.fn(), forget: vi.fn() };
  const items = { sessionSaved: vi.fn() };
  const files = { getFileByPath: (path: string) => fileAt(path) };
  const watcher = new KindNoteWatcher({ store: campaign, files, written, keeper, differing, saves: new SavesHere(), items });
  const stop = watcher.start();
  return { written, keeper, differing, watcher, stop, items };
}

function linesWanted(call: unknown[] | undefined): Record<string, string[]> {
  const notes = call?.[0] as WantedNote[];
  return Object.fromEntries(notes.map((note) => [note.folder, note.lines]));
}

describe("KindNoteWatcher", () => {
  it("keeps the notes of a session saved here once the campaign has read what was saved", () => {
    const campaign = new FakeCampaign();
    const { written, keeper, differing } = watcherWith(campaign);
    written.changed(SESSION, TEXT);
    expect(keeper.keep).not.toHaveBeenCalled();
    campaign.arrive(SESSION, TEXT);
    expect(keeper.keep).toHaveBeenCalledOnce();
    expect(linesWanted(keeper.keep.mock.calls[0])).toEqual({ Questions: [TEXT], Quests: [], Funds: [] });
    expect(differing.check).not.toHaveBeenCalled();
  });

  it("lets the item notes know a session was saved here, and not when a change arrives by sync", () => {
    const campaign = new FakeCampaign();
    const { written, items } = watcherWith(campaign);
    campaign.arrive(SESSION, "? Who sent Baka");
    expect(items.sessionSaved).not.toHaveBeenCalled();
    written.changed(SESSION, TEXT);
    campaign.arrive(SESSION, TEXT);
    expect(items.sessionSaved).toHaveBeenCalledOnce();
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
    written.changed(SESSION, TEXT);
    campaign.arrive(SESSION, TEXT);
    const notes = keeper.keep.mock.calls[0]?.[0] as WantedNote[];
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
    written.changed(SESSION, TEXT);
    campaign.arrive(SESSION, "? Who sent Baka");
    expect(keeper.keep).not.toHaveBeenCalled();
    expect(differing.check).toHaveBeenCalledOnce();
  });

  it("forgets what a save made the notes differ about, so a later difference is asked again", () => {
    const campaign = new FakeCampaign();
    const { written, differing } = watcherWith(campaign);
    written.changed(SESSION, TEXT);
    campaign.arrive(SESSION, TEXT);
    expect(differing.forget).toHaveBeenCalledOnce();
  });

  it("takes the lines out of every note when a session is trashed, though the campaign still holds it", () => {
    const campaign = new FakeCampaign();
    campaign.hold(SESSION, TEXT);
    const { written, keeper } = watcherWith(campaign);
    written.trashed(SESSION);
    expect(keeper.keep).toHaveBeenCalledOnce();
    const notes = keeper.keep.mock.calls[0]?.[0] as WantedNote[];
    expect(notes.map((note) => note.lines)).toEqual([[], [], []]);
    expect(notes.map((note) => note.sessionFile)).toEqual([null, null, null]);
  });

  it("ignores what is written to a note that isn't a session of the open campaign", () => {
    const campaign = new FakeCampaign();
    const { written, keeper, differing } = watcherWith(campaign);
    written.changed(QUESTIONS, TEXT);
    written.trashed(QUESTIONS);
    written.changed("D&D/Silver Road/Sessions/Session 2.md", TEXT);
    campaign.arrive(QUESTIONS, TEXT);
    expect(keeper.keep).not.toHaveBeenCalled();
    expect(differing.check).not.toHaveBeenCalled();
  });

  it("ignores a save while no campaign is open", () => {
    const campaign = new FakeCampaign();
    campaign.campaignFolder = null;
    const { written, keeper } = watcherWith(campaign);
    written.changed(SESSION, TEXT);
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
    expect(differing.check).toHaveBeenCalledTimes(2);
    expect(keeper.keep).not.toHaveBeenCalled();
  });

  it("stops watching when told to stop", () => {
    const campaign = new FakeCampaign();
    const { written, keeper, stop } = watcherWith(campaign);
    stop();
    written.changed(SESSION, TEXT);
    campaign.arrive(SESSION, TEXT);
    expect(keeper.keep).not.toHaveBeenCalled();
    expect(campaign.stopped).toHaveBeenCalledOnce();
  });
});
