import { describe, expect, it } from "vitest";
import { startOfCrossReference } from "../../../src/pdf/file/start-of-cross-reference";
import { TRAILER_WINDOW_BYTES } from "../../../src/pdf/limits/pdf-limits";
import { cursorOver } from "../support/cursors";
import { refusalFrom } from "../support/parsed";

describe("startOfCrossReference", () => {
  it("reads the number after startxref", () => {
    expect(startOfCrossReference(cursorOver("body\nstartxref\n1234\n%%EOF\n"))).toBe(1234);
  });

  it("reads the number after a comment and odd whitespace", () => {
    expect(startOfCrossReference(cursorOver("startxref\r\n%c\n 77\n"))).toBe(77);
  });

  it("takes the last startxref when the file has several", () => {
    expect(startOfCrossReference(cursorOver("startxref\n1\n%%EOF\nstartxref\n2\n%%EOF\n"))).toBe(2);
  });

  it("finds a startxref that begins exactly at the start of the window", () => {
    const tail = "startxref\n5\n".padEnd(TRAILER_WINDOW_BYTES, " ");
    expect(startOfCrossReference(cursorOver("x".repeat(500) + tail))).toBe(5);
  });

  it("refuses a startxref that begins one byte before the window", () => {
    const tail = "startxref\n5\n".padEnd(TRAILER_WINDOW_BYTES + 1, " ");
    expect(refusalFrom(() => startOfCrossReference(cursorOver("x".repeat(500) + tail)))).toContain("no startxref near its end");
  });

  it("refuses a file with no startxref", () => {
    expect(refusalFrom(() => startOfCrossReference(cursorOver("%PDF-1.7\n")))).toContain("no startxref near its end");
  });

  it("refuses a startxref with no number", () => {
    expect(refusalFrom(() => startOfCrossReference(cursorOver("startxref\n%%EOF")))).toContain("is missing");
  });

  it("refuses a file cut off in the middle of the word", () => {
    expect(refusalFrom(() => startOfCrossReference(cursorOver("startxre")))).toContain("no startxref near its end");
  });

  it("refuses a number too long to be an offset", () => {
    expect(refusalFrom(() => startOfCrossReference(cursorOver(`startxref\n${"9".repeat(30)}`)))).toContain("too long");
  });
});
