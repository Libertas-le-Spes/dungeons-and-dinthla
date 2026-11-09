import { describe, expect, it } from "vitest";
import { Fence } from "../../src/fence/fence";
import { FencedFiles } from "../../src/fence/fenced-files";
import { HeldFiles } from "../../src/fence/held-files";
import { refusalForPathParts } from "../../src/fence/safe-path";
import { makeLinkedNote, NO_NAME, UNSAFE_PATH } from "../../src/views/linked-note";
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

  it("makes nothing, not even a folder, for a name that climbs out of the campaign", async () => {
    const { files, calls } = filesWith();
    const refusal = refusalForPathParts("../Private/x");
    expect(refusal).not.toBeNull();
    await expect(makeLinkedNote(files, "D&D/Pale Moon", "D&D/Pale Moon/Places", "../Private/x")).rejects.toThrow(String(refusal));
    expect(calls.create).not.toHaveBeenCalled();
    expect(calls.createFolder).not.toHaveBeenCalled();
  });

  it("makes nothing, not even a folder, for an empty name", async () => {
    const { files, calls } = filesWith();
    await expect(makeLinkedNote(files, "D&D/Pale Moon", "D&D/Pale Moon/Places", "")).rejects.toThrow(NO_NAME);
    expect(calls.create).not.toHaveBeenCalled();
    expect(calls.createFolder).not.toHaveBeenCalled();
  });
});
