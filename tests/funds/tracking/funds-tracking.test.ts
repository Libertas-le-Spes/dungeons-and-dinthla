import { beforeEach, describe, expect, it } from "vitest";
import type { App, TFile } from "obsidian";
import { FundsTracking, ITEM_GONE, NO_SESSION, NOT_AS_IMPORTED, NOT_IN_A_CAMPAIGN, NOT_INERT_ON_PAGE, NOT_THE_SHOWN_CAMPAIGN } from "../../../src/funds/tracking/funds-tracking";
import { heldByNamesakeWords, heldByWords } from "../../../src/funds/tracking/items-look";
import { SESSIONS_SHARE_A_NUMBER } from "../../../src/campaign/paths/session-to-write";
import { sessionGoneWords } from "../../../src/campaign/paths/session-gone";
import type { CampaignStore } from "../../../src/campaign/reading/campaign-store";
import { ALREADY_ON_FUNDS_PAGE, NOT_READ_AS_THE_ITEM } from "../../../src/funds/tracking/tracking-refusal";
import { TrackItemModal, TRACK_TITLE } from "../../../src/funds/tracking/track-item-modal";
import { ItemModal } from "../../../src/funds/items/item-modal";
import type { ItemEdit } from "../../../src/funds/items/item-plan";
import { DialogCampaign, lastDialog } from "../../campaign/dialog-campaign";
import { Modal, Notice, openedModals } from "../../stubs/obsidian";

const ONE = "Pale Moon/Sessions/Session 1.md";
const TWO = "Pale Moon/Sessions/Session 2.md";
const PRIMARY = { path: "Pale Moon/Characters/Primary Monk.md", basename: "Primary Monk" } as TFile;
const ELSEWHERE = { path: "Ashen Road/Characters/Primary Monk.md", basename: "Primary Monk" } as TFile;
const LOOSE = { path: "Loose notes/Primary Monk.md", basename: "Primary Monk" } as TFile;
const PEOPLE_PRIMARY = "People/Primary Monk.md";

const app = {} as App;

interface TrackShownDialog {
  shown: { name: string; holder: string; writesTo: string; line: string };
  saving: { save(): Promise<boolean> };
}

interface ItemDialog {
  edit: ItemEdit;
}

function campaignFolders(): string[] {
  return ["Pale Moon", "Ashen Road"];
}

function trackingIn(campaign: DialogCampaign, store: CampaignStore = campaign.store): FundsTracking {
  campaign.addCharacterNote(PRIMARY.path);
  campaign.addCharacterNote("Pale Moon/Characters/Secondary.md");
  return new FundsTracking(app, campaign.gate, store, campaignFolders);
}

function lookOf(campaign: DialogCampaign, written: string[]) {
  const look = trackingIn(campaign).lookAt(PRIMARY, written);
  if (look === null) throw new Error("No look for the campaign shown.");
  return look;
}

function heldNames(campaign: DialogCampaign, written: string[]): string[] {
  const names: string[] = [];
  for (const item of lookOf(campaign, written).heldButNotImported()) names.push(item.shown);
  return names;
}

function noFocus(): void {}

function itemsHeldBy(campaign: DialogCampaign, holder: string): string[] {
  const names: string[] = [];
  for (const item of campaign.current.items) {
    if (item.gone === null && item.holder === holder) names.push(item.name);
  }
  return names;
}

beforeEach(() => {
  Notice.shown = [];
  openedModals.length = 0;
});

