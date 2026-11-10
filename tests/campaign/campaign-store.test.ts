import { describe, expect, it } from "vitest";
import type { Campaign } from "../../src/campaign/campaign";
import { CampaignStore } from "../../src/campaign/campaign-store";
import { FakeVault } from "./fake-vault";

function questionsIn(campaign: Campaign): string[] {
  return campaign.questions.map((question) => question.text);
}

async function openStore(fake: FakeVault): Promise<{ store: CampaignStore; seen: Campaign[] }> {
  const store = new CampaignStore(fake.vault);
  const seen: Campaign[] = [];
  store.subscribe((campaign) => seen.push(campaign));
  await store.open("Pale Moon");
  return { store, seen };
}

describe("CampaignStore", () => {
  it("reads the campaign when opened, and tells its listeners", async () => {
    const fake = new FakeVault([{ path: "Pale Moon/Sessions/Session 1.md", text: "? Who" }]);
    const { store, seen } = await openStore(fake);
    expect(questionsIn(store.current)).toEqual(["Who"]);
    expect(seen).toHaveLength(1);
    expect(store.campaignFolder).toBe("Pale Moon");
  });

  it("re-reads a session note when it changes", async () => {
    const fake = new FakeVault([
      { path: "Pale Moon/Sessions/Session 1.md", text: "? Who" },
      { path: "Pale Moon/Sessions/Session 2.md", text: "" },
    ]);
    const { store, seen } = await openStore(fake);
    store.noteChanged("Pale Moon/Sessions/Session 2.md", "? Why");
    expect(questionsIn(store.current)).toEqual(["Who", "Why"]);
    expect(seen).toHaveLength(2);
  });

  it("skips a changed note's properties", async () => {
    const fake = new FakeVault([]);
    const { store } = await openStore(fake);
    store.noteChanged("Pale Moon/Sessions/Session 1.md", "---\n? Not one\n---\n? Who");
    expect(questionsIn(store.current)).toEqual(["Who"]);
  });

  it("adds a session note made after it opened", async () => {
    const fake = new FakeVault([]);
    const { store } = await openStore(fake);
    store.noteChanged("Pale Moon/Sessions/Session 3.md", "? New");
    expect(questionsIn(store.current)).toEqual(["New"]);
  });

  it("ignores a change to a note that isn't one of its sessions", async () => {
    const fake = new FakeVault([{ path: "Pale Moon/Sessions/Session 1.md", text: "? Who" }]);
    const { store, seen } = await openStore(fake);
    store.noteChanged("Pale Moon/Characters/Mira.md", "? Not a session");
    store.noteChanged("Ashen Road/Sessions/Session 1.md", "? Another campaign");
    expect(questionsIn(store.current)).toEqual(["Who"]);
    expect(seen).toHaveLength(1);
  });

  it("drops a deleted session note", async () => {
    const fake = new FakeVault([
      { path: "Pale Moon/Sessions/Session 1.md", text: "? Who" },
      { path: "Pale Moon/Sessions/Session 2.md", text: "? Why" },
    ]);
    const { store } = await openStore(fake);
    store.noteDeleted("Pale Moon/Sessions/Session 2.md");
    expect(questionsIn(store.current)).toEqual(["Who"]);
  });

  it("ignores a deleted note that wasn't one of its sessions", async () => {
    const fake = new FakeVault([{ path: "Pale Moon/Sessions/Session 1.md", text: "? Who" }]);
    const { store, seen } = await openStore(fake);
    store.noteDeleted("Pale Moon/Characters/Mira.md");
    expect(seen).toHaveLength(1);
  });

  it("closes the campaign when its own folder is deleted or moved out of the Campaigns folder", async () => {
    const fake = new FakeVault([{ path: "Pale Moon/Sessions/Session 1.md", text: "? Who" }]);
    const { store, seen } = await openStore(fake);
    store.noteDeleted("Pale Moon");
    expect(store.campaignFolder).toBeNull();
    expect(questionsIn(store.current)).toEqual([]);
    expect(seen).toHaveLength(2);
  });

  it("follows a session note renamed to a new number", async () => {
    const fake = new FakeVault([
      { path: "Pale Moon/Sessions/Session 1.md", text: "? Later" },
      { path: "Pale Moon/Sessions/Session 2.md", text: "? Earlier" },
    ]);
    const { store } = await openStore(fake);
    fake.rename("Pale Moon/Sessions/Session 1.md", "Pale Moon/Sessions/Session 3.md");
    await store.noteRenamed("Pale Moon/Sessions/Session 3.md", "Pale Moon/Sessions/Session 1.md");
    expect(questionsIn(store.current)).toEqual(["Earlier", "Later"]);
  });

  it("drops a session note renamed out of the Sessions folder, and adds one moved in", async () => {
    const fake = new FakeVault([
      { path: "Pale Moon/Sessions/Session 1.md", text: "? Moved out" },
      { path: "Pale Moon/Drafts/Session 2.md", text: "? Moved in" },
    ]);
    const { store } = await openStore(fake);
    fake.rename("Pale Moon/Sessions/Session 1.md", "Pale Moon/Drafts/Session 1.md");
    await store.noteRenamed("Pale Moon/Drafts/Session 1.md", "Pale Moon/Sessions/Session 1.md");
    fake.rename("Pale Moon/Drafts/Session 2.md", "Pale Moon/Sessions/Session 2.md");
    await store.noteRenamed("Pale Moon/Sessions/Session 2.md", "Pale Moon/Drafts/Session 2.md");
    expect(questionsIn(store.current)).toEqual(["Moved in"]);
  });

  it("follows the campaign folder when it is renamed", async () => {
    const fake = new FakeVault([{ path: "Pale Moon/Sessions/Session 1.md", text: "? Who" }]);
    const { store } = await openStore(fake);
    fake.rename("Pale Moon/Sessions/Session 1.md", "Waning Moon/Sessions/Session 1.md");
    await store.noteRenamed("Waning Moon", "Pale Moon");
    expect(store.campaignFolder).toBe("Waning Moon");
    expect(questionsIn(store.current)).toEqual(["Who"]);
    expect(store.current.questions[0]?.source.path).toBe("Waning Moon/Sessions/Session 1.md");
  });

  it("stops telling a listener once it unsubscribes", async () => {
    const fake = new FakeVault([]);
    const store = new CampaignStore(fake.vault);
    const seen: Campaign[] = [];
    const unsubscribe = store.subscribe((campaign) => seen.push(campaign));
    unsubscribe();
    await store.open("Pale Moon");
    expect(seen).toEqual([]);
  });

  it("reads nothing before a campaign is opened", () => {
    const fake = new FakeVault([]);
    const store = new CampaignStore(fake.vault);
    store.noteChanged("Pale Moon/Sessions/Session 1.md", "? Who");
    expect(store.current.questions).toEqual([]);
    expect(store.campaignFolder).toBeNull();
  });

  it("keeps the campaign opened last when an earlier open finishes after it", async () => {
    const fake = new FakeVault([
      { path: "Pale Moon/Sessions/Session 1.md", text: "? From Pale Moon" },
      { path: "Ashen Road/Sessions/Session 1.md", text: "? From Ashen Road" },
    ]);
    const store = new CampaignStore(fake.vault);
    const release = fake.holdReadsOf("Pale Moon/Sessions/Session 1.md");
    const first = store.open("Pale Moon");
    await store.open("Ashen Road");
    release();
    await first;
    expect(store.campaignFolder).toBe("Ashen Road");
    expect(questionsIn(store.current)).toEqual(["From Ashen Road"]);
  });

  it("forgets the campaign when closed, and tells its listeners", async () => {
    const fake = new FakeVault([{ path: "Pale Moon/Sessions/Session 1.md", text: "? Who" }]);
    const { store, seen } = await openStore(fake);
    store.close();
    expect(store.campaignFolder).toBeNull();
    expect(store.sessionNotes).toEqual([]);
    expect(questionsIn(store.current)).toEqual([]);
    expect(seen).toHaveLength(2);
  });

  it("stays closed when a campaign opened before it finishes reading", async () => {
    const fake = new FakeVault([{ path: "Pale Moon/Sessions/Session 1.md", text: "? Who" }]);
    const store = new CampaignStore(fake.vault);
    const release = fake.holdReadsOf("Pale Moon/Sessions/Session 1.md");
    const opening = store.open("Pale Moon");
    store.close();
    release();
    await opening;
    expect(store.campaignFolder).toBeNull();
    expect(questionsIn(store.current)).toEqual([]);
  });

  it("drops a renamed session's read when another campaign opened meanwhile", async () => {
    const fake = new FakeVault([
      { path: "Pale Moon/Sessions/Session 1.md", text: "? From Pale Moon" },
      { path: "Ashen Road/Sessions/Session 1.md", text: "? From Ashen Road" },
    ]);
    const { store } = await openStore(fake);
    fake.rename("Pale Moon/Sessions/Session 1.md", "Pale Moon/Sessions/Session 2.md");
    const release = fake.holdReadsOf("Pale Moon/Sessions/Session 2.md");
    const renamed = store.noteRenamed("Pale Moon/Sessions/Session 2.md", "Pale Moon/Sessions/Session 1.md");
    await store.open("Ashen Road");
    release();
    await renamed;
    expect(questionsIn(store.current)).toEqual(["From Ashen Road"]);
  });

  it("keeps an edit made while the campaign was being read", async () => {
    const fake = new FakeVault([{ path: "Pale Moon/Sessions/Session 1.md", text: "? Saved" }]);
    const store = new CampaignStore(fake.vault);
    const release = fake.holdReadsOf("Pale Moon/Sessions/Session 1.md");
    const opening = store.open("Pale Moon");
    store.noteChanged("Pale Moon/Sessions/Session 1.md", "? Typed");
    release();
    await opening;
    expect(questionsIn(store.current)).toEqual(["Typed"]);
  });

  it("keeps a session renamed while the campaign was being read under its new name", async () => {
    const fake = new FakeVault([{ path: "Pale Moon/Sessions/Session 1.md", text: "? Who" }]);
    const store = new CampaignStore(fake.vault);
    const release = fake.holdReadsOf("Pale Moon/Sessions/Session 1.md");
    const opening = store.open("Pale Moon");
    fake.rename("Pale Moon/Sessions/Session 1.md", "Pale Moon/Sessions/Session 2.md");
    await store.noteRenamed("Pale Moon/Sessions/Session 2.md", "Pale Moon/Sessions/Session 1.md");
    release();
    await opening;
    expect(store.current.questions.map((question) => question.source.path)).toEqual([
      "Pale Moon/Sessions/Session 2.md",
    ]);
  });

  it("keeps a session deleted while the campaign was being read gone", async () => {
    const fake = new FakeVault([{ path: "Pale Moon/Sessions/Session 1.md", text: "? Who" }]);
    const store = new CampaignStore(fake.vault);
    const release = fake.holdReadsOf("Pale Moon/Sessions/Session 1.md");
    const opening = store.open("Pale Moon");
    store.noteDeleted("Pale Moon/Sessions/Session 1.md");
    release();
    await opening;
    expect(store.current.questions).toEqual([]);
  });

  it("keeps an edit made while a renamed session was being read", async () => {
    const fake = new FakeVault([{ path: "Pale Moon/Sessions/Session 1.md", text: "? Saved" }]);
    const { store } = await openStore(fake);
    fake.rename("Pale Moon/Sessions/Session 1.md", "Pale Moon/Sessions/Session 2.md");
    const release = fake.holdReadsOf("Pale Moon/Sessions/Session 2.md");
    const renamed = store.noteRenamed("Pale Moon/Sessions/Session 2.md", "Pale Moon/Sessions/Session 1.md");
    store.noteChanged("Pale Moon/Sessions/Session 2.md", "? Typed");
    release();
    await renamed;
    expect(questionsIn(store.current)).toEqual(["Typed"]);
  });

  it("never mixes the old campaign into the one being opened", async () => {
    const fake = new FakeVault([
      { path: "Pale Moon/Sessions/Session 1.md", text: "? From Pale Moon" },
      { path: "Ashen Road/Sessions/Session 1.md", text: "? From Ashen Road" },
    ]);
    const { store, seen } = await openStore(fake);
    const release = fake.holdReadsOf("Ashen Road/Sessions/Session 1.md");
    const opening = store.open("Ashen Road");
    const told = seen.length;
    store.noteChanged("Ashen Road/Sessions/Session 2.md", "? Typed");
    expect(seen).toHaveLength(told);
    release();
    await opening;
    expect(questionsIn(store.current)).toEqual(["From Ashen Road", "Typed"]);
  });

  it("never carries an edit in one campaign into the next one opened", async () => {
    const fake = new FakeVault([
      { path: "Pale Moon/Sessions/Session 1.md", text: "? From Pale Moon" },
      { path: "Ashen Road/Sessions/Session 1.md", text: "? From Ashen Road" },
    ]);
    const { store } = await openStore(fake);
    store.noteChanged("Pale Moon/Sessions/Session 1.md", "? Edited in Pale Moon");
    await store.open("Ashen Road");
    expect(questionsIn(store.current)).toEqual(["From Ashen Road"]);
  });
});
