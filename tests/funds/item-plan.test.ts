import { describe, expect, it } from "vitest";
import type { TFile } from "obsidian";
import { buildCampaign } from "../../src/campaign/build-campaign";
import type { Campaign, SessionNote } from "../../src/campaign/campaign";
import { CHANGED_IN_NOTE, type EditorVault } from "../../src/campaign/note-editor";
import { sessionNoteOf } from "../../src/campaign/session-file";
import { NO_COIN, SIGN_SAYS_OUT } from "../../src/notes/coin-lines";
import {
  CHANGES_ANOTHER_ITEM,
  holderOptions,
  HOLDER_OF_GONE,
  initialItemEdit,
  planItemSave,
  refusalForItemPlan,
  statusOf,
  type ItemEdit,
} from "../../src/funds/item-plan";
import { itemSaver } from "../../src/funds/item-writer";

const ONE = "Pale Moon/Sessions/Session 1.md";
const TWO = "Pale Moon/Sessions/Session 2.md";

class FakeNotes {
  readonly texts: Map<string, string>;
  writes = 0;

  constructor(notes: Record<string, string>) {
    this.texts = new Map(Object.entries(notes));
  }

  get vault(): EditorVault {
    return {
      getFileByPath: (path) => {
        if (!this.texts.has(path)) return null;
        return { path } as TFile;
      },
      process: async (file, change) => {
        this.writes += 1;
        const next = change(this.texts.get(file.path)!);
        this.texts.set(file.path, next);
        return next;
      },
      read: async (file) => this.texts.get(file.path)!,
    };
  }

  get sessionNotes(): SessionNote[] {
    return [...this.texts].map(([path, text]) => sessionNoteOf(path, Number(/(\d+)\.md$/.exec(path)![1]), text));
  }

  get current(): Campaign {
    return buildCampaign(this.sessionNotes);
  }

  item(name: string) {
    return this.current.items.find((item) => item.name === name)!;
  }

  save(name: string, changes: Partial<ItemEdit>, sessionPath = TWO): Promise<boolean> {
    const edit = { ...initialItemEdit(this.item(name)), ...changes };
    return itemSaver(this.vault, this, name, sessionPath)(edit);
  }
}