describe("Track on the funds page", () => {
  it("opens the track dialog for the item, held by the character, writing into the latest session", () => {
    const campaign = new DialogCampaign({ [ONE]: "We met.\n", [TWO]: "We camped.\n" });
    trackingIn(campaign).track(PRIMARY, { written: "Rope", count: null }, noFocus);
    const dialog = lastDialog<TrackShownDialog>();
    expect(dialog).toBeInstanceOf(TrackItemModal);
    expect(dialog.shown).toEqual({ name: "Rope", holder: "Primary Monk", writesTo: "Session 2", line: "$ [[Primary Monk]] Rope" });
  });

  it("adds one $ line for the item, held by him, and nothing else", async () => {
    const campaign = new DialogCampaign({ [ONE]: "We met.\n", [TWO]: "We camped.\n" });
    trackingIn(campaign).track(PRIMARY, { written: "Rope", count: null }, noFocus);
    expect(await lastDialog<TrackShownDialog>().saving.save()).toBe(true);
    expect(campaign.texts.get(TWO)).toBe("We camped.\n$ [[Primary Monk]] Rope\n");
    expect(campaign.texts.get(ONE)).toBe("We met.\n");
    campaign.readAgain();
    expect(itemsHeldBy(campaign, "Primary Monk")).toEqual(["Rope"]);
  });

  it("writes the count the sheet shows after the item, and the funds page then holds that many", async () => {
    const campaign = new DialogCampaign({ [ONE]: "We camped.\n" });
    trackingIn(campaign).track(PRIMARY, { written: "Dagger", count: "5" }, noFocus);
    expect(lastDialog<TrackShownDialog>().shown.line).toBe("$ [[Primary Monk]] Dagger x5");
    expect(await lastDialog<TrackShownDialog>().saving.save()).toBe(true);
    expect(campaign.texts.get(ONE)).toBe("We camped.\n$ [[Primary Monk]] Dagger x5\n");
    campaign.readAgain();
    expect(campaign.current.items.map((item) => [item.name, item.held])).toEqual([["Dagger", 5]]);
  });

  it.each([["1"], ["?"], ["0"], ["10000"], [null]])("writes no count for a sheet count of %j", (count) => {
    const campaign = new DialogCampaign({ [ONE]: "We camped.\n" });
    trackingIn(campaign).track(PRIMARY, { written: "Dagger", count }, noFocus);
    expect(lastDialog<TrackShownDialog>().shown.line).toBe("$ [[Primary Monk]] Dagger");
  });

  it("shows the item's name without the note's escapes, and writes it with them", async () => {
    const campaign = new DialogCampaign({ [ONE]: "We camped.\n" });
    trackingIn(campaign).track(PRIMARY, { written: "Rope\\_coil", count: null }, noFocus);
    const dialog = lastDialog<TrackShownDialog>();
    expect(dialog.shown.name).toBe("Rope_coil");
    await dialog.saving.save();
    expect(campaign.texts.get(ONE)).toBe("We camped.\n$ [[Primary Monk]] Rope\\_coil\n");
  });

  it("refuses an item already on the funds page, and writes nothing", async () => {
    const campaign = new DialogCampaign({ [ONE]: "$ [[Secondary]] rope\n" });
    trackingIn(campaign).track(PRIMARY, { written: "Rope", count: null }, noFocus);
    await expect(lastDialog<TrackShownDialog>().saving.save()).rejects.toThrow(ALREADY_ON_FUNDS_PAGE);
    expect(campaign.writes).toBe(0);
  });

  it("refuses a name the ledger would read as coin, and writes nothing", async () => {
    const campaign = new DialogCampaign({ [ONE]: "We camped.\n" });
    trackingIn(campaign).track(PRIMARY, { written: "Pouch 10 gp", count: null }, noFocus);
    await expect(lastDialog<TrackShownDialog>().saving.save()).rejects.toThrow(NOT_READ_AS_THE_ITEM);
    expect(campaign.writes).toBe(0);
  });

  it.each(["Rope #loot", "Bag:: x", "Rope ==mark==", "r".repeat(101)])("refuses %s, which isn't as the import writes a line, with no dialog", function notImported(written: string): void {
    const campaign = new DialogCampaign({ [ONE]: "We camped.\n" });
    trackingIn(campaign).track(PRIMARY, { written: written, count: null }, noFocus);
    expect(Notice.shown).toEqual([NOT_AS_IMPORTED]);
    expect(openedModals).toHaveLength(0);
  });

  it("says to start a session first, with no dialog, when the campaign has none", () => {
    const campaign = new DialogCampaign({});
    trackingIn(campaign).track(PRIMARY, { written: "Rope", count: null }, noFocus);
    expect(Notice.shown).toEqual([NO_SESSION]);
    expect(openedModals).toHaveLength(0);
  });

  it("says so, with no dialog, when two sessions share the latest number", () => {
    const campaign = new DialogCampaign({ [ONE]: "We met.\n", [TWO]: "We camped.\n", "Pale Moon/Sessions/Session 02.md": "We rode.\n" });
    trackingIn(campaign).track(PRIMARY, { written: "Rope", count: null }, noFocus);
    expect(Notice.shown).toEqual([SESSIONS_SHARE_A_NUMBER]);
    expect(openedModals).toHaveLength(0);
  });

  it("writes nothing when the session was moved between opening the dialog and Save", async () => {
    const campaign = new DialogCampaign({ [ONE]: "We met.\n", [TWO]: "We camped.\n" });
    trackingIn(campaign).track(PRIMARY, { written: "Rope", count: null }, noFocus);
    campaign.moveNote(TWO, "Pale Moon/Sessions/Session 3.md");
    await expect(lastDialog<TrackShownDialog>().saving.save()).rejects.toThrow(sessionGoneWords(TWO));
    expect(campaign.writes).toBe(0);
  });

  it("checks the note as it is when it writes, so an item added since it was read isn't added twice", async () => {
    const campaign = new DialogCampaign({ [ONE]: "We camped.\n" });
    trackingIn(campaign).track(PRIMARY, { written: "Rope", count: null }, noFocus);
    campaign.texts.set(ONE, "We camped.\n$ [[Secondary]] Rope\n");
    await expect(lastDialog<TrackShownDialog>().saving.save()).rejects.toThrow(ALREADY_ON_FUNDS_PAGE);
    expect(campaign.texts.get(ONE)).toBe("We camped.\n$ [[Secondary]] Rope\n");
  });

  it("tracks again an item that was used, sold or lost, held by him from then on", async () => {
    const campaign = new DialogCampaign({ [ONE]: "$ [[Primary Monk]] Rope\n$$ Rope :sold\n" });
    trackingIn(campaign).track(PRIMARY, { written: "Rope", count: null }, noFocus);
    expect(await lastDialog<TrackShownDialog>().saving.save()).toBe(true);
    campaign.readAgain();
    expect(itemsHeldBy(campaign, "Primary Monk")).toEqual(["Rope"]);
  });

  it("refuses to track again a sold item the table wrote with active text, writing nothing and opening no dialog", () => {
    const campaign = new DialogCampaign({ [ONE]: "$ [[Secondary]] Rope (50 ft) *silk*\n$$ Rope (50 ft) *silk* :sold\n" });
    trackingIn(campaign).track(PRIMARY, { written: "Rope (50 ft) \\*silk\\*", count: null }, noFocus);
    expect(Notice.shown).toEqual([NOT_INERT_ON_PAGE]);
    expect(openedModals).toHaveLength(0);
    expect(campaign.writes).toBe(0);
  });

  it("refuses to track again a sold item the table tagged, though the import's line is inert", () => {
    const campaign = new DialogCampaign({ [ONE]: "$ [[Secondary]] Rope #loot\n$$ Rope #loot :sold\n" });
    trackingIn(campaign).track(PRIMARY, { written: "Rope \\#loot", count: null }, noFocus);
    expect(Notice.shown).toEqual([NOT_INERT_ON_PAGE]);
    expect(openedModals).toHaveLength(0);
  });

  it("tracks again a sold item the table wrote as the import would, showing the line it writes", async () => {
    const campaign = new DialogCampaign({ [ONE]: "$ [[Secondary]] Rope (50 ft) \\*silk\\*\n$$ Rope (50 ft) \\*silk\\* :sold\n" });
    trackingIn(campaign).track(PRIMARY, { written: "Rope (50 ft) \\*silk\\*", count: null }, noFocus);
    expect(lastDialog<TrackShownDialog>().shown.line).toBe("$ [[Primary Monk]] Rope (50 ft) \\*silk\\*");
    expect(await lastDialog<TrackShownDialog>().saving.save()).toBe(true);
    campaign.readAgain();
    expect(campaign.current.items).toHaveLength(1);
  });

  it("tracks again a sold item the table linked under its link, so the funds page keeps one item", async () => {
    const campaign = new DialogCampaign({ [ONE]: "$ [[Secondary]] [[Rope]]\n$$ Rope :sold\n" });
    trackingIn(campaign).track(PRIMARY, { written: "Rope", count: null }, noFocus);
    expect(lastDialog<TrackShownDialog>().shown.line).toBe("$ [[Primary Monk]] [[Rope]]");
    expect(await lastDialog<TrackShownDialog>().saving.save()).toBe(true);
    expect(campaign.texts.get(ONE)).toBe("$ [[Secondary]] [[Rope]]\n$$ Rope :sold\n$ [[Primary Monk]] [[Rope]]\n");
    campaign.readAgain();
    expect(campaign.current.items).toHaveLength(1);
    expect(itemsHeldBy(campaign, "Primary Monk")).toEqual(["Rope"]);
  });

  it("doesn't add an item held at the table again under the name the import escaped", async () => {
    const campaign = new DialogCampaign({ [ONE]: "$ [[Primary Monk]] Rope (50 ft) \\*silk\\*\n" });
    trackingIn(campaign).track(PRIMARY, { written: "Rope (50 ft) \\*silk\\*", count: null }, noFocus);
    await expect(lastDialog<TrackShownDialog>().saving.save()).rejects.toThrow(ALREADY_ON_FUNDS_PAGE);
    expect(campaign.writes).toBe(0);
  });

  it("says to show the campaign first, with no dialog, when no campaign is shown", () => {
    const campaign = new DialogCampaign({ [ONE]: "We camped.\n" });
    const store = { ...campaign.store, campaignFolder: null } as CampaignStore;
    trackingIn(campaign, store).track(PRIMARY, { written: "Rope", count: null }, noFocus);
    expect(Notice.shown).toEqual([NOT_THE_SHOWN_CAMPAIGN]);
    expect(openedModals).toHaveLength(0);
  });

  it("says a character in no campaign can't be tracked, rather than to show its campaign", () => {
    const campaign = new DialogCampaign({ [ONE]: "We camped.\n" });
    const tracking = trackingIn(campaign);
    tracking.track(LOOSE, { written: "Rope", count: null }, noFocus);
    expect(Notice.shown).toEqual([NOT_IN_A_CAMPAIGN]);
    expect(tracking.whyNotTracked(LOOSE)).toBe(NOT_IN_A_CAMPAIGN);
    expect(tracking.whyNotTracked(ELSEWHERE)).toBe(NOT_THE_SHOWN_CAMPAIGN);
  });

  it("refuses, in words and with no dialog, a character outside the campaign shown", () => {
    const campaign = new DialogCampaign({ [ONE]: "We camped.\n" });
    trackingIn(campaign).track(ELSEWHERE, { written: "Rope", count: null }, noFocus);
    expect(Notice.shown).toEqual([NOT_THE_SHOWN_CAMPAIGN]);
    expect(openedModals).toHaveLength(0);
  });

  it("hands the focus back when the dialog closes", () => {
    const campaign = new DialogCampaign({ [ONE]: "We camped.\n" });
    const returned: string[] = [];
    trackingIn(campaign).track(PRIMARY, { written: "Rope", count: null }, function focusBack(): void {
      returned.push("focus");
    });
    lastDialog<TrackItemModal>().close();
    expect(returned).toEqual(["focus"]);
  });
});

