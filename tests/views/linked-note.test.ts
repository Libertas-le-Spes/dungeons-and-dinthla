import { describe, expect, it } from "vitest";
import { Fence } from "../../src/fence/fence";
import { FencedFiles } from "../../src/fence/fenced-files";
import { HeldFiles } from "../../src/fence/held-files";
import { makeLinkedNote, UNSAFE_PATH } from "../../src/views/linked-note";
import { rawVaultWith } from "../fence/fake-raw-vault";

function filesWith() {
  const { vault, calls } = rawVaultWith([]);
  return { files: new FencedFiles(vault, new HeldFiles(vault, new Fence(() => "D&D", ".obsidian"))), calls };
}

describe("makeLinkedNote", () => {
  it("makes the note in a folder inside the campaign", async () => {
    const { files, calls } = filesWith();
    await makeLinkedNote(files, "D&D/Pale Moon", "D&D/Pale Moon/Places", "Old Mill");
    expect(calls.create).toHaveBeenCalledWith("D&D/Pale Moon/Places/Old Mill.md", "");
  });

  it("makes nothing in a folder outside the campaign, even one inside the Campaigns folder", async () => {
    const { files, calls } = filesWith();
    await expect(makeLinkedNote(files, "D&D/Pale Moon", "D&D/Ashen Road", "Old Mill")).rejects.toThrow(UNSAFE_PATH);
    await expect(makeLinkedNote(files, "D&D/Pale Moon", "D&D/Pale Moon Old", "Old Mill")).rejects.toThrow(UNSAFE_PATH);
    expect(calls.create).not.toHaveBeenCalled();
    expect(calls.createFolder).not.toHaveBeenCalled();
  });
});
