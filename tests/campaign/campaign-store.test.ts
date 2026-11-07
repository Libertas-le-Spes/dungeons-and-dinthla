import { describe, expect, it } from "vitest";
import type { Campaign } from "../../src/campaign/campaign";
import { CampaignStore } from "../../src/campaign/campaign-store";
import { cacheWithProperties, FakeVault } from "./fake-vault";

function questionsIn(campaign: Campaign): string[] {
  return campaign.questions.map((question) => question.text);
}

async function openStore(fake: FakeVault): Promise<{ store: CampaignStore; seen: Campaign[] }> {
  const store = new CampaignStore(fake.vault, fake.metadata);
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
    store.noteChanged(fake.file("Pale Moon/Sessions/Session 2.md"), "? Why", null);
    expect(questionsIn(store.current)).toEqual(["Who", "Why"]);
    expect(seen).toHaveLength(2);
  });

  it("skips a changed note's properties", async () => {
    const fake = new FakeVault([]);
    const { store } = await openStore(fake);
    store.noteChanged(fake.file("Pale Moon/Sessions/Session 1.md"), "---\n? Not one\n---\n? Who", cacheWithProperties(2));
    expect(questionsIn(store.current)).toEqual(["Who"]);
  });

  it("adds a session note made after it opened", async () => {
    const fake = new FakeVault([]);
    const { store } = await openStore(fake);
    store.noteChanged(fake.file("Pale Moon/Sessions/Session 3.md"), "? New", null);
    expect(questionsIn(store.current)).toEqual(["New"]);
  });

  it("ignores a change to a note that isn't one of its sessions", async () => {
    const fake = new FakeVault([{ path: "Pale Moon/Sessions/Session 1.md", text: "? Who" }]);
    const { store, seen } = await openStore(fake);
    store.noteChanged(fake.file("Pale Moon/Characters/Mira.md"), "? Not a session", null);
    store.noteChanged(fake.file("Ashen Road/Sessions/Session 1.md"), "? Another campaign", null);
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
    const store = new CampaignStore(fake.vault, fake.metadata);
    const seen: Campaign[] = [];
    const unsubscribe = store.subscribe((campaign) => seen.push(campaign));
    unsubscribe();
    await store.open("Pale Moon");
    expect(seen).toEqual([]);
  });

  it("reads nothing before a campaign is opened", () => {
    const fake = new FakeVault([]);
    const store = new CampaignStore(fake.vault, fake.metadata);
    store.noteChanged(fake.file("Pale Moon/Sessions/Session 1.md"), "? Who", null);
    expect(store.current.questions).toEqual([]);
    expect(store.campaignFolder).toBeNull();
  });
});
