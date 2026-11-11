import { describe, expect, it } from "vitest";
import type { TFile } from "obsidian";
import { CampaignStore } from "../../../src/campaign/reading/campaign-store";
import { SavedCampaign, type SavedCampaignNeeds } from "../../../src/campaign/reading/saved-campaign";
import { holderPropertyOf } from "../../../src/funds/item-notes/holder-property";
import { FakeEvents } from "../../fence/gate/fake-raw-vault";
import { FakeVault } from "../fake-vault";

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
  const vault = {
    ...shownVault,
    cachedRead: async (file: TFile) => {
      reads.push(file.path);
      if (refused !== null) throw refused;
      return shownVault.cachedRead(file);
    },
  };
  const fileEvents = new FakeEvents();
  const metadataEvents = new FakeEvents();
  const files = { ...vault, on: fileEvents.on.bind(fileEvents), offref: fileEvents.offref.bind(fileEvents) } as unknown as SavedCampaignNeeds["files"];
  const metadata = { on: metadataEvents.on.bind(metadataEvents), offref: metadataEvents.offref.bind(metadataEvents) } as unknown as SavedCampaignNeeds["metadata"];
  const shown = new CampaignStore(shownVault);
  const failures: unknown[] = [];
  const saved = new SavedCampaign({ shown, files, metadata, failed: (error) => failures.push(error) });
  const saveSession = (saved: string) => metadataEvents.trigger("changed", { path: SESSION }, saved, {});
  const renameSession = (oldPath: string, path: string) => {
    sessions.rename(oldPath, path);
    fileEvents.trigger("rename", { path }, oldPath);
  };
  return { saved, shown, reads, fileEvents, metadataEvents, saveSession, renameSession, refuseReads, failures };
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
    expect(fileEvents.stopped).toHaveLength(2);
    expect(metadataEvents.stopped).toHaveLength(1);
  });
});
