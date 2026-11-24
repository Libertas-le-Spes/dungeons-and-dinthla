import { describe, expect, it, vi } from "vitest";
import { FilePick } from "../../../../src/obsidian/views/mount/file-pick";
import type { ChosenFile } from "../../../../src/views/elements/kinds/fields";
import { obsidianDocument } from "../../../stubs/obsidian-dom";

interface MadeUpFile {
  readonly size: number;
  arrayBuffer(): Promise<ArrayBuffer>;
}

function fileOf(bytes: number[]): MadeUpFile {
  return { size: bytes.length, arrayBuffer: vi.fn(async () => new Uint8Array(bytes).buffer) };
}

function inputHolding(files: { item(position: number): MadeUpFile | null } | null): HTMLInputElement {
  const input = obsidianDocument().createElement("input");
  Object.defineProperty(input, "files", { value: files, configurable: true });
  return input;
}

function listOf(files: MadeUpFile[]): { item(position: number): MadeUpFile | null } {
  return {
    item(position: number): MadeUpFile | null {
      const file = files[position];
      if (file === undefined) return null;
      return file;
    },
  };
}

function picked(input: HTMLInputElement): ChosenFile[] {
  const chosen: ChosenFile[] = [];
  new FilePick(input, { chosen: (file) => void chosen.push(file) }).handleEvent();
  return chosen;
}

describe("picking a file", () => {
  it("hands over the first file's size, and its bytes only when asked", async () => {
    const first = fileOf([1, 2, 3]);
    const second = fileOf([9]);
    const [chosen] = picked(inputHolding(listOf([first, second])));
    expect(chosen?.size).toBe(3);
    expect(first.arrayBuffer).not.toHaveBeenCalled();
    expect(Array.from(await chosen!.bytes())).toEqual([1, 2, 3]);
    expect(second.arrayBuffer).not.toHaveBeenCalled();
  });

  it.each([
    { what: "no list of files", files: null },
    { what: "an empty list", files: listOf([]) },
  ])("hands over nothing when the picker holds $what", ({ files }) => {
    expect(picked(inputHolding(files))).toEqual([]);
  });

  it("listens for the picker's change", () => {
    const input = inputHolding(listOf([fileOf([1])]));
    const chosen = vi.fn();
    new FilePick(input, { chosen }).listen();
    input.dispatchEvent(new (input.ownerDocument.defaultView!).Event("change"));
    expect(chosen).toHaveBeenCalledTimes(1);
  });
});
