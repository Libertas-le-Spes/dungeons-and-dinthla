import { describe, expect, it } from "vitest";
import { fileAt } from "../../stubs/note-files";
import type { TFile } from "obsidian";
import { buildCampaign } from "../../../src/campaign/reading/build-campaign";
import type { Campaign, SessionNote } from "../../../src/campaign/record/campaign";
import { CHANGED_IN_NOTE, PROPERTIES_WOULD_CHANGE, type EditorFiles } from "../../../src/campaign/writing/note-editor";
import { sessionNoteOf } from "../../../src/campaign/paths/session-file";
import { NO_COIN, SIGN_SAYS_OUT } from "../../../src/notes/writing/coin-lines";
import {
  CHANGES_ANOTHER_ITEM,
  GONE_LINE_SAYS_MORE,
  latestSessionOfItem,
  holderOptionOf,
  holderOptions,
  HOLDER_OF_GONE,
  CANT_SAY_WHOSE,
  howManyWords,
  asksHowMany,
  initialItemEdit,
  planItemSave,
  refusalForItemPlan,
  statusOf,
  type ItemEdit,
} from "../../../src/funds/items/item-plan";
import type { ItemSource } from "../../../src/funds/items/item-source";
import { openedItem } from "../../../src/funds/items/item-writer";
import { STUB_SYNTAX } from "../../host/stub-syntax";

const ONE = "Pale Moon/Sessions/Session 1.md";
const TWO = "Pale Moon/Sessions/Session 2.md";

class FakeNotes {
  readonly texts: Map<string, string>;
  writes = 0;
  private readonly files = new Map<string, TFile>();

  constructor(notes: Record<string, string>) {
    this.texts = new Map(Object.entries(notes));
  }

  get vault(): EditorFiles {
    return {
      note: (path) => {
        if (!this.texts.has(path)) return null;
        const known = this.files.get(path);
        if (known !== undefined) return known;
        const made = fileAt(path);
        this.files.set(path, made);
        return made;
      },
      change: async (file, change) => {
        this.writes += 1;
        const next = change(this.texts.get(file.path)!);
        this.texts.set(file.path, next);
        return next;
      },
      read: async (file) => this.texts.get(file.path)!,
    };
  }

  get sessionNotes(): SessionNote[] {
    return [...this.texts].map(([path, text]) => sessionNoteOf(path, Number(/(\d+)\.md$/.exec(path)![1]), text, STUB_SYNTAX));
  }

  get current(): Campaign {
    return buildCampaign(this.sessionNotes);
  }

  item(name: string) {
    return this.current.items.find((item) => item.name === name)!;
  }

  open(name: string, sessionPath = TWO, store: ItemSource = this) {
    return openedItem(this.vault, store, store.current.items.find((item) => item.name === name)!, sessionPath, STUB_SYNTAX);
  }

  save(name: string, changes: Partial<ItemEdit>, sessionPath = TWO): Promise<boolean> {
    const opened = this.open(name, sessionPath);
    return opened.save({ ...opened.edit, ...changes });
  }

  holding(name: string, holder: string) {
    return this.current.items.find((item) => item.name === name && item.holder === holder)!;
  }

  saveHolding(name: string, holder: string, changes: Partial<ItemEdit>, sessionPath = TWO): Promise<boolean> {
    const opened = openedItem(this.vault, this, this.holding(name, holder), sessionPath, STUB_SYNTAX);
    return opened.save({ ...opened.edit, ...changes });
  }

  readBefore(): ItemSource {
    return { current: this.current, sessionNotes: this.sessionNotes };
  }
}

