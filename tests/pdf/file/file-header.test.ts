import { describe, expect, it } from "vitest";
import { headerPosition } from "../../../src/pdf/file/file-header";
import { HEADER_WINDOW_BYTES } from "../../../src/pdf/limits/pdf-limits";
import { bytesOfText, budgetFor } from "../support/cursors";
import { refusalFrom } from "../support/parsed";

function positionIn(text: string): number {
  const bytes = bytesOfText(text);
  return headerPosition(bytes, budgetFor(bytes.byteLength));
}

describe("headerPosition", () => {
  it("finds the header at the start", () => {
    expect(positionIn("%PDF-1.7\nrest")).toBe(0);
  });

  it("finds a header after some bytes before it", () => {
    expect(positionIn("junk\n%PDF-1.4\n")).toBe(5);
  });

  it("finds a header that starts at the last place inside the window", () => {
    expect(positionIn("x".repeat(HEADER_WINDOW_BYTES - 1) + "%PDF-1.7")).toBe(HEADER_WINDOW_BYTES - 1);
  });

  it("refuses a header that starts one byte past the window", () => {
    expect(refusalFrom(() => positionIn("x".repeat(HEADER_WINDOW_BYTES) + "%PDF-1.7"))).toContain("not a PDF file");
  });

  it.each(["%PDF-", "%PDF-1", "%PDF-1.", "%PDF-x.7", "%PDF-1,7", "%PDF 1.7", "%pdf-1.7", "PDF-1.7", ""])("refuses %j as a header", (text) => {
    expect(refusalFrom(() => positionIn(text))).toContain("not a PDF file");
  });

  it("takes the first header when two are there", () => {
    expect(positionIn("%PDF-1.7\n%PDF-1.4")).toBe(0);
  });

  it("skips a mark with no version after it and finds the next one", () => {
    expect(positionIn("%PDF-x\n%PDF-1.7")).toBe(7);
  });
});
