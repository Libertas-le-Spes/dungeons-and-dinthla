import { describe, expect, it } from "vitest";
import { CampaignStore } from "../../../src/campaign/reading/campaign-store";
import type { CampaignFiles } from "../../../src/campaign/reading/read-campaign";
import { SavedCampaign } from "../../../src/campaign/reading/saved-campaign";
import type { NoteRef } from "../../../src/host/notes/note-ref";
import { holderPropertyOf } from "../../../src/funds/item-notes/holder-property";
import { FakeEvents } from "../../fence/gate/fake-raw-vault";
import { notesOverFakes } from "../../host/notes-over-fakes";
import { noteNameOf } from "../../../src/campaign/paths/note-name";
import { FakeVault } from "../fake-vault";
import { STUB_SYNTAX } from "../../host/stub-syntax";

const CAMPAIGN = "D&D/Pale Moon";
const SESSION = `${CAMPAIGN}/Sessions/Session 1.md`;
const RENAMED = `${CAMPAIGN}/Sessions/Session 2.md`;
const SAVED = "$$ Silvered lantern :changed to [[Mira]]";

function savedCampaignOf(text: string) {
  const sessions = new FakeVault([{ path: SESSION, text }]);
  const reads: string[] = [];
  let refused: Error | null = null;
  const refuseReads = (error: Error) => {
    refused = error;
  };
  const shownVault = sessions.vault;
  const store: CampaignFiles = {
    ...shownVault,
    readKept: async (file: NoteRef) => {
      reads.push(file.path);
      if (refused !== null) throw refused;
      return shownVault.readKept(file);
    },
  };
  const fileEvents = new FakeEvents();
  const metadataEvents = new FakeEvents();
  const files = { on: fileEvents.on.bind(fileEvents), offref: fileEvents.offref.bind(fileEvents) };
  const metadata = { on: metadataEvents.on.bind(metadataEvents), offref: metadataEvents.offref.bind(metadataEvents) };
  const changes = notesOverFakes({ files, metadata });
  const shown = new CampaignStore(shownVault, STUB_SYNTAX);
  const failures: unknown[] = [];
  const saved = new SavedCampaign({ shown, notes: { store, changes }, failed: (error) => failures.push(error) }, STUB_SYNTAX);
  const saveSession = (saved: string) => metadataEvents.trigger("changed", { path: SESSION }, saved, {});
  const renameSession = (oldPath: string, path: string) => {
    sessions.rename(oldPath, path);
    fileEvents.trigger("rename", { path, basename: noteNameOf(path), stat: {} }, oldPath);
  };
  const renameCampaign = (path: string) => {
    sessions.rename(SESSION, `${path}/Sessions/Session 1.md`);
    fileEvents.trigger("rename", { path, children: [] }, CAMPAIGN);
  };
  return { saved, shown, reads, fileEvents, metadataEvents, saveSession, renameSession, renameCampaign, refuseReads, failures };
}

function holdersOf(saved: SavedCampaign): string[] {
  return saved.current.items.map((item) => `${item.name}: ${holderPropertyOf(item)}`);
}

async function settle(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 10));
}

