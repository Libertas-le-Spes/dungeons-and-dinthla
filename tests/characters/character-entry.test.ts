import { describe, expect, it } from "vitest";
import { CHANGED_IN_NOTE, PROPERTIES_WOULD_CHANGE } from "../../src/campaign/note-editor";
import {
  entryOf,
  newCharacterText,
  readsBackDifferently,
  refusalForValues,
  sharedLine,
  trimmedEntry,
  valuesChanged,
  withEntryValues,
  type CharacterEntry,
} from "../../src/characters/character-entry";

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
    expect(() => edited("AC: 15, speed: 30 ft.\n", { speed: "" })).toThrow(sharedLine("Speed"));
  });

  it("leaves values that weren't changed", () => {
    expect(edited("speed: 30 ft.\ntype: elf\n", { type: "half-elf" })).toBe("speed: 30 ft.\ntype: half-elf\n");
  });

  it("refuses when the note changed the value since the dialog read it", () => {
    const before = entry({ speed: "30 ft." });
    expect(() => withEntryValues("speed: 25 ft.\n", PATH, before, entry({ speed: "40 ft." }))).toThrow(CHANGED_IN_NOTE);
  });

  it("refuses a change that would turn lines into properties", () => {
    expect(() => edited("type: elf\n---\nsecret: yes\n---\n", { type: "" })).toThrow(PROPERTIES_WOULD_CHANGE);
  });

  it("keeps the note's properties when writing below them", () => {
    expect(edited("---\ntags: npc\n---\nspeed: 30 ft.\n", { speed: "" })).toBe("---\ntags: npc\n---\n");
  });
});
