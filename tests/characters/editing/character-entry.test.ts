import { describe, expect, it } from "vitest";
import { CHANGED_IN_NOTE, PROPERTIES_WOULD_CHANGE } from "../../../src/campaign/note-editor";
import {
  entryOf,
  newCharacterText,
  readsBackDifferently,
  refusalForValues,
  blockIdOn,
  commentMarkIn,
  endsInBlockId,
  HIDING_WOULD_CHANGE,
  learnedOf,
  stillReads,
  trimmedEntry,
  valuesChanged,
  withEntryValues,
  withOverrides,
  type CharacterEntry,
} from "../../../src/characters/editing/character-entry";

const PATH = "Pale Moon/Characters/Mira.md";

function entry(values: Partial<CharacterEntry> = {}): CharacterEntry {
  return { name: "Mira", type: "", subtitle: "", speed: "", ...values };
}

function edited(text: string, after: Partial<CharacterEntry>): string {
  const before = entryOf("Mira", PATH, text);
  return withEntryValues(text, PATH, before, { ...before, ...after });
}

describe("entryOf", () => {
  it("reads the type line, subtitle and speed from the character's own note", () => {
    const text = "---\ntags: npc\n---\ntype: Medium humanoid (elf), chaotic good\nSubtitle: Elf Rogue 3, speed: 35 ft.\nShe owes us.";
    expect(entryOf("Mira", PATH, text)).toEqual(entry({ type: "Medium humanoid (elf), chaotic good", subtitle: "Elf Rogue 3", speed: "35 ft." }));
  });

  it("takes the last line that states a value", () => {
    expect(entryOf("Mira", PATH, "speed: 30 ft.\nspeed: 40 ft.")).toEqual(entry({ speed: "40 ft." }));
  });

  it("leaves a value no line states empty", () => {
    expect(entryOf("Mira", PATH, "")).toEqual(entry());
  });
});

describe("learnedOf", () => {
  it("keeps the dialog's values from what the sessions taught, the newest winning", () => {
    const learned = learnedOf([
      { name: "speed", value: "30 ft." },
      { name: "AC", value: "15" },
      { name: "Speed", value: "35 ft." },
    ]);
    expect([...learned]).toEqual([["speed", "35 ft."]]);
  });
});

describe("trimmedEntry", () => {
  it("trims every field", () => {
    expect(trimmedEntry({ name: " Mira ", type: " elf ", subtitle: " Rogue ", speed: " 30 ft. " })).toEqual(
      entry({ type: "elf", subtitle: "Rogue", speed: "30 ft." }),
    );
  });
});

describe("refusalForValues", () => {
  it("accepts values that read back as typed", () => {
    expect(refusalForValues(entry({ type: "Medium humanoid (human), lawful good", speed: "30 ft., fly 60 ft." }))).toBeNull();
  });

  it("refuses a value that would read back with a comma lost", () => {
    expect(refusalForValues(entry({ speed: "30 ft.,, fly 60 ft." }))).toBe(readsBackDifferently("Speed"));
  });

  it("refuses a value with a comment mark, which would hide the rest of the note", () => {
    expect(refusalForValues(entry({ speed: "40 ft. %%" }))).toBe(commentMarkIn("Speed"));
  });

  it("refuses a value that ends in a block id", () => {
    expect(refusalForValues(entry({ speed: "40 ft. ^stats" }))).toBe(endsInBlockId("Speed"));
    expect(refusalForValues(entry({ speed: "40 ft. ^" }))).toBeNull();
  });

  it("refuses a value that would read back as two", () => {
    expect(refusalForValues(entry({ subtitle: "Elf Rogue 3, AC: 15" }))).toBe(readsBackDifferently("Subtitle"));
  });
});

describe("newCharacterText", () => {
  it("writes a line for each value given", () => {
    expect(newCharacterText(entry({ type: "Small humanoid (halfling)", speed: "25 ft." }))).toBe("type: Small humanoid (halfling)\nspeed: 25 ft.\n");
  });

  it("is empty when no value is given", () => {
    expect(newCharacterText(entry())).toBe("");
  });
});

describe("valuesChanged", () => {
  it("ignores the name", () => {
    expect(valuesChanged(entry(), entry({ name: "Mirabel" }))).toBe(false);
    expect(valuesChanged(entry(), entry({ speed: "30 ft." }))).toBe(true);
  });
});