describe("what the funds page says about an imported list", () => {
  it("is nothing for a character outside the campaign shown", () => {
    const campaign = new DialogCampaign({ [ONE]: "$ [[Primary Monk]] Rope\n" });
    expect(trackingIn(campaign).lookAt(ELSEWHERE, ["Rope"])).toBeNull();
  });

  it("says where each line stands on the funds page, by name with any capitals and spaces", () => {
    const campaign = new DialogCampaign({ [ONE]: "$ [[Primary Monk]] rope\n$ Lantern\n$ Potion\n$ Map\n$ Torch\n$$ Lantern :sold\n$$ Potion :used\n$$ Map :lost\n" });
    const look = trackingIn(campaign).lookAt(PRIMARY, []);
    if (look === null) throw new Error("No look for the campaign shown.");
    expect(look.standingOf("Rope")).toBe("On the funds page");
    expect(look.standingOf("Lantern")).toBe("Sold, on the funds page");
    expect(look.standingOf("Potion")).toBe("Used up, on the funds page");
    expect(look.standingOf("Map")).toBe("Lost, on the funds page");
    expect(look.standingOf("Torch  ")).toBe("On the funds page");
    expect(look.standingOf("Shield")).toBeNull();
  });

  it("says who holds an item of the same name held by someone else, and offers no tracking for it", () => {
    const look = lookOf(new DialogCampaign({ [ONE]: "$ [[Secondary]] Rope\n" }), ["Rope"]);
    expect(look.standingOf("Rope")).toBe(heldByWords("Secondary"));
    expect(heldByWords("Secondary")).toBe("Held by Secondary, on the funds page");
    expect(look.canTrack("Rope")).toBe(false);
  });

  it("says an item is held by another note of the character's name, not by him, and offers no tracking for it", () => {
    const campaign = new DialogCampaign({ [ONE]: "$ [[People/primary monk]] Cloak\n$ Lantern\n$$ Lantern :changed to Primary Monk\n" });
    campaign.addCharacterNote(PEOPLE_PRIMARY);
    const look = lookOf(campaign, ["Cloak", "Lantern"]);
    expect(look.standingOf("Cloak")).toBe(heldByNamesakeWords("primary monk"));
    expect(heldByNamesakeWords("Primary Monk")).toBe("Held by another note named Primary Monk, on the funds page");
    expect(look.canTrack("Cloak")).toBe(false);
    expect(look.standingOf("Lantern")).toBe(heldByWords("Primary Monk"));
  });

  it("says plainly who holds an item when the holder's link of the character's name leads to no note", () => {
    const look = lookOf(new DialogCampaign({ [ONE]: "$ [[People/Primary Monk]] Cloak\n" }), ["Cloak"]);
    expect(look.standingOf("Cloak")).toBe(heldByWords("Primary Monk"));
  });

  it("offers tracking again for an item gone from the funds page, saying how it went", () => {
    const look = lookOf(new DialogCampaign({ [ONE]: "$ [[Primary Monk]] Rope\n$$ Rope :sold\n" }), ["Rope"]);
    expect(look.standingOf("Rope")).toBe("Sold, on the funds page");
    expect(look.canTrack("Rope")).toBe(true);
  });

  it("takes a name typed at the table and the import's escaped name for one item: no Track, no mark", () => {
    const campaign = new DialogCampaign({ [ONE]: "$ [[Primary Monk]] Rope (50 ft) *silk*\n" });
    const imported = "Rope (50 ft) \\*silk\\*";
    const look = lookOf(campaign, [imported]);
    expect(look.standingOf(imported)).toBe("On the funds page");
    expect(look.canTrack(imported)).toBe(false);
    expect(look.heldButNotImported()).toEqual([]);
  });

  it("shows a marked item's name without the note's escapes", () => {
    expect(heldNames(new DialogCampaign({ [ONE]: "$ [[Primary Monk]] Rope\\_coil\n" }), [])).toEqual(["Rope_coil"]);
  });

  it("marks an item by the note its holder link leads to, not by the holder's name", () => {
    const campaign = new DialogCampaign({ [ONE]: "$ [[People/Primary Monk]] Cloak\n$ [[Pale Moon/Characters/Primary Monk]] Dagger\n" });
    campaign.addCharacterNote(PEOPLE_PRIMARY);
    expect(heldNames(campaign, [])).toEqual(["Dagger"]);
  });

  it("lists only the items he holds that the import doesn't have", () => {
    const campaign = new DialogCampaign({ [ONE]: "$ [[Primary Monk]] Rope\n$ [[Primary Monk]] Dagger\n$ [[primary monk]] Cloak\n$ [[Secondary]] Shield\n$ [[Primary Monk]] Map\n$$ Map :lost\n" });
    expect(heldNames(campaign, ["rope"])).toEqual(["Dagger", "Cloak"]);
  });
});