describe("SavedCampaign", () => {
  it("opens the campaign the shown campaign opens, from the saved notes", async () => {
    const { saved, shown } = savedCampaignOf(SAVED);
    saved.start();
    await shown.open(CAMPAIGN);
    await settle();
    expect(saved.campaignFolder).toBe(CAMPAIGN);
    expect(holdersOf(saved)).toEqual(["Silvered lantern: [[Mira]]"]);
  });

  it("opens the campaign already open when started", async () => {
    const { saved, shown } = savedCampaignOf(SAVED);
    await shown.open(CAMPAIGN);
    saved.start();
    await settle();
    expect(holdersOf(saved)).toEqual(["Silvered lantern: [[Mira]]"]);
  });

  it("leaves out the text being typed in the editor", async () => {
    const { saved, shown } = savedCampaignOf(SAVED);
    saved.start();
    await shown.open(CAMPAIGN);
    await settle();
    shown.noteChanged(SESSION, "$$ Silvered lantern :changed to Ol");
    expect(holdersOf(saved)).toEqual(["Silvered lantern: [[Mira]]"]);
  });

  it("reads a session note again when it is saved", async () => {
    const { saved, shown, saveSession } = savedCampaignOf(SAVED);
    saved.start();
    await shown.open(CAMPAIGN);
    await settle();
    saveSession("$$ Silvered lantern :changed to Old Tom");
    expect(holdersOf(saved)).toEqual(["Silvered lantern: Old Tom"]);
  });

  it("reads the campaign's notes once, not at every change the shown campaign takes", async () => {
    const { saved, shown, reads } = savedCampaignOf(SAVED);
    saved.start();
    await shown.open(CAMPAIGN);
    await settle();
    shown.noteChanged(SESSION, "$$ Silvered lantern :changed to Ol");
    shown.noteChanged(SESSION, "$$ Silvered lantern :changed to Old");
    await settle();
    expect(reads).toEqual([SESSION]);
  });

  it("closes when the shown campaign closes", async () => {
    const { saved, shown } = savedCampaignOf(SAVED);
    saved.start();
    await shown.open(CAMPAIGN);
    await settle();
    shown.close();
    expect(saved.campaignFolder).toBeNull();
    expect(holdersOf(saved)).toEqual([]);
  });

  it("drops a deleted session note", async () => {
    const { saved, shown, fileEvents } = savedCampaignOf(SAVED);
    saved.start();
    await shown.open(CAMPAIGN);
    await settle();
    fileEvents.trigger("delete", { path: SESSION });
    expect(holdersOf(saved)).toEqual([]);
  });

  it("follows a session note renamed within the campaign", async () => {
    const { saved, shown, renameSession, refuseReads, failures } = savedCampaignOf(SAVED);
    saved.start();
    await shown.open(CAMPAIGN);
    await settle();
    renameSession(SESSION, RENAMED);
    await settle();
    expect(holdersOf(saved)).toEqual(["Silvered lantern: [[Mira]]"]);
    expect(saved.current.items.map((item) => item.source.path)).toEqual([RENAMED]);
    const refused = new Error("refused");
    refuseReads(refused);
    renameSession(RENAMED, SESSION);
    await settle();
    expect(failures).toEqual([refused]);
  });

  it("follows the campaign folder when it is renamed", async () => {
    const { saved, shown, renameCampaign } = savedCampaignOf(SAVED);
    saved.start();
    await shown.open(CAMPAIGN);
    await settle();
    renameCampaign("D&D/Waning Moon");
    await settle();
    expect(saved.campaignFolder).toBe("D&D/Waning Moon");
    expect(saved.current.items.map((item) => item.source.path)).toEqual(["D&D/Waning Moon/Sessions/Session 1.md"]);
  });

  it("says when the saved notes couldn't be read", async () => {
    const refused = new Error("refused");
    const { saved, shown, failures, refuseReads } = savedCampaignOf(SAVED);
    refuseReads(refused);
    saved.start();
    await shown.open(CAMPAIGN);
    await settle();
    expect(failures).toEqual([refused]);
  });

  it("stops listening once stopped", async () => {
    const { saved, shown, fileEvents, metadataEvents } = savedCampaignOf(SAVED);
    const stop = saved.start();
    await shown.open(CAMPAIGN);
    await settle();
    stop();
    await shown.open(CAMPAIGN);
    await settle();
    expect(saved.campaignFolder).toBeNull();
    expect(fileEvents.stopped).toHaveLength(3);
    expect(metadataEvents.stopped).toHaveLength(1);
  });

  it("lists the session notes it has read", async () => {
    const { saved, shown } = savedCampaignOf(SAVED);
    saved.start();
    await shown.open(CAMPAIGN);
    await settle();
    expect(saved.sessionNotes.map((session) => session.path)).toEqual([SESSION]);
  });

  it("tells a listener which note was read and its text, after the campaign has taken it in", async () => {
    const { saved, shown, saveSession } = savedCampaignOf(SAVED);
    saved.start();
    await shown.open(CAMPAIGN);
    await settle();
    const heard: { path: string; text: string; holders: string[] }[] = [];
    saved.onNoteRead((path, text) => heard.push({ path, text, holders: holdersOf(saved) }));
    saveSession("$$ Silvered lantern :changed to [[Baka]]");
    expect(heard).toEqual([{ path: SESSION, text: "$$ Silvered lantern :changed to [[Baka]]", holders: ["Silvered lantern: [[Baka]]"] }]);
  });

  it("stops telling a listener that stopped listening", async () => {
    const { saved, shown, saveSession } = savedCampaignOf(SAVED);
    saved.start();
    await shown.open(CAMPAIGN);
    await settle();
    const heard: string[] = [];
    const stop = saved.onNoteRead((path) => heard.push(path));
    stop();
    saveSession("$$ Silvered lantern :changed to [[Baka]]");
    expect(heard).toEqual([]);
  });

  it("tells a listener when the campaign it follows has been read", async () => {
    const { saved, shown } = savedCampaignOf(SAVED);
    const opened: string[] = [];
    saved.onOpened((folder) => opened.push(folder));
    saved.start();
    await shown.open(CAMPAIGN);
    await settle();
    expect(opened).toEqual([CAMPAIGN]);
  });

  it("doesn't say a campaign was read when another was chosen before it finished", async () => {
    const { saved, shown } = savedCampaignOf(SAVED);
    const opened: string[] = [];
    saved.onOpened((folder) => opened.push(folder));
    saved.start();
    await shown.open(CAMPAIGN);
    shown.close();
    await settle();
    expect(opened).toEqual([]);
  });
});
