import { afterEach, describe, expect, it, vi } from "vitest";
import * as oneProperty from "../../../src/imports/leaving/properties/one-property";
import { PropertySetter } from "../../../src/imports/leaving/properties/property-setter";
import { FakeNoteVault } from "../builders/fake-note-vault";

const NOTE = "D&D/Primary Campaign/Characters/Primary Monk.md";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("setting one property", () => {
  it("writes the note with that property changed", async () => {
    const vault = new FakeNoteVault();
    const file = vault.note(NOTE, "---\nstanding: backup\n---\nText\n");
    await new PropertySetter(vault.gate).set(file, "standing", "standing: died");
    expect(vault.textAt(NOTE)).toBe("---\nstanding: died\n---\nText\n");
  });

  it("writes nothing when nothing would change", async () => {
    const vault = new FakeNoteVault();
    const file = vault.note(NOTE, "Text\n");
    await new PropertySetter(vault.gate).set(file, "standing", null);
    expect(vault.processed).toEqual([]);
  });

  it("refuses and writes nothing when the new text would change more than the property", async () => {
    const vault = new FakeNoteVault();
    const file = vault.note(NOTE, "---\nstanding: backup\n---\nText\n");
    vi.spyOn(oneProperty, "withPropertyLine").mockReturnValue("---\nstanding: died\n---\nOther text\n");
    await expect(new PropertySetter(vault.gate).set(file, "standing", "standing: died")).rejects.toThrow("Changing standing would change more of the note than that property");
    expect(vault.processed).toEqual([]);
  });
});