describe("saving an item", () => {
  it("sells an item, and the sale goes into the purse", async () => {
    const notes = new FakeNotes({ [ONE]: "$ [[Mira]] Silvered lantern\n", [TWO]: "We rode on.\n" });
    expect(await notes.save("Silvered lantern", { status: "sold", soldFor: "30 gp" })).toBe(true);
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
    expect(holderOptions([notes.item("Silvered lantern").holder], [])[0]!.text).toBe("the party");
  });

  it("gives an item away and sells it in one step, in that order", async () => {
    const notes = new FakeNotes({ [ONE]: "$ Rope\n", [TWO]: "" });
    await notes.save("Rope", { holder: "[[Mira]]", status: "sold", soldFor: "1 gp" });
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
    const notes = new FakeNotes({ [ONE]: "$$ Potion of healing :used\n$$ Rope :lost\n", [TWO]: "" });
    await notes.save("Potion of healing", { status: "held", holder: "[[Mira]]" });
    await notes.save("Rope", { status: "held" });
    expect(notes.texts.get(ONE)).toBe("");
    expect(notes.texts.get(TWO)).toBe("$ [[Mira]] Potion of healing\n$ Rope\n");
    expect(notes.item("Potion of healing")).toMatchObject({ holder: "Mira", gone: null });
  });

  it("changes how an item went, replacing the old line and its sale", async () => {
    const notes = new FakeNotes({ [ONE]: "$ Lantern\n$$ Lantern :sold 30 gp\n", [TWO]: "" });
    await notes.save("Lantern", { status: "lost" });
    expect(notes.texts.get(ONE)).toBe("$ Lantern\n");
    expect(notes.texts.get(TWO)).toBe("$$ Lantern :lost\n");
    expect(notes.current.purseCopper).toBe(0);
  });

  it("writes nothing when nothing changed", async () => {
    const notes = new FakeNotes({ [ONE]: "$ [[Mira]] Rope\n$ Torch\n$$ Torch :lost\n", [TWO]: "" });
    expect(await notes.save("Rope", {})).toBe(false);
    expect(await notes.save("Torch", { soldFor: "5 gp" })).toBe(false);
    expect(notes.writes).toBe(0);
  });

  it("refuses to give away an item that stays gone, since a new holder would bring it back", async () => {
    const notes = new FakeNotes({ [ONE]: "$ Torch\n$$ Torch :lost\n", [TWO]: "" });
    await expect(notes.save("Torch", { holder: "[[Mira]]" })).rejects.toThrow(HOLDER_OF_GONE);
    expect(notes.writes).toBe(0);
  });

  it("refuses a sale price that isn't an amount of coin coming in", async () => {
    const notes = new FakeNotes({ [ONE]: "$ Rope\n", [TWO]: "" });
    await expect(notes.save("Rope", { status: "sold", soldFor: "thirty gold" })).rejects.toThrow(NO_COIN);
    await expect(notes.save("Rope", { status: "sold", soldFor: "-3 gp" })).rejects.toThrow(SIGN_SAYS_OUT);
    expect(notes.writes).toBe(0);
  });

  it("refuses to set an item held when the line that took it was changed by hand", async () => {
    const notes = new FakeNotes({ [ONE]: "$ Lantern\n$$ Lantern :sold 30 gp\n", [TWO]: "" });
    const edit = { ...initialItemEdit(notes.item("Lantern")), status: "held" as const };
    const readBefore = { current: notes.current, sessionNotes: notes.sessionNotes };
    notes.texts.set(ONE, "$ Lantern\n$$ Lantern :sold 35 gp\n");
    await expect(itemSaver(notes.vault, readBefore, "Lantern", TWO)(edit)).rejects.toThrow(CHANGED_IN_NOTE);
    expect(notes.texts.get(ONE)).toBe("$ Lantern\n$$ Lantern :sold 35 gp\n");
  });

  it("refuses to write into a session note the campaign hasn't read yet", async () => {
    const notes = new FakeNotes({ [ONE]: "$ Rope\n" });
    const edit = { ...initialItemEdit(notes.item("Rope")), status: "lost" as const };
    const readBefore = { current: notes.current, sessionNotes: notes.sessionNotes };
    const three = "Pale Moon/Sessions/Session 3.md";
    notes.texts.set(three, "");
    await expect(itemSaver(notes.vault, readBefore, "Rope", three)(edit)).rejects.toThrow(CHANGES_ANOTHER_ITEM);
    expect(notes.texts.get(three)).toBe("");
  });

  it("refuses a plan that would move the purse by anything but the sale", () => {
    const notes = new FakeNotes({ [ONE]: "$ Rope\n", [TWO]: "" });
    const item = notes.item("Rope");
    const plan = planItemSave(item, { ...initialItemEdit(item), status: "sold", soldFor: "1 gp" }, notes.sessionNotes, [], TWO);
    if ("error" in plan) throw new Error(plan.error);
    expect(refusalForItemPlan(notes.sessionNotes, item, plan)).toBeNull();
    expect(refusalForItemPlan(notes.sessionNotes, item, { ...plan, purseCopper: 200 })).toBe(CHANGES_ANOTHER_ITEM);
  });

  it("refuses a plan that would change another item", () => {
    const notes = new FakeNotes({ [ONE]: "$ Rope\n$ Torch\n", [TWO]: "" });
    const item = notes.item("Rope");
    const plan = planItemSave(item, { ...initialItemEdit(item), status: "lost" }, notes.sessionNotes, [], TWO);
    if ("error" in plan) throw new Error(plan.error);
    expect(refusalForItemPlan(notes.sessionNotes, item, { ...plan, added: [...plan.added, "$$ Torch :lost"] })).toBe(CHANGES_ANOTHER_ITEM);
  });
});

describe("holder options", () => {
  it("offers the party first, then each holder and character once, by name", () => {
    const options = holderOptions(["Mira", "the party", "Characters/Thessaly"], [
      { text: "[[Mira]]", label: "Mira" },
      { text: "[[Bram]]", label: "Bram" },
    ]);
    expect(options.map((option) => option.label)).toEqual(["The party", "Bram", "Mira", "Thessaly"]);
  });
});
