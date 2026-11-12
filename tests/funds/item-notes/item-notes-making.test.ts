import { describe, expect, it } from "vitest";
import { firstOf } from "../../stubs/lists";
import { CampaignStore } from "../../../src/campaign/reading/campaign-store";
import { ItemNotes } from "../../../src/funds/item-notes/item-notes";
import { FakeVault } from "../../campaign/fake-vault";
import { CAMPAIGN, FakeItemNotes, LANTERN, ROPE, SESSION, settle, type ItemNote } from "./fake-item-notes";

const THREE_LINES = ["$ [[Mira]] Silvered lantern", "We rested.", "$$ Silvered lantern :changed to [[Baka]]", "$$ Silvered lantern :changed to the party"];
const ITEMS = `${CAMPAIGN}/Items`;

function lastWrite(fake: FakeItemNotes) {
  const [last] = [...fake.propertiesWritten].reverse();
  return last;
}

async function opened(lines: string[], notes: ItemNote[] = [], folderThere = true) {
  const sessions = new FakeVault([{ path: SESSION, text: lines.join("\n") }]);
  const store = new CampaignStore(sessions.vault);
  const fake = new FakeItemNotes(notes);
  if (!folderThere) fake.foldersThere.delete(ITEMS);
  const itemNotes = new ItemNotes(fake.needsFor(store));
  await store.open(CAMPAIGN);
  itemNotes.start();
  await settle();
  return { fake, itemNotes, store };
}

describe("ItemNotes making a note", () => {
  it("makes an item's note when a save leaves it named on three lines, with its holder and every line", async () => {
    const { fake, itemNotes } = await opened(THREE_LINES);
    itemNotes.sessionSaved();
    await settle();
    expect(fake.propertiesWritten).toEqual([
      {
        path: LANTERN,
        properties: { holder: "The party", lines: ["$ [[Mira]] Silvered lantern", "$$ Silvered lantern :changed to [[Baka]]", "$$ Silvered lantern :changed to the party"] },
      },
    ]);
  });

  it("makes no note for an item named on two lines", async () => {
    const { fake, itemNotes } = await opened(["$ Rope", "$ Rope"]);
    itemNotes.sessionSaved();
    await settle();
    expect(fake.propertiesWritten).toEqual([]);
    expect(fake.foldersMade).toEqual([]);
  });

  it("makes no note when a session is only read, not saved here", async () => {
    const { fake } = await opened(THREE_LINES);
    expect(fake.propertiesWritten).toEqual([]);
  });

  it("makes the Items folder first when it isn't there, and not when it is", async () => {
    const without = await opened(THREE_LINES, [], false);
    without.itemNotes.sessionSaved();
    await settle();
    expect(without.fake.foldersMade).toEqual([ITEMS]);
    const withFolder = await opened(THREE_LINES);
    withFolder.itemNotes.sessionSaved();
    await settle();
    expect(withFolder.fake.foldersMade).toEqual([]);
  });

  it("makes a note only once when a session is saved again while the note is still being made", async () => {
    const { fake, itemNotes } = await opened(THREE_LINES);
    const release = fake.holdCreates();
    itemNotes.sessionSaved();
    itemNotes.sessionSaved();
    release();
    await settle();
    expect(fake.createCalls).toBe(1);
  });

  it("gives an existing note its lines and keeps its holder and its other properties", async () => {
    const { fake, itemNotes } = await opened(THREE_LINES, [{ path: LANTERN, properties: { holder: "The party", tags: ["pale"] } }]);
    itemNotes.sessionSaved();
    await settle();
    const last = lastWrite(fake);
    expect(last?.properties).toEqual({
      holder: "The party",
      tags: ["pale"],
      lines: ["$ [[Mira]] Silvered lantern", "$$ Silvered lantern :changed to [[Baka]]", "$$ Silvered lantern :changed to the party"],
    });
  });

  it("gives an existing note its lines even when its item is named on fewer than three", async () => {
    const { fake, itemNotes } = await opened(["$ Rope"], [{ path: ROPE, properties: { holder: "The party" } }]);
    itemNotes.sessionSaved();
    await settle();
    expect(lastWrite(fake)?.properties).toEqual({ holder: "The party", lines: ["$ Rope"] });
  });

  it("doesn't touch an existing note's lines when a change merely arrives without a save here", async () => {
    const { fake, store } = await opened(["$ Rope"], [{ path: ROPE, properties: { holder: "The party", lines: ["$ Old"] } }]);
    store.noteChanged(SESSION, "$ Rope\n$ Rope");
    await settle();
    expect(fake.propertiesWritten).toEqual([]);
  });

  it("doesn't write lines it was given by a save again when a later change arrives without a save here", async () => {
    const { fake, itemNotes, store } = await opened(["$ Rope"], [{ path: ROPE, properties: {} }]);
    itemNotes.sessionSaved();
    await settle();
    Object.assign(fake.propertiesOf(ROPE) as object, { lines: ["$ Edited elsewhere"] });
    const written = fake.propertiesWritten.length;
    store.noteChanged(SESSION, "$ Rope\n$ Rope");
    await settle();
    expect(fake.propertiesWritten).toHaveLength(written);
  });

  it("doesn't write lines a save found already in the note when a later change arrives without a save here", async () => {
    const { fake, itemNotes, store } = await opened(["$ Rope"], [{ path: ROPE, properties: { holder: "The party", lines: ["$ Rope"] } }]);
    itemNotes.sessionSaved();
    await settle();
    Object.assign(fake.propertiesOf(ROPE) as object, { lines: ["$ Edited elsewhere"] });
    store.noteChanged(SESSION, "$ Rope\n$ Rope");
    await settle();
    expect(fake.propertiesWritten).toEqual([]);
  });

  it("writes no lines again once they were written and no later save changes them", async () => {
    const { fake, itemNotes, store } = await opened(["$ Rope"], [{ path: ROPE, properties: {} }]);
    itemNotes.sessionSaved();
    await settle();
    const written = fake.propertiesWritten.length;
    store.noteChanged(SESSION, "$ Rope");
    await settle();
    expect(fake.propertiesWritten).toHaveLength(written);
  });
});

