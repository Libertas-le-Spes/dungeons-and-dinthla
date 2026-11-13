import { afterEach, describe, expect, it } from "vitest";
import { Refusal } from "../../../src/beyond/shape/refusal";
import { fallenRecordText } from "../../../src/imports/leaving/record/fallen-record";
import { lastDoingOf } from "../../../src/imports/leaving/record/last-doing";
import { RecordWriter } from "../../../src/imports/leaving/record/record-writer";
import { OUTSIDE_FENCE } from "../../../src/fence/paths/fence";
import { FakeNoteVault } from "../builders/fake-note-vault";

const CAMPAIGN = "D&D/Primary Campaign";
const MONK = { name: "Primary Monk", species: "Human", classes: "Monk 4" };
const DIED = { standing: "died", how: "Died", day: "2026-11-12", sessionLink: "Session 7", lastDoing: "holding the bridge at the Old Mill." };

let typed = "";

afterEach(() => {
  typed = "";
});

function lastDoingTyped(): string | null {
  return lastDoingOf(typed);
}

function refusalOf(work: () => unknown): string {
  try {
    work();
  } catch (error) {
    if (error instanceof Refusal) return error.message;
    throw error;
  }
  throw new Error("Nothing was refused.");
}

async function refusalWhen(work: Promise<unknown>): Promise<string> {
  try {
    await work;
  } catch (error) {
    if (error instanceof Refusal) return error.message;
    throw error;
  }
  throw new Error("Nothing was refused.");
}

describe("the record of a character who left play", () => {
  it("holds their name, species and class, how and when they left, after which session, and what they were last doing", () => {
    expect(fallenRecordText(MONK, DIED)).toBe(
      "---\nstanding: died\nleft: 2026-11-12\n---\nPrimary Monk, Human, Monk 4.\nDied on 2026-11-12, after [[Session 7]].\nLast doing: holding the bridge at the Old Mill.\n",
    );
  });

  it("leaves out what the note doesn't give, the session when there is none, and what they were doing when nothing was typed", () => {
    const retired = { standing: "retired", how: "Retired", day: "2026-11-13", sessionLink: null, lastDoing: null };
    expect(fallenRecordText({ name: "Secondary", species: null, classes: null }, retired)).toBe("---\nstanding: retired\nleft: 2026-11-13\n---\nSecondary.\nRetired on 2026-11-13.\n");
  });

  it("makes the species and class inert, so they can't read as links, and drops one that runs over a line", () => {
    const text = fallenRecordText({ name: "Primary Monk", species: "[[Secret]] #tag", classes: "Monk\nHP: 99" }, DIED);
    expect(text).toContain("\nPrimary Monk, \\[\\[Secret\\]\\] \\#tag.\n");
  });
});

describe("what they were last doing", () => {
  it("is nothing when nothing was typed", () => {
    typed = "   ";
    expect(lastDoingTyped()).toBeNull();
  });

  it("is made inert, so a link or a fact line can't come through", () => {
    typed = " Range: 60 feet [[Secret]] ";
    expect(lastDoingTyped()).toBe("Range\\: 60 feet \\[\\[Secret\\]\\]");
  });

  it("takes 300 characters and refuses 301", () => {
    typed = "a".repeat(300);
    expect(lastDoingTyped()).toBe("a".repeat(300));
    typed = "a".repeat(301);
    expect(refusalOf(lastDoingTyped)).toBe("What they were last doing is longer than 300 characters, so nothing was changed.");
  });

  it("refuses a line break", () => {
    typed = "held\nthe bridge";
    expect(refusalOf(lastDoingTyped)).toBe("What they were last doing has to be one line, so nothing was changed.");
  });
});

describe("writing the record", () => {
  it("makes the Fallen folder, writes the record there through the gate, and reads it back", async () => {
    const vault = new FakeNoteVault();
    await new RecordWriter(vault.gate).put(CAMPAIGN, "Primary Monk", "the record\n");
    expect(vault.createdFolders).toEqual([`${CAMPAIGN}/Fallen`]);
    expect(vault.textAt(`${CAMPAIGN}/Fallen/Primary Monk.md`)).toBe("the record\n");
  });

  it("uses the Fallen folder when it is there already", async () => {
    const vault = new FakeNoteVault();
    vault.folder(`${CAMPAIGN}/Fallen`);
    await new RecordWriter(vault.gate).put(CAMPAIGN, "Primary Monk", "the record\n");
    expect(vault.createdFolders).toEqual([]);
  });

  it("refuses when the character already has a record, whatever its capitals, and writes nothing", async () => {
    const vault = new FakeNoteVault();
    vault.note(`${CAMPAIGN}/Fallen/primary monk.md`, "the old record\n");
    expect(await refusalWhen(new RecordWriter(vault.gate).put(CAMPAIGN, "Primary Monk", "the record\n"))).toBe(
      "primary monk already has a record in Fallen, so nothing was changed. Rename or move that record first.",
    );
    expect(vault.created).toEqual([]);
    expect(vault.textAt(`${CAMPAIGN}/Fallen/primary monk.md`)).toBe("the old record\n");
  });

  it("lets a record of the same name in another campaign be", async () => {
    const vault = new FakeNoteVault();
    vault.note("D&D/Secondary Campaign/Fallen/Primary Monk.md", "the old record\n");
    await new RecordWriter(vault.gate).put(CAMPAIGN, "Primary Monk", "the record\n");
    expect(vault.created).toEqual([`${CAMPAIGN}/Fallen/Primary Monk.md`]);
  });

  it("refuses when the record doesn't read back as it was written", async () => {
    const vault = new FakeNoteVault();
    vault.readBackAs(`${CAMPAIGN}/Fallen/Primary Monk.md`, "changed\n");
    expect(await refusalWhen(new RecordWriter(vault.gate).put(CAMPAIGN, "Primary Monk", "the record\n"))).toBe("Primary Monk's record in Fallen didn't read back as it was written, so nothing else was changed. Look at the record.");
  });

  it("is refused by the gate outside the Campaigns folder", async () => {
    const vault = new FakeNoteVault();
    await expect(new RecordWriter(vault.gate).put("Elsewhere/Primary Campaign", "Primary Monk", "the record\n")).rejects.toThrow(OUTSIDE_FENCE);
    expect(vault.created).toEqual([]);
  });
});