describe("using, selling or losing some of an item held several times", () => {
  it("asks how many only for a held item with a count over 1, starting at 1", () => {
    const notes = new FakeNotes({ [ONE]: "$ Arrow x20\n$ Rope x1\n$ Torch\n$ Dagger x3\n$$ Dagger x3 :lost\n", [TWO]: "" });
    expect(["Arrow", "Rope", "Torch", "Dagger"].map((name) => asksHowMany(notes.item(name)))).toEqual([true, false, false, false]);
    expect(notes.open("Arrow").edit.howMany).toBe("1");
  });

  it("writes the count taken, and keeps the item held with what is left", async () => {
    const notes = new FakeNotes({ [ONE]: "$ [[Mira]] Arrow x20\n", [TWO]: "" });
    expect(await notes.save("Arrow", { status: "used", howMany: "3" })).toBe(true);
    expect(notes.texts.get(TWO)).toBe("$$ Arrow x3 :used\n");
    expect([statusOf(notes.item("Arrow")), notes.item("Arrow").held]).toEqual(["held", 17]);
  });

  it("sells some for a price, which goes into the purse, and keeps the rest held", async () => {
    const notes = new FakeNotes({ [ONE]: "$ Dagger x5\n", [TWO]: "" });
    await notes.save("Dagger", { status: "sold", howMany: "2", price: "4 gp" });
    expect(notes.texts.get(TWO)).toBe("$$ Dagger x2 :sold 4 gp\n");
    expect([notes.item("Dagger").held, notes.current.purseCopper]).toEqual([3, 400]);
  });

  it("marks the item gone when all that are held are taken", async () => {
    const notes = new FakeNotes({ [ONE]: "$ Dagger x5\n", [TWO]: "" });
    await notes.save("Dagger", { status: "lost", howMany: "5" });
    expect(notes.texts.get(TWO)).toBe("$$ Dagger x5 :lost\n");
    expect(statusOf(notes.item("Dagger"))).toBe("lost");
  });

  it("writes no count for an item held once or with no count", async () => {
    const notes = new FakeNotes({ [ONE]: "$ Rope x1\n$ Torch\n", [TWO]: "" });
    await notes.save("Rope", { status: "used", howMany: "7" });
    await notes.save("Torch", { status: "used", howMany: "7" });
    expect(notes.texts.get(TWO)).toBe("$$ Rope :used\n$$ Torch :used\n");
  });

  it.each(["0", "6", "2.5", "-1", "", "two", " 2x"])("refuses %j and writes nothing", async (howMany) => {
    const notes = new FakeNotes({ [ONE]: "$ Dagger x5\n", [TWO]: "" });
    const plan = planItemSave(notes.item("Dagger"), { ...notes.open("Dagger").edit, status: "used", howMany }, notes.sessionNotes, notes.current.coins, TWO, STUB_SYNTAX);
    expect(plan).toEqual({ error: howManyWords(5) });
  });

  it("takes a count typed with spaces around it", async () => {
    const notes = new FakeNotes({ [ONE]: "$ Dagger x5\n", [TWO]: "" });
    await notes.save("Dagger", { status: "used", howMany: " 2 " });
    expect(notes.texts.get(TWO)).toBe("$$ Dagger x2 :used\n");
  });

  it("gives some to someone and uses others in one save, keeping the count with the new holder", async () => {
    const notes = new FakeNotes({ [ONE]: "$ Arrow x20\n", [TWO]: "" });
    await notes.save("Arrow", { holder: "[[Mira]]", status: "used", howMany: "4" });
    expect(notes.texts.get(TWO)).toBe("$$ Arrow x20 :changed to [[Mira]]\n$$ Arrow x4 :used\n");
    expect([notes.item("Arrow").holder, notes.item("Arrow").held]).toEqual(["Mira", 16]);
  });

  it("refuses a change whose count would read back as another count", () => {
    const notes = new FakeNotes({ [ONE]: "$ Dagger x5\n", [TWO]: "" });
    const item = notes.item("Dagger");
    const plan = planItemSave(item, { ...notes.open("Dagger").edit, status: "used", howMany: "2" }, notes.sessionNotes, notes.current.coins, TWO, STUB_SYNTAX);
    if ("error" in plan) throw new Error(plan.error);
    expect(refusalForItemPlan(notes.sessionNotes, item, { ...plan, expected: [{ ...plan.expected[0]!, held: 4 }] }, STUB_SYNTAX)).toBe(CHANGES_ANOTHER_ITEM);
    expect(refusalForItemPlan(notes.sessionNotes, item, plan, STUB_SYNTAX)).toBeNull();
  });
});

describe("an item held by more than one, from its dialog", () => {
  const SPLIT = "$ [[Primary Monk]] Arrow x15\n$ [[Mira]] Arrow x5\n";

  it("names the holder whose arrows a use takes when they aren't the first holder's", async () => {
    const notes = new FakeNotes({ [ONE]: SPLIT, [TWO]: "" });
    expect(await notes.saveHolding("Arrow", "Mira", { status: "used", howMany: "2" })).toBe(true);
    expect(notes.texts.get(TWO)).toBe("$$ Arrow x2 [[Mira]] :used\n");
    expect([notes.holding("Arrow", "Primary Monk").held, notes.holding("Arrow", "Mira").held]).toEqual([15, 3]);
  });

  it("names nobody for a use of the first holder's", async () => {
    const notes = new FakeNotes({ [ONE]: SPLIT, [TWO]: "" });
    await notes.saveHolding("Arrow", "Primary Monk", { status: "lost", howMany: "1" });
    expect(notes.texts.get(TWO)).toBe("$$ Arrow :lost\n");
    expect(notes.holding("Arrow", "Primary Monk").held).toBe(14);
  });

  it("gives some to someone else, asking how many, and keeps the rest with the giver", async () => {
    const notes = new FakeNotes({ [ONE]: "$ [[Primary Monk]] Arrow x20\n", [TWO]: "" });
    expect(await notes.saveHolding("Arrow", "Primary Monk", { holder: "[[Mira]]", howMany: "5" })).toBe(true);
    expect(notes.texts.get(TWO)).toBe("$$ Arrow x5 :changed to [[Mira]]\n");
    expect([notes.holding("Arrow", "Primary Monk").held, notes.holding("Arrow", "Mira").held]).toEqual([15, 5]);
  });

  it("gives some from the second holder, naming them", async () => {
    const notes = new FakeNotes({ [ONE]: SPLIT, [TWO]: "" });
    await notes.saveHolding("Arrow", "Mira", { holder: "[[Thessaly]]", howMany: "2" });
    expect(notes.texts.get(TWO)).toBe("$$ Arrow x2 [[Mira]] :changed to [[Thessaly]]\n");
    expect(notes.holding("Arrow", "Thessaly").held).toBe(2);
  });

  it("joins what it gives to what the receiver already holds", async () => {
    const notes = new FakeNotes({ [ONE]: SPLIT, [TWO]: "" });
    await notes.saveHolding("Arrow", "Mira", { holder: "[[Primary Monk]]", howMany: "5" });
    expect(notes.current.items.filter((item) => item.name === "Arrow").map((item) => [item.holder, item.held])).toEqual([["Primary Monk", 20]]);
  });

  it("names nobody when it hands the first holder's whole holding to someone and uses some of them", async () => {
    const notes = new FakeNotes({ [ONE]: SPLIT, [TWO]: "" });
    await notes.saveHolding("Arrow", "Primary Monk", { holder: "[[Thessaly]]", status: "used", howMany: "2" });
    expect(notes.texts.get(TWO)).toBe("$$ Arrow x15 :changed to [[Thessaly]]\n$$ Arrow x2 :used\n");
    expect([notes.holding("Arrow", "Thessaly").held, notes.holding("Arrow", "Mira").held]).toEqual([13, 5]);
  });

  it("refuses, writing nothing, when the holder it would have to name isn't linked", async () => {
    const notes = new FakeNotes({ [ONE]: "$ [[Primary Monk]] Arrow x15\n$$ Arrow x5 :changed to Old Tom\n", [TWO]: "" });
    const holding = notes.holding("Arrow", "Old Tom");
    const plan = planItemSave(holding, { ...initialItemEdit(holding, notes.sessionNotes), status: "used", howMany: "1" }, notes.sessionNotes, notes.current.coins, TWO, STUB_SYNTAX);
    expect(plan).toEqual({ error: CANT_SAY_WHOSE });
  });
});