describe("ItemNotes while the campaign is still opening", () => {
  it("plans nothing from a campaign not yet built, whether a session was saved or the notes of earlier sessions are made", async () => {
    const sessions = new FakeVault([{ path: SESSION, text: THREE_LINES.join("\n") }]);
    const built = new CampaignStore(sessions.vault);
    await built.open(CAMPAIGN);
    const store = { current: built.current, campaignFolder: CAMPAIGN, sessionNotes: built.sessionNotes, opening: true, subscribe: () => () => {} };
    const fake = new FakeItemNotes([]);
    const itemNotes = new ItemNotes(fake.needsFor(store));
    itemNotes.sessionSaved();
    await expect(itemNotes.makeMissing()).resolves.toEqual({ made: 0, failed: 0 });
    await settle();
    expect(fake.createCalls).toBe(0);
  });
});

describe("ItemNotes making the notes of earlier sessions", () => {
  it("makes no note for an item named on two lines, whatever the opening finds", async () => {
    const { fake, itemNotes } = await opened(["$ Rope", "$ Rope"]);
    await expect(itemNotes.makeMissing()).resolves.toEqual({ made: 0, failed: 0 });
    expect(fake.createCalls).toBe(0);
  });

  it("makes the missing notes of items on three lines, and says how many", async () => {
    const { fake, itemNotes } = await opened(THREE_LINES);
    await expect(itemNotes.makeMissing()).resolves.toEqual({ made: 1, failed: 0 });
    expect(fake.propertiesWritten.map((write) => write.path)).toEqual([LANTERN]);
  });

  it("leaves a note that is already there as it is", async () => {
    const { fake, itemNotes } = await opened(THREE_LINES, [{ path: LANTERN, properties: { holder: "The party", lines: ["$ Old"] } }]);
    const before = fake.propertiesWritten.length;
    await expect(itemNotes.makeMissing()).resolves.toEqual({ made: 0, failed: 0 });
    expect(fake.propertiesWritten).toHaveLength(before);
  });

  it("finds an existing note in a folder inside Items, so makes no second note", async () => {
    const { fake, itemNotes } = await opened(THREE_LINES, [{ path: `${ITEMS}/Lights/silvered lantern.md`, properties: { holder: "The party" } }]);
    await expect(itemNotes.makeMissing()).resolves.toEqual({ made: 0, failed: 0 });
    expect(fake.foldersMade).toEqual([]);
  });

  it("makes nothing while no campaign is open", async () => {
    const { itemNotes, store } = await opened(THREE_LINES);
    store.close();
    await expect(itemNotes.makeMissing()).resolves.toEqual({ made: 0, failed: 0 });
  });
});

