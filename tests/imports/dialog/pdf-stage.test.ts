import { afterEach, describe, expect, it } from "vitest";
import type { SheetFromPdf } from "../../../src/beyond/sheet/from-pdf/sheet-from-pdf";
import { STILL_READING } from "../../../src/imports/dialog/import-words";
import { DialogShown } from "../../../src/imports/dialog/stages/dialog-shown";
import { PdfStage, type SheetArrival, type SheetReader } from "../../../src/imports/dialog/stages/pdf-stage";
import { obsidianDocument } from "../../stubs/obsidian-dom";

class WaitingReader implements SheetReader {
  reads = 0;

  sheetOf(): Promise<SheetFromPdf> {
    this.reads += 1;
    return new Promise(neverSettles);
  }
}

class NoArrival implements SheetArrival {
  sheetRead(): void {}
}

function neverSettles(): void {}

function textsIn(root: HTMLElement, selector: string): string[] {
  const texts: string[] = [];
  for (const element of root.querySelectorAll(selector)) texts.push(String(element.textContent));
  return texts;
}

afterEach(() => {
  obsidianDocument().body.replaceChildren();
});

describe("PdfStage while the first file is still being read", () => {
  it("says it is still reading the first file, and does not read the second", () => {
    const root = obsidianDocument().createElement("div");
    const reader = new WaitingReader();
    const stage = new PdfStage(root, new DialogShown(), new NoArrival(), reader);
    stage.pdfPicked(new Uint8Array([1]));
    stage.pdfPicked(new Uint8Array([2]));
    expect(textsIn(root, ".dd-still-reading")).toEqual([STILL_READING]);
    expect(STILL_READING).toBe("Still reading the first file.");
    expect(reader.reads).toBe(1);
  });
});