describe("saving an item", () => {
  it("sells an item, and the sale goes into the purse", async () => {
    const notes = new FakeNotes({ [ONE]: "$ [[Mira]] Silvered lantern\n", [TWO]: "We rode on.\n" });
    expect(await notes.save("Silvered lantern", { status: "sold", price: "30 gp" })).toBe(true);
    expect(notes.texts.get(TWO)).toBe("We rode on.\n$$ Silvered lantern :sold 30 gp\n");
    expect(statusOf(notes.item("Silvered lantern"))).toBe("sold");
    expect(notes.current.purseCopper).toBe(3000);
  });

  it("sells an item for no price, and marks it used up or lost", async () => {
    const notes = new FakeNotes({ [ONE]: "$ Rope\n$ Potion of healing\n$ Torch\n", [TWO]: "" });
    await notes.save("Rope", { status: "sold" });
    await notes.save("Potion of healing", { status: "used" });
    await notes.save("Torch", { status: "lost" });
    expect(notes.texts.get(TWO)).toBe("$$ Rope :sold\n$$ Potion of healing :used\n$$ Torch :lost\n");
    expect(["Rope", "Potion of healing", "Torch"].map((name) => statusOf(notes.item(name)))).toEqual(["sold", "used", "lost"]);
    expect(notes.current.purseCopper).toBe(0);
  });

  it("gives an item to someone, or back to the party", async () => {
    const notes = new FakeNotes({ [ONE]: "$ [[Mira]] Silvered lantern\n", [TWO]: "" });
    await notes.save("Silvered lantern", { holder: "[[Thessaly]]" });
    expect(notes.item("Silvered lantern").holder).toBe("Thessaly");
    await notes.save("Silvered lantern", { holder: "the party" });
    expect(notes.texts.get(TWO)).toBe("$$ Silvered lantern :changed to [[Thessaly]]\n$$ Silvered lantern :changed to the party\n");
    expect(holderOptions([holderOptionOf(notes.item("Silvered lantern"))], [])[0]!.text).toBe("the party");
  });

  it("writes a plain holder back as plain text, and a linked one as a link", async () => {
    const notes = new FakeNotes({ [ONE]: "$ Rope\n$$ Rope :changed to Old Tom\n$ [[Mira]] Torch\n$ Shield\n", [TWO]: "" });
    expect(holderOptionOf(notes.item("Rope"))).toEqual({ text: "Old Tom", label: "Old Tom" });
    expect(holderOptionOf(notes.item("Torch"))).toEqual({ text: "[[Mira]]", label: "Mira" });
    await notes.save("Shield", { holder: "Old Tom" });
    await notes.save("Rope", { holder: "[[Mira]]" });
    await notes.save("Torch", { holder: "Old Tom" });
    expect(notes.texts.get(TWO)).toBe("$$ Shield :changed to Old Tom\n$$ Rope :changed to [[Mira]]\n$$ Torch :changed to Old Tom\n");
    expect([notes.item("Rope").holderLinked, notes.item("Torch").holderLinked]).toEqual([true, false]);
  });

  it("keeps a plain holder plain when an item named only by the line that took it is set held again", async () => {
    const notes = new FakeNotes({ [ONE]: "$$ Rope :changed to Old Tom\n$$ [[Rope]] :lost\n", [TWO]: "" });
    await notes.save("Rope", { status: "held" });
    expect(notes.texts.get(TWO)).toBe("$$ [[Rope]] :changed to Old Tom\n");
  });

  it("reads a holder named by a $ line as linked again after a plain one", () => {
    const notes = new FakeNotes({ [ONE]: "$ Rope\n$$ Rope :changed to Old Tom\n$$ Rope :lost\n$ [[Mira]] Rope\n" });
    expect(initialItemEdit(notes.item("Rope"), notes.sessionNotes).holder).toBe("[[Mira]]");
  });

  it("gives an item away and sells it in one step, in that order", async () => {
    const notes = new FakeNotes({ [ONE]: "$ Rope\n", [TWO]: "" });
    await notes.save("Rope", { holder: "[[Mira]]", status: "sold", price: "1 gp" });
    expect(notes.texts.get(TWO)).toBe("$$ Rope :changed to [[Mira]]\n$$ Rope :sold 1 gp\n");
    expect(statusOf(notes.item("Rope"))).toBe("sold");
  });

  it("sets a gone item held again by removing the line that took it, and its sale", async () => {
    const notes = new FakeNotes({ [ONE]: "$ Silvered lantern\n$$ Silvered lantern :sold 30 gp\n", [TWO]: "" });
    expect(notes.current.purseCopper).toBe(3000);
    await notes.save("Silvered lantern", { status: "held" });
    expect(notes.texts.get(ONE)).toBe("$ Silvered lantern\n");
    expect(notes.texts.get(TWO)).toBe("");
    expect(statusOf(notes.item("Silvered lantern"))).toBe("held");
    expect(notes.current.purseCopper).toBe(0);
  });

  it("keeps an item named only by the line that took it, when it is set held again", async () => {
    const notes = new FakeNotes({ [ONE]: "$$ Potion of healing :used\n$$ Bag of 50 gp :lost\n", [TWO]: "" });
    await notes.save("Potion of healing", { status: "held", holder: "[[Mira]]" });
    await notes.save("Bag of 50 gp", { status: "held" });
    expect(notes.texts.get(ONE)).toBe("");
    expect(notes.texts.get(TWO)).toBe("$$ Potion of healing :changed to [[Mira]]\n$$ Bag of 50 gp :changed to the party\n");
    expect(notes.item("Potion of healing")).toMatchObject({ holder: "Mira", gone: null });
    expect(statusOf(notes.item("Bag of 50 gp"))).toBe("held");
    expect(notes.current.purseCopper).toBe(0);
  });

  it("changes how an item went, replacing the old line and its sale", async () => {
    const notes = new FakeNotes({ [ONE]: "$ Lantern\n$$ Lantern :sold 30 gp\n", [TWO]: "" });
    await notes.save("Lantern", { status: "lost" });
    expect(notes.texts.get(ONE)).toBe("$ Lantern\n");
    expect(notes.texts.get(TWO)).toBe("$$ Lantern :lost\n");
    expect(notes.current.purseCopper).toBe(0);
  });

  it("writes an item as it was written, keeping its link once it has one", async () => {
    const notes = new FakeNotes({ [ONE]: "$ [[Mira]] [[Items/Lantern|Lamp]]\n$ Lantern\n$$ [[Longsword]] :sold 5 gp\n", [TWO]: "" });
    await notes.save("Lantern", { status: "lost" });
    await notes.save("Longsword", { status: "held" });
    expect(notes.texts.get(ONE)).toBe("$ [[Mira]] [[Items/Lantern|Lamp]]\n$ Lantern\n");
    expect(notes.texts.get(TWO)).toBe("$$ [[Items/Lantern|Lamp]] :lost\n$$ [[Longsword]] :changed to the party\n");
  });

  it("keeps an item's link or alias when the line that carried it is undone", async () => {
    const notes = new FakeNotes({
      [ONE]: "$ Silvered lantern\n$$ [[Silvered lantern]] :lost\n$ [[Mira]] [[Shield]]\n$$ [[Shield|grandma's shield]] :lost\n",
      [TWO]: "",
    });
    await notes.save("Silvered lantern", { status: "held" });
    await notes.save("Shield", { status: "held" });
    expect(notes.texts.get(ONE)).toBe("$ Silvered lantern\n$ [[Mira]] [[Shield]]\n");
    expect(notes.texts.get(TWO)).toBe("$$ [[Silvered lantern]] :changed to the party\n$$ [[Shield|grandma's shield]] :changed to [[Mira]]\n");
  });

  it("writes an item as it was last linked", async () => {
    const notes = new FakeNotes({ [ONE]: "$ [[Mira]] [[Items/Lantern|Lamp]]\n$ [[Mira]] [[Lantern]]\n", [TWO]: "" });
    await notes.save("Lantern", { status: "lost" });
    expect(notes.texts.get(TWO)).toBe("$$ [[Lantern]] :lost\n");
  });

  it("changes how an item named only by the line that took it went, without a holder line", async () => {
    const notes = new FakeNotes({ [ONE]: "$$ Rope :lost\n", [TWO]: "" });
    await notes.save("Rope", { status: "used" });
    expect(notes.texts.get(ONE)).toBe("");
    expect(notes.texts.get(TWO)).toBe("$$ Rope :used\n");
  });

  it("writes an item without its block id, and leaves a line with one where it is", async () => {
    const notes = new FakeNotes({ [ONE]: "$ Rope ^r1\n$ Torch\n$$ Torch :lost ^t1\n", [TWO]: "" });
    await notes.save("Rope", { status: "sold" });
    expect(notes.texts.get(TWO)).toBe("$$ Rope :sold\n");
    await expect(notes.save("Torch", { status: "held" })).rejects.toThrow(GONE_LINE_SAYS_MORE);
    expect(notes.texts.get(ONE)).toBe("$ Rope ^r1\n$ Torch\n$$ Torch :lost ^t1\n");
  });

  it("reads a $$ line with a block id before its change word as the same item", async () => {
    const notes = new FakeNotes({ [ONE]: "$ Rope ^r1\n$$ Rope ^r1 :changed to [[Mira]]\n", [TWO]: "" });
    expect(notes.current.items.map((item) => [item.name, item.holder])).toEqual([["Rope", "Mira"]]);
    await notes.save("Rope", { status: "lost" });
    expect(notes.texts.get(TWO)).toBe("$$ Rope :lost\n");
  });

  it("takes an item's link from a later $$ line too", async () => {
    const notes = new FakeNotes({ [ONE]: "$ Shield\n$$ [[Shield]] :lost\n", [TWO]: "" });
    await notes.save("Shield", { status: "used" });
    expect(notes.texts.get(TWO)).toBe("$$ [[Shield]] :used\n");
  });

  it("refuses to change or undo a line that took an item when it says more than the dialog writes", async () => {
    const lost = "$ Lantern\n$$ Lantern :lost in the river near [[Old Mill]]\n";
    const sold = "$ Rope\n- $$ Rope :sold 30 gp to [[Bram]]\n";
    const notes = new FakeNotes({ [ONE]: lost + sold, [TWO]: "" });
    await expect(notes.save("Lantern", { status: "used" })).rejects.toThrow(GONE_LINE_SAYS_MORE);
    await expect(notes.save("Lantern", { status: "held" })).rejects.toThrow(GONE_LINE_SAYS_MORE);
    await expect(notes.save("Rope", { status: "lost" })).rejects.toThrow(GONE_LINE_SAYS_MORE);
    expect(notes.writes).toBe(0);
  });

  it("refuses to undo a line that took an item when what follows isn't a plain sale price", async () => {
    for (const line of ["$$ Rope :lost 30 gp", "$$ Rope :sold+30 gp", "$$ Rope :sold 1,2345 gp"]) {
      const notes = new FakeNotes({ [ONE]: `$ Rope\n${line}\n`, [TWO]: "" });
      await expect(notes.save("Rope", { status: "held" }), line).rejects.toThrow(GONE_LINE_SAYS_MORE);
      expect(notes.writes, line).toBe(0);
    }
  });

  it("undoes a line that took an item when it reads as the dialog writes it, whatever its spacing and bullet", async () => {
    const notes = new FakeNotes({ [ONE]: "$ Rope\n  - $$ rope  :Sold 1,200gp\n", [TWO]: "" });
    await notes.save("Rope", { status: "held" });
    expect(notes.texts.get(ONE)).toBe("$ Rope\n");
    expect(notes.current.purseCopper).toBe(0);
  });

  it("writes nothing when nothing changed", async () => {
    const notes = new FakeNotes({ [ONE]: "$ [[Mira]] Rope\n$ Torch\n$$ Torch :lost\n", [TWO]: "" });
    expect(await notes.save("Rope", {})).toBe(false);
    expect(await notes.save("Torch", { price: "5 gp" })).toBe(false);
    expect(notes.writes).toBe(0);
  });

  it("refuses to give away an item that stays gone, since a new holder would bring it back", async () => {
    const notes = new FakeNotes({ [ONE]: "$ Torch\n$$ Torch :lost\n", [TWO]: "" });
    await expect(notes.save("Torch", { holder: "[[Mira]]" })).rejects.toThrow(HOLDER_OF_GONE);
    expect(notes.writes).toBe(0);
  });

  it("refuses a sale price that isn't an amount of coin coming in", async () => {
    const notes = new FakeNotes({ [ONE]: "$ Rope\n", [TWO]: "" });
    await expect(notes.save("Rope", { status: "sold", price: "thirty gold" })).rejects.toThrow(NO_COIN);
    await expect(notes.save("Rope", { status: "sold", price: "-3 gp" })).rejects.toThrow(SIGN_SAYS_OUT);
    expect(notes.writes).toBe(0);
  });

  it("corrects a sale price where the sale stands, keeping its bullet", async () => {
    const notes = new FakeNotes({ [ONE]: "$ Rope\n- $$ Rope :sold 30 gp\n", [TWO]: "" });
    expect(initialItemEdit(notes.item("Rope"), notes.sessionNotes).price).toBe("30 gp");
    expect(await notes.save("Rope", { price: "35 gp" })).toBe(true);
    expect(notes.texts.get(ONE)).toBe("$ Rope\n- $$ Rope :sold 35 gp\n");
    expect(notes.texts.get(TWO)).toBe("");
    expect(notes.current.purseCopper).toBe(3500);
  });

  it("leaves a typed sale price out when the item goes another way", async () => {
    const notes = new FakeNotes({ [ONE]: "$ Rope\n$$ Rope :sold 30 gp\n", [TWO]: "" });
    await notes.save("Rope", { status: "lost", price: "40 gp" });
    expect(notes.texts.get(ONE)).toBe("$ Rope\n");
    expect(notes.texts.get(TWO)).toBe("$$ Rope :lost\n");
    expect(notes.current.purseCopper).toBe(0);
  });

  it("adds a price to a sale without one, and takes it away again", async () => {
    const notes = new FakeNotes({ [ONE]: "$ Rope\n$$ Rope :sold\n", [TWO]: "" });
    await notes.save("Rope", { price: "5 gp" });
    expect(notes.texts.get(ONE)).toBe("$ Rope\n$$ Rope :sold 5 gp\n");
    expect(notes.current.purseCopper).toBe(500);
    await notes.save("Rope", { price: " " });
    expect(notes.texts.get(ONE)).toBe("$ Rope\n$$ Rope :sold\n");
    expect(notes.current.purseCopper).toBe(0);
  });

  it("keeps the sale line's own words for the item when correcting its price", async () => {
    const notes = new FakeNotes({ [ONE]: "$ [[Mira]] [[Rope]]\n$$ rope  :Sold 3 gp\n", [TWO]: "" });
    await notes.save("Rope", { price: "4 gp" });
    expect(notes.texts.get(ONE)).toBe("$ [[Mira]] [[Rope]]\n$$ rope  :Sold 4 gp\n");
  });

  it("writes nothing when the sale price is left as it was, or reads the same", async () => {
    const notes = new FakeNotes({ [ONE]: "$ Rope\n$$ Rope :sold 1200gp\n$ Torch\n$$ Torch :sold -5 gp\n", [TWO]: "" });
    expect(initialItemEdit(notes.item("Rope"), notes.sessionNotes).price).toBe("1200gp");
    expect(await notes.save("Rope", {})).toBe(false);
    expect(await notes.save("Rope", { price: "1,200 gp" })).toBe(false);
    expect(initialItemEdit(notes.item("Torch"), notes.sessionNotes).price).toBe("");
    expect(await notes.save("Torch", {})).toBe(false);
    expect(notes.writes).toBe(0);
  });

  it("refuses to correct a sale price on a line that says more than the dialog writes", async () => {
    for (const line of ["$$ Rope :sold 30 gp to [[Bram]]", "$$ Rope :sold 30 gp ^s1", "$$ Rope :sold -5 gp"]) {
      const notes = new FakeNotes({ [ONE]: `$ Rope\n${line}\n`, [TWO]: "" });
      await expect(notes.save("Rope", { price: "35 gp" }), line).rejects.toThrow(GONE_LINE_SAYS_MORE);
      expect(notes.writes, line).toBe(0);
    }
  });

  it("refuses a corrected sale price that isn't an amount of coin coming in", async () => {
    const notes = new FakeNotes({ [ONE]: "$ Rope\n$$ Rope :sold 30 gp\n", [TWO]: "" });
    await expect(notes.save("Rope", { price: "thirty gold" })).rejects.toThrow(NO_COIN);
    expect(notes.writes).toBe(0);
  });

  it("refuses to correct a sale price when the sale was changed by hand", async () => {
    const notes = new FakeNotes({ [ONE]: "$ Lantern\n$$ Lantern :sold 30 gp\n", [TWO]: "" });
    const opened = notes.open("Lantern", TWO, notes.readBefore());
    notes.texts.set(ONE, "$ Lantern\n$$ Lantern :sold 35 gp\n");
    await expect(opened.save({ ...opened.edit, price: "40 gp" })).rejects.toThrow(CHANGED_IN_NOTE);
    expect(notes.texts.get(ONE)).toBe("$ Lantern\n$$ Lantern :sold 35 gp\n");
  });

  it("writes nothing back when the price was changed by hand while the dialog was open and Save is pressed unchanged", async () => {
    const notes = new FakeNotes({ [ONE]: "$ Rope\n$$ Rope :sold 30 gp\n", [TWO]: "" });
    const opened = notes.open("Rope");
    notes.texts.set(ONE, "$ Rope\n$$ Rope :sold 35 gp\n");
    expect(await opened.save(opened.edit)).toBe(false);
    expect(notes.texts.get(ONE)).toBe("$ Rope\n$$ Rope :sold 35 gp\n");
    expect(notes.current.purseCopper).toBe(3500);
    await expect(opened.save({ ...opened.edit, price: "40 gp" })).rejects.toThrow(CHANGED_IN_NOTE);
    expect(notes.texts.get(ONE)).toBe("$ Rope\n$$ Rope :sold 35 gp\n");
  });

  it("writes nothing back when how an item went was changed by hand while the dialog was open", async () => {
    const notes = new FakeNotes({ [ONE]: "$ Rope\n$$ Rope :sold 30 gp\n", [TWO]: "" });
    const opened = notes.open("Rope");
    notes.texts.set(ONE, "$ Rope\n$$ Rope :lost\n");
    expect(await opened.save(opened.edit)).toBe(false);
    await expect(opened.save({ ...opened.edit, status: "used" })).rejects.toThrow(CHANGED_IN_NOTE);
    await expect(opened.save({ ...opened.edit, status: "held" })).rejects.toThrow(CHANGED_IN_NOTE);
    expect(notes.texts.get(ONE)).toBe("$ Rope\n$$ Rope :lost\n");
    expect(notes.texts.get(TWO)).toBe("");
  });

  it("refuses to add a line for an item that changed by hand while the dialog was open", async () => {
    const notes = new FakeNotes({ [ONE]: "$ Rope\n", [TWO]: "" });
    const opened = notes.open("Rope");
    notes.texts.set(ONE, "$ Rope\n$$ Rope :sold 30 gp\n");
    await expect(opened.save({ ...opened.edit, status: "lost" })).rejects.toThrow(CHANGED_IN_NOTE);
    notes.texts.set(ONE, "");
    await expect(opened.save({ ...opened.edit, status: "lost" })).rejects.toThrow(CHANGED_IN_NOTE);
    expect(notes.texts.get(TWO)).toBe("");
  });

  it("reads the item's notes again before writing, when the campaign hasn't caught up with them", async () => {
    for (const [path, text] of [
      [ONE, "$ Rope\n$$ Rope :sold 30 gp\n"],
      [ONE, "We found it.\n$ Rope\n"],
      [TWO, "$$ Rope :sold 3 gp\n"],
    ]) {
      const notes = new FakeNotes({ [ONE]: "$ Rope\n", [TWO]: "" });
      const opened = notes.open("Rope", TWO, notes.readBefore());
      notes.texts.set(path!, text!);
      await expect(opened.save({ ...opened.edit, status: "lost" }), text).rejects.toThrow(CHANGED_IN_NOTE);
      expect(notes.texts.get(path!), text).toBe(text);
    }
  });

  it("reads again every note that holds the item's lines", async () => {
    const three = "Pale Moon/Sessions/Session 3.md";
    const notes = new FakeNotes({ [ONE]: "$ Rope\n", [TWO]: "$$ Rope :changed to [[Mira]]\n", [three]: "" });
    const opened = notes.open("Rope", three, notes.readBefore());
    notes.texts.set(TWO, "$$ Rope :changed to [[Bram]]\n");
    await expect(opened.save({ ...opened.edit, status: "lost" })).rejects.toThrow(CHANGED_IN_NOTE);
    expect(notes.texts.get(three)).toBe("");
  });

  it("refuses to write when a note holding the item's lines is gone", async () => {
    const notes = new FakeNotes({ [ONE]: "$ Rope\n", [TWO]: "" });
    const opened = notes.open("Rope", TWO, notes.readBefore());
    notes.texts.delete(ONE);
    await expect(opened.save({ ...opened.edit, status: "lost" })).rejects.toThrow(CHANGED_IN_NOTE);
    expect(notes.texts.get(TWO)).toBe("");
  });

  it("refuses to write when the campaign shows the item changed in a note made since the dialog opened", async () => {
    const three = "Pale Moon/Sessions/Session 3.md";
    const notes = new FakeNotes({ [ONE]: "$ Rope\n", [TWO]: "" });
    const opened = notes.open("Rope");
    notes.texts.set(three, "$$ Rope :lost\n");
    await expect(opened.save({ ...opened.edit, status: "used" })).rejects.toThrow(CHANGED_IN_NOTE);
    expect(notes.texts.get(TWO)).toBe("");
  });

  it("refuses a price correction that would move the purse by anything but the difference, or miss its line", () => {
    const notes = new FakeNotes({ [ONE]: "$ Rope\n$$ Rope :sold 30 gp\n", [TWO]: "" });
    const item = notes.item("Rope");
    const plan = planItemSave(item, { ...initialItemEdit(item, notes.sessionNotes), price: "35 gp" }, notes.sessionNotes, notes.current.coins, TWO, STUB_SYNTAX);
    if ("error" in plan) throw new Error(plan.error);
    expect(plan.purseCopper).toBe(500);
    expect(refusalForItemPlan(notes.sessionNotes, item, plan, STUB_SYNTAX)).toBeNull();
    expect(refusalForItemPlan(notes.sessionNotes, item, { ...plan, purseCopper: 3500 }, STUB_SYNTAX)).toBe(CHANGES_ANOTHER_ITEM);
    const missed = { ...plan, rewrite: { ...plan.rewrite!, old: { ...plan.rewrite!.old, matches: () => false } } };
    expect(refusalForItemPlan(notes.sessionNotes, item, missed, STUB_SYNTAX)).toBe(CHANGES_ANOTHER_ITEM);
  });

  it("refuses to set an item held when the line that took it was changed by hand", async () => {
    const notes = new FakeNotes({ [ONE]: "$ Lantern\n$$ Lantern :sold 30 gp\n", [TWO]: "" });
    const opened = notes.open("Lantern", TWO, notes.readBefore());
    notes.texts.set(ONE, "$ Lantern\n$$ Lantern :sold 35 gp\n");
    await expect(opened.save({ ...opened.edit, status: "held" })).rejects.toThrow(CHANGED_IN_NOTE);
    expect(notes.texts.get(ONE)).toBe("$ Lantern\n$$ Lantern :sold 35 gp\n");
  });

  it("refuses to write into a session note the campaign hasn't read yet", async () => {
    const notes = new FakeNotes({ [ONE]: "$ Rope\n" });
    const three = "Pale Moon/Sessions/Session 3.md";
    const readBefore = notes.readBefore();
    notes.texts.set(three, "");
    const opened = notes.open("Rope", three, readBefore);
    await expect(opened.save({ ...opened.edit, status: "lost" })).rejects.toThrow(CHANGES_ANOTHER_ITEM);
    expect(notes.texts.get(three)).toBe("");
  });

  it("refuses before writing anything when undoing a line elsewhere would turn lines into properties", async () => {
    const three = "Pale Moon/Sessions/Session 3.md";
    const gone = "$$ Rope :lost\n---\nWe rode on.\n---\n";
    const notes = new FakeNotes({ [ONE]: "$ Rope\n", [TWO]: gone, [three]: "" });
    await expect(notes.save("Rope", { status: "held", holder: "[[Mira]]" }, three)).rejects.toThrow(PROPERTIES_WOULD_CHANGE);
    expect(notes.texts.get(TWO)).toBe(gone);
    expect(notes.texts.get(three)).toBe("");
  });

  it("refuses a plan that would move the purse by anything but the sale", () => {
    const notes = new FakeNotes({ [ONE]: "$ Rope\n", [TWO]: "" });
    const item = notes.item("Rope");
    const plan = planItemSave(item, { ...initialItemEdit(item, notes.sessionNotes), status: "sold", price: "1 gp" }, notes.sessionNotes, [], TWO, STUB_SYNTAX);
    if ("error" in plan) throw new Error(plan.error);
    expect(refusalForItemPlan(notes.sessionNotes, item, plan, STUB_SYNTAX)).toBeNull();
    expect(refusalForItemPlan(notes.sessionNotes, item, { ...plan, purseCopper: 200 }, STUB_SYNTAX)).toBe(CHANGES_ANOTHER_ITEM);
  });

  it("refuses a plan that would lose how an item is written", () => {
    const notes = new FakeNotes({ [ONE]: "$ Lantern\n$$ [[Lantern]] :lost\n", [TWO]: "" });
    const item = notes.item("Lantern");
    const plan = planItemSave(item, { ...initialItemEdit(item, notes.sessionNotes), status: "held" }, notes.sessionNotes, [], TWO, STUB_SYNTAX);
    if ("error" in plan) throw new Error(plan.error);
    expect(refusalForItemPlan(notes.sessionNotes, item, plan, STUB_SYNTAX)).toBeNull();
    expect(refusalForItemPlan(notes.sessionNotes, item, { ...plan, added: [] }, STUB_SYNTAX)).toBe(CHANGES_ANOTHER_ITEM);
  });

  it("refuses a plan that would change another item", () => {
    const notes = new FakeNotes({ [ONE]: "$ Rope\n$ Torch\n", [TWO]: "" });
    const item = notes.item("Rope");
    const plan = planItemSave(item, { ...initialItemEdit(item, notes.sessionNotes), status: "lost" }, notes.sessionNotes, [], TWO, STUB_SYNTAX);
    if ("error" in plan) throw new Error(plan.error);
    expect(refusalForItemPlan(notes.sessionNotes, item, { ...plan, added: [...plan.added, "$$ Torch :lost"] }, STUB_SYNTAX)).toBe(CHANGES_ANOTHER_ITEM);
  });
});

