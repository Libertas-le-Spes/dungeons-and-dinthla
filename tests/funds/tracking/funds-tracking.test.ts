import { beforeEach, describe, expect, it } from "vitest";
import type { App, TFile } from "obsidian";
import { FundsTracking, ITEM_GONE, NOT_THE_SHOWN_CAMPAIGN } from "../../../src/funds/tracking/funds-tracking";
import { ALREADY_ON_FUNDS_PAGE, NOT_READ_AS_THE_ITEM } from "../../../src/funds/tracking/tracking-refusal";
import { TrackItemModal, TRACK_TITLE } from "../../../src/funds/tracking/track-item-modal";
import { ItemModal } from "../../../src/funds/items/item-modal";
import type { ItemEdit } from "../../../src/funds/items/item-plan";
import { DialogCampaign, lastDialog } from "../../campaign/dialog-campaign";
import { Notice, openedModals } from "../../stubs/obsidian";

const ONE = "Pale Moon/Sessions/Session 1.md";
const TWO = "Pale Moon/Sessions/Session 2.md";
const PRIMARY = { path: "Pale Moon/Characters/Primary Monk.md", basename: "Primary Monk" } as TFile;
const ELSEWHERE = { path: "Ashen Road/Characters/Primary Monk.md", basename: "Primary Monk" } as TFile;

const app = {} as App;

interface TrackShownDialog {
  shown: { name: string; holder: string; writesTo: string };
  saving: { save(): Promise<boolean> };
}

interface ItemDialog {
  edit: ItemEdit;
}

function trackingIn(campaign: DialogCampaign): FundsTracking {
  return new FundsTracking(app, campaign.gate, campaign.store);
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
    trackingIn(campaign).track(PRIMARY, "Rope", noFocus);
    const dialog = lastDialog<TrackShownDialog>();
    expect(dialog).toBeInstanceOf(TrackItemModal);
    expect(dialog.shown).toEqual({ name: "Rope", holder: "Primary Monk", writesTo: "Session 2" });
  });

  it("adds one $ line for the item, held by him, and nothing else", async () => {
    const campaign = new DialogCampaign({ [ONE]: "We met.\n", [TWO]: "We camped.\n" });
    trackingIn(campaign).track(PRIMARY, "Rope", noFocus);
    expect(await lastDialog<TrackShownDialog>().saving.save()).toBe(true);
    expect(campaign.texts.get(TWO)).toBe("We camped.\n$ [[Primary Monk]] Rope\n");
    expect(campaign.texts.get(ONE)).toBe("We met.\n");
    campaign.readAgain();
    expect(itemsHeldBy(campaign, "Primary Monk")).toEqual(["Rope"]);
  });

  it("shows the item's name without the note's escapes, and writes it with them", async () => {
    const campaign = new DialogCampaign({ [ONE]: "We camped.\n" });
    trackingIn(campaign).track(PRIMARY, "Rope\\_coil", noFocus);
    const dialog = lastDialog<TrackShownDialog>();
    expect(dialog.shown.name).toBe("Rope_coil");
    await dialog.saving.save();
    expect(campaign.texts.get(ONE)).toBe("We camped.\n$ [[Primary Monk]] Rope\\_coil\n");
  });

  it("refuses an item already on the funds page, and writes nothing", async () => {
    const campaign = new DialogCampaign({ [ONE]: "$ [[Secondary]] rope\n" });
    trackingIn(campaign).track(PRIMARY, "Rope", noFocus);
    await expect(lastDialog<TrackShownDialog>().saving.save()).rejects.toThrow(ALREADY_ON_FUNDS_PAGE);
    expect(campaign.writes).toBe(0);
  });

  it("refuses a name the ledger would read as coin, and writes nothing", async () => {
    const campaign = new DialogCampaign({ [ONE]: "We camped.\n" });
    trackingIn(campaign).track(PRIMARY, "Pouch 10 gp", noFocus);
    await expect(lastDialog<TrackShownDialog>().saving.save()).rejects.toThrow(NOT_READ_AS_THE_ITEM);
    expect(campaign.writes).toBe(0);
  });

  it("refuses, in words and with no dialog, a character outside the campaign shown", () => {
    const campaign = new DialogCampaign({ [ONE]: "We camped.\n" });
    trackingIn(campaign).track(ELSEWHERE, "Rope", noFocus);
    expect(Notice.shown).toEqual([NOT_THE_SHOWN_CAMPAIGN]);
    expect(openedModals).toHaveLength(0);
  });

  it("hands the focus back when the dialog closes", () => {
    const campaign = new DialogCampaign({ [ONE]: "We camped.\n" });
    const returned: string[] = [];
    trackingIn(campaign).track(PRIMARY, "Rope", function focusBack(): void {
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

  it("lists only the items he holds that the import doesn't have", () => {
    const campaign = new DialogCampaign({ [ONE]: "$ [[Primary Monk]] Rope\n$ [[Primary Monk]] Dagger\n$ [[primary monk]] Cloak\n$ [[Secondary]] Shield\n$ [[Primary Monk]] Map\n$$ Map :lost\n" });
    const look = trackingIn(campaign).lookAt(PRIMARY, ["rope"]);
    if (look === null) throw new Error("No look for the campaign shown.");
    expect(look.heldButNotImported()).toEqual(["Dagger", "Cloak"]);
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
    trackingIn(campaign).track(PRIMARY, "Rope", noFocus);
    const dialog = lastDialog<TrackItemModal>();
    expect((dialog as unknown as { title: string }).title).toBe(TRACK_TITLE);
    const texts: (string | null)[] = [];
    for (const line of dialog.contentEl.querySelectorAll("p")) texts.push(line.textContent);
    expect(texts).toEqual(["Rope", "Held by Primary Monk", "Adds a line to Session 1."]);
  });
});

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
    trackingIn(campaign).track(PRIMARY, "Rope", function focusBack(): void {
      closed.push("closed");
    });
    buttonSaying(lastDialog<TrackItemModal>().contentEl, "Save").click();
    await expect.poll(function closings(): string[] {
      return closed;
    }).toEqual(["closed"]);
    expect(campaign.texts.get(ONE)).toBe("We camped.\n$ [[Primary Monk]] Rope\n");
  });

  it("write nothing on Cancel, and close", () => {
    const campaign = new DialogCampaign({ [ONE]: "We camped.\n" });
    const closed: string[] = [];
    trackingIn(campaign).track(PRIMARY, "Rope", function focusBack(): void {
      closed.push("closed");
    });
    buttonSaying(lastDialog<TrackItemModal>().contentEl, "Cancel").click();
    expect(closed).toEqual(["closed"]);
    expect(campaign.writes).toBe(0);
  });

  it("say why in a notice and stay open when the save is refused", async () => {
    const campaign = new DialogCampaign({ [ONE]: "$ Rope\n" });
    const closed: string[] = [];
    trackingIn(campaign).track(PRIMARY, "Rope", function focusBack(): void {
      closed.push("closed");
    });
    buttonSaying(lastDialog<TrackItemModal>().contentEl, "Save").click();
    await expect.poll(function notices(): string[] {
      return Notice.shown;
    }).toEqual([`Couldn't track the item: ${ALREADY_ON_FUNDS_PAGE}`]);
    expect(closed).toEqual([]);
  });
});
