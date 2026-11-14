import { describe, expect, it } from "vitest";
import { TextWrite } from "../../../src/imports/leaving/writes/text-write";
import { FakeNoteVault } from "../builders/fake-note-vault";
import { refusalWhen } from "./leaving-table";

const PATH = "D&D/Primary Campaign/Characters/Primary Monk.md";

describe("a planned text write", () => {
  it("writes the planned text when the note is as it was read", async () => {
    const vault = new FakeNoteVault();
    const file = vault.note(PATH, "before\n");
    await new TextWrite(vault.gate, file, "before\n", "after\n", "done", "failed").apply();
    expect(vault.textAt(PATH)).toBe("after\n");
  });

  it("refuses, leaving the note as it is, when the note changed since it was read", async () => {
    const vault = new FakeNoteVault();
    const file = vault.note(PATH, "changed meanwhile\n");
    const write = new TextWrite(vault.gate, file, "before\n", "after\n", "done", "failed");
    expect(await refusalWhen(write.apply())).toContain("Refusal:");
    expect(vault.textAt(PATH)).toBe("changed meanwhile\n");
  });
});