describe("where an item's lines go", () => {
  it("knows the latest session that names the item", () => {
    const notes = new FakeNotes({ [ONE]: "$ Rope\n", [TWO]: "$$ Rope :changed to [[Mira]]\n", "Pale Moon/Sessions/Session 3.md": "$ Torch\n" });
    expect(latestSessionOfItem(notes.item("Rope"), "Pale Moon")).toBe(2);
  });
});

describe("holder options", () => {
  it("offers the party first, then each holder and character once, by name", () => {
    const notes = new FakeNotes({ [ONE]: "$ [[Mira]] Rope\n$ Torch\n$ [[Characters/Thessaly]] Shield\n" });
    const options = holderOptions(notes.current.items.map(holderOptionOf), [
      { text: "[[Mira]]", label: "Mira" },
      { text: "[[Bram]]", label: "Bram" },
    ]);
    expect(options.map((option) => option.label)).toEqual(["The party", "Bram", "Mira", "Thessaly"]);
  });

  it("links a holder that has a character note, even where an item names them in plain text", () => {
    const notes = new FakeNotes({ [ONE]: "$ Rope\n$$ Rope :changed to Old Tom\n$$ Torch :changed to Bram\n" });
    const options = holderOptions(notes.current.items.map(holderOptionOf), [{ text: "[[Characters/Old Tom]]", label: "Old Tom" }]);
    expect(options.map((option) => option.text)).toEqual(["the party", "Bram", "[[Characters/Old Tom]]"]);
  });

  it("links a holder that has a character note whatever the capitals of the plain name", () => {
    const notes = new FakeNotes({ [ONE]: "$ Rope\n$$ Rope :changed to old tom\n" });
    const options = holderOptions(notes.current.items.map(holderOptionOf), [{ text: "[[Old Tom]]", label: "Old Tom" }]);
    expect(options).toEqual([
      { text: "the party", label: "The party" },
      { text: "[[Old Tom]]", label: "Old Tom" },
    ]);
  });

  it("refuses a plan that would write a plain holder as a link", () => {
    const notes = new FakeNotes({ [ONE]: "$ Rope\n", [TWO]: "" });
    const item = notes.item("Rope");
    const plan = planItemSave(item, { ...initialItemEdit(item, notes.sessionNotes), holder: "Old Tom" }, notes.sessionNotes, [], TWO, STUB_SYNTAX);
    if ("error" in plan) throw new Error(plan.error);
    expect(refusalForItemPlan(notes.sessionNotes, item, plan, STUB_SYNTAX)).toBeNull();
    expect(refusalForItemPlan(notes.sessionNotes, item, { ...plan, added: ["$$ Rope :changed to [[Old Tom]]"] }, STUB_SYNTAX)).toBe(CHANGES_ANOTHER_ITEM);
  });
});