describe("a choice for an item held but not imported", () => {
  it("opens the existing item dialog with that choice, writing nothing yet", () => {
    const campaign = new DialogCampaign({ [ONE]: "$ [[Primary Monk]] Dagger\n" });
    trackingIn(campaign).settle(PRIMARY, "Dagger", "sold", noFocus);
    const dialog = lastDialog<ItemDialog>();
    expect(dialog).toBeInstanceOf(ItemModal);
    expect(dialog.edit.status).toBe("sold");
    expect(campaign.writes).toBe(0);
  });

  it("opens it as it is for Changed", () => {
    const campaign = new DialogCampaign({ [ONE]: "$ [[Primary Monk]] Dagger\n" });
    trackingIn(campaign).settle(PRIMARY, "Dagger", "held", noFocus);
    expect(lastDialog<ItemDialog>().edit).toMatchObject({ status: "held", holder: "[[Primary Monk]]" });
  });

  it("refuses, with no dialog, for a character outside the campaign shown", () => {
    const campaign = new DialogCampaign({ [ONE]: "$ [[Primary Monk]] Dagger\n" });
    trackingIn(campaign).settle(ELSEWHERE, "Dagger", "sold", noFocus);
    expect(Notice.shown).toEqual([NOT_THE_SHOWN_CAMPAIGN]);
    expect(openedModals).toHaveLength(0);
  });

  it("says so, with no dialog, when the item has gone from the funds page", () => {
    const campaign = new DialogCampaign({ [ONE]: "We camped.\n" });
    trackingIn(campaign).settle(PRIMARY, "Dagger", "lost", noFocus);
    expect(Notice.shown).toEqual([ITEM_GONE]);
    expect(openedModals).toHaveLength(0);
  });
});