describe("ItemNotes naming a note", () => {
  const RING = `${ITEMS}/Ring- +1.md`;
  const RING_LINES = ["$ Ring: +1", "$ Ring: +1", "$ Ring: +1"];

  it("makes a note for a name with a forbidden character under the swapped name and keeps the real name in aliases", async () => {
    const { fake, itemNotes } = await opened(RING_LINES);
    itemNotes.sessionSaved();
    await settle();
    expect(fake.propertiesWritten).toEqual([{ path: RING, properties: { holder: "The party", lines: RING_LINES, aliases: ["Ring: +1"] } }]);
  });

  it("makes a note named exactly as an item with a plus sign is", async () => {
    const { fake, itemNotes } = await opened(["$ Ring+1", "$ Ring+1", "$ Ring+1"]);
    itemNotes.sessionSaved();
    await settle();
    expect(fake.propertiesWritten.map((write) => write.path)).toEqual([`${ITEMS}/Ring+1.md`]);
    expect(firstOf(fake.propertiesWritten).properties).not.toHaveProperty("aliases");
  });

  it("adds the real name to the aliases an existing note already has, and keeps them", async () => {
    const { fake, itemNotes } = await opened(RING_LINES, [{ path: RING, properties: { holder: "The party", aliases: ["The Ring"] } }]);
    itemNotes.sessionSaved();
    await settle();
    expect(lastWrite(fake)?.properties.aliases).toEqual(["The Ring", "Ring: +1"]);
  });

  it("says once that an item named on three lines can't have a note when its name can't be a file name", async () => {
    const { fake, itemNotes } = await opened(["$ Staff.", "$ Staff.", "$ Staff."]);
    itemNotes.sessionSaved();
    itemNotes.sessionSaved();
    await settle();
    expect(fake.said).toHaveLength(1);
    expect(firstOf(fake.said)).toContain("No note was made for the item Staff.");
    expect(fake.propertiesWritten).toEqual([]);
  });

  it("gives two item names that swap to one file name one note, says why the second has none, and says it once", async () => {
    const lines = [...RING_LINES, "$ Ring? +1", "$ Ring? +1", "$ Ring? +1"];
    const { fake, itemNotes } = await opened(lines);
    itemNotes.sessionSaved();
    itemNotes.sessionSaved();
    await settle();
    expect(fake.propertiesWritten.map((write) => write.path)).toEqual([RING]);
    expect(fake.said).toHaveLength(1);
    expect(firstOf(fake.said)).toContain("Ring? +1");
  });

  it("says that the second name has no note when the earlier notes are made at the opening too", async () => {
    const lines = [...RING_LINES, "$ Ring? +1", "$ Ring? +1", "$ Ring? +1"];
    const { fake, itemNotes } = await opened(lines);
    await expect(itemNotes.makeMissing()).resolves.toEqual({ made: 1, failed: 0 });
    expect(fake.said).toHaveLength(1);
  });

  it("says a note couldn't be made, once, and doesn't try again until its lines change", async () => {
    const { fake, itemNotes } = await opened(THREE_LINES);
    fake.failNextCreate = new Error("disk full");
    itemNotes.sessionSaved();
    await settle();
    itemNotes.sessionSaved();
    await settle();
    expect(fake.failures).toHaveLength(1);
    expect(fake.createCalls).toBe(1);
  });

  it("tries a note again once its lines have changed, and makes it if the write works then", async () => {
    const { fake, itemNotes, store } = await opened(THREE_LINES);
    fake.failNextCreate = new Error("disk full");
    itemNotes.sessionSaved();
    await settle();
    fake.failNextCreate = null;
    store.noteChanged(SESSION, [...THREE_LINES, "$$ Silvered lantern :used"].join("\n"));
    itemNotes.sessionSaved();
    await settle();
    expect(fake.createCalls).toBe(2);
    expect(lastWrite(fake)?.path).toBe(LANTERN);
  });

  it("takes the empty note away again when its properties couldn't be written, so no empty item note is left", async () => {
    const { fake, itemNotes } = await opened(THREE_LINES);
    fake.failProperties = new Error("disk full");
    itemNotes.sessionSaved();
    await settle();
    expect(fake.trashed).toEqual([LANTERN]);
    expect(fake.failures).toHaveLength(1);
    const again = await opened(THREE_LINES);
    again.fake.failProperties = new Error("disk full");
    await expect(again.itemNotes.makeMissing()).resolves.toEqual({ made: 0, failed: 1 });
  });

  it("leaves a note as it is and says so when his words change while its properties are written", async () => {
    const { fake, itemNotes } = await opened(["$ Rope"], [{ path: ROPE, properties: { holder: "The party" } }]);
    fake.wordsChangeOnWrite = true;
    itemNotes.sessionSaved();
    await settle();
    expect(String(firstOf(fake.failures))).toContain("its own words changed");
  });
});