describe("withEntryValues", () => {
  it("rewrites the line that states a value on its own, keeping its bullet", () => {
    expect(edited("Notes\n- speed: 30 ft.\nmore", { speed: "40 ft." })).toBe("Notes\n- speed: 40 ft.\nmore");
  });

  it("removes the line that states a cleared value on its own", () => {
    expect(edited("subtitle: Elf Rogue 3\nShe owes us.", { subtitle: "" })).toBe("She owes us.");
  });

  it("adds a line for a value the note doesn't state", () => {
    expect(edited("She owes us.", { type: "Medium humanoid (elf)" })).toBe("She owes us.\ntype: Medium humanoid (elf)\n");
  });

  it("adds a line after a line that shares the value with others, leaving that line", () => {
    expect(edited("AC: 15, speed: 30 ft.\n", { speed: "40 ft." })).toBe("AC: 15, speed: 30 ft.\nspeed: 40 ft.\n");
  });

  it("refuses to clear a value on a line with others", () => {
    expect(() => edited("AC: 15, speed: 30 ft.\n", { speed: "" })).toThrow(stillReads("Speed", "30 ft."));
  });

  it("removes every line that states a cleared value on its own, so an older one can't come back", () => {
    expect(edited("speed: 30 ft.\nShe owes us.\nspeed: 40 ft.\n", { speed: "" })).toBe("She owes us.\n");
  });

  it("refuses to clear a value an earlier line with others would bring back", () => {
    expect(() => edited("AC: 15, speed: 30 ft.\nspeed: 40 ft.\n", { speed: "" })).toThrow(stillReads("Speed", "30 ft."));
  });

  it("adds a line when a later line with others states the value", () => {
    expect(edited("speed: 30 ft.\nAC: 15, speed: 35 ft.\n", { speed: "40 ft." })).toBe("speed: 30 ft.\nAC: 15, speed: 35 ft.\nspeed: 40 ft.\n");
  });

  it("refuses to rewrite a line that ends in a block id", () => {
    expect(() => edited("Speed: 30 ft. ^blk\n", { speed: "40 ft." })).toThrow(blockIdOn("Speed"));
  });

  it("refuses to remove a line that ends in a block id", () => {
    expect(() => edited("speed: 25 ft.\nSpeed: 30 ft. ^blk\n", { speed: "" })).toThrow(blockIdOn("Speed"));
  });

  it("leaves a line with a block id that it doesn't change", () => {
    expect(edited("type: elf ^blk\nspeed: 30 ft.\n", { speed: "40 ft." })).toBe("type: elf ^blk\nspeed: 40 ft.\n");
  });

  it("adds a line rather than write inside a code block", () => {
    expect(edited("```\nspeed: 30 ft.\n```\n", { speed: "40 ft." })).toBe("```\nspeed: 30 ft.\n```\nspeed: 40 ft.\n");
  });

  it("adds a line rather than write inside a comment", () => {
    expect(edited("%%\nspeed: 30 ft.\n%%\n", { speed: "40 ft." })).toBe("%%\nspeed: 30 ft.\n%%\nspeed: 40 ft.\n");
  });

  it("refuses to clear a value only a code block states", () => {
    expect(() => edited("```\nspeed: 30 ft.\n```\n", { speed: "" })).toThrow(stillReads("Speed", "30 ft."));
  });

  it("leaves values that weren't changed", () => {
    expect(edited("Speed:30 ft.\ntype: elf\n", { type: "half-elf" })).toBe("Speed:30 ft.\ntype: half-elf\n");
  });

  it("refuses when the note changed the value since the dialog read it", () => {
    const before = entry({ speed: "30 ft." });
    expect(() => withEntryValues("speed: 25 ft.\n", PATH, before, entry({ speed: "40 ft." }))).toThrow(CHANGED_IN_NOTE);
  });

  it("changes one value even when another changed in the note since the dialog read it", () => {
    const before = entry({ speed: "30 ft." });
    expect(withEntryValues("speed: 25 ft.\n", PATH, before, entry({ speed: "30 ft.", type: "elf" }))).toBe("speed: 25 ft.\ntype: elf\n");
  });

  it("refuses to add a line inside a comment that never closes", () => {
    expect(() => edited("Notes\n%%\nunfinished", { type: "elf" })).toThrow(HIDING_WOULD_CHANGE);
  });

  it("refuses to add a line inside a code block that never closes", () => {
    expect(() => edited("Notes\n```\nunfinished\n", { type: "elf" })).toThrow(HIDING_WOULD_CHANGE);
  });

  it("refuses a change that would turn a kept line into code", () => {
    expect(() => edited("\nspeed: 30 ft.\n    four spaces in\n", { speed: "" })).toThrow(HIDING_WOULD_CHANGE);
  });

  it("adds a line after a code block that ends the note without a line break", () => {
    expect(edited("Notes\n```\ncode\n```", { type: "elf" })).toBe("Notes\n```\ncode\n```\ntype: elf\n");
  });

  it("adds a line after a comment that closes", () => {
    expect(edited("%%\naside\n%%\n", { type: "elf" })).toBe("%%\naside\n%%\ntype: elf\n");
  });

  it("refuses a change that would turn lines into properties", () => {
    expect(() => edited("type: elf\n---\nsecret: yes\n---\n", { type: "" })).toThrow(PROPERTIES_WOULD_CHANGE);
  });

  it("keeps the note's properties when writing below them", () => {
    expect(edited("---\ntags: npc\n---\nspeed: 30 ft.\n", { speed: "" })).toBe("---\ntags: npc\n---\n");
  });
});

describe("withOverrides", () => {
  it("rewrites any value, whatever the capitals it was written with", () => {
    const change = { name: "Patron", label: "Patron", before: "Lady Vess", after: "the Duke" };
    expect(withOverrides("patron: Lady Vess\n", PATH, [change])).toBe("Patron: the Duke\n");
  });

  it("refuses when the note changed the value since it was read", () => {
    const change = { name: "AC", label: "Armor Class", before: "15", after: "16" };
    expect(() => withOverrides("AC: 14\n", PATH, [change])).toThrow(CHANGED_IN_NOTE);
  });

  it("writes ? to mark a value not known", () => {
    const change = { name: "HP", label: "Hit Points", before: "", after: "?" };
    expect(withOverrides("AC: 14\n", PATH, [change])).toBe("AC: 14\nHP: ?\n");
  });
});