describe("the track dialog", () => {
  it("is titled, names the item, its holder and where it writes", () => {
    const campaign = new DialogCampaign({ [ONE]: "We camped.\n" });
    trackingIn(campaign).track(PRIMARY, { written: "Rope", count: null }, noFocus);
    const dialog = lastDialog<TrackItemModal>();
    expect(titleOf(dialog)).toBe(TRACK_TITLE);
    const texts: (string | null)[] = [];
    for (const line of dialog.contentEl.querySelectorAll("p")) texts.push(line.textContent);
    expect(texts).toEqual(["Rope", "Held by Primary Monk", "Adds this line to Session 1:", "$ [[Primary Monk]] Rope"]);
  });
});

function titleOf(dialog: TrackItemModal): string {
  if (!(dialog instanceof Modal)) throw new Error("The dialog isn't a modal.");
  return dialog.title;
}

function buttonSaying(root: HTMLElement, words: string): HTMLButtonElement {
  for (const button of root.querySelectorAll<HTMLButtonElement>("button")) {
    if (button.textContent === words) return button;
  }
  throw new Error(`No button says ${words}.`);
}

describe("the track dialog's buttons", () => {
  it("write on Save, then close", async () => {
    const campaign = new DialogCampaign({ [ONE]: "We camped.\n" });
    const closed: string[] = [];
    trackingIn(campaign).track(PRIMARY, { written: "Rope", count: null }, function focusBack(): void {
      closed.push("closed");
    });
    const dialog = lastDialog<TrackItemModal>();
    buttonSaying(dialog.contentEl, "Save").click();
    await dialog.changeSettled();
    expect(closed).toEqual(["closed"]);
    expect(campaign.texts.get(ONE)).toBe("We camped.\n$ [[Primary Monk]] Rope\n");
  });

  it("write nothing on Cancel, and close", () => {
    const campaign = new DialogCampaign({ [ONE]: "We camped.\n" });
    const closed: string[] = [];
    trackingIn(campaign).track(PRIMARY, { written: "Rope", count: null }, function focusBack(): void {
      closed.push("closed");
    });
    buttonSaying(lastDialog<TrackItemModal>().contentEl, "Cancel").click();
    expect(closed).toEqual(["closed"]);
    expect(campaign.writes).toBe(0);
  });

  it("say why in a notice and stay open when the save is refused", async () => {
    const campaign = new DialogCampaign({ [ONE]: "$ Rope\n" });
    const closed: string[] = [];
    trackingIn(campaign).track(PRIMARY, { written: "Rope", count: null }, function focusBack(): void {
      closed.push("closed");
    });
    const dialog = lastDialog<TrackItemModal>();
    buttonSaying(dialog.contentEl, "Save").click();
    await dialog.changeSettled();
    expect(Notice.shown).toEqual([`Couldn't track the item: ${ALREADY_ON_FUNDS_PAGE}`]);
    expect(closed).toEqual([]);
  });
});
