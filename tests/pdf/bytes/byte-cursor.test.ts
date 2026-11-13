import { describe, expect, it } from "vitest";
import { ByteCursor } from "../../../src/pdf/bytes/byte-cursor";
import { NO_BYTE } from "../../../src/pdf/bytes/byte-codes";
import { WorkBudget } from "../../../src/pdf/work/work-budget";
import { bytesOfText, cursorOver } from "../support/cursors";
import { refusalFrom } from "../support/parsed";

describe("ByteCursor", () => {
  it("reads the byte it stands on and the ones ahead", () => {
    const cursor = cursorOver("abc");
    expect(cursor.current()).toBe(97);
    expect(cursor.peek(2)).toBe(99);
  });

  it("says there is no byte at the end and past it", () => {
    const cursor = cursorOver("a");
    cursor.advance();
    expect(cursor.isAtEnd()).toBe(true);
    expect(cursor.current()).toBe(NO_BYTE);
    expect(cursor.peek(5)).toBe(NO_BYTE);
  });

  it("says there is no byte before where it started", () => {
    const cursor = new ByteCursor(bytesOfText("xxabc"), new WorkBudget(5, () => 0), 2);
    expect(cursor.peek(-1)).toBe(NO_BYTE);
    expect(cursor.position()).toBe(0);
    expect(cursor.length()).toBe(3);
  });

  it("counts positions from where it started", () => {
    const cursor = new ByteCursor(bytesOfText("xxabc"), new WorkBudget(5, () => 0), 2);
    cursor.advance();
    expect(cursor.position()).toBe(1);
    cursor.moveTo(2);
    expect(cursor.current()).toBe(99);
  });

  it("stays at the end when told to advance there, and still spends a step", () => {
    const work = new WorkBudget(1, () => 0);
    const cursor = new ByteCursor(bytesOfText("a"), work, 0);
    cursor.advance();
    cursor.advance();
    expect(cursor.position()).toBe(1);
    expect(work.stepsTaken()).toBe(2);
  });

  it("spends one step for each advance and none for looking", () => {
    const work = new WorkBudget(10, () => 0);
    const cursor = new ByteCursor(bytesOfText("abcdef"), work, 0);
    cursor.peek(1);
    cursor.current();
    cursor.startsWith("ab");
    cursor.advance();
    cursor.advance();
    expect(work.stepsTaken()).toBe(2);
  });

  it("moves to the end exactly", () => {
    const cursor = cursorOver("abc");
    cursor.moveTo(3);
    expect(cursor.isAtEnd()).toBe(true);
  });

  it.each([-1, 4, 1.5, Number.NaN, Number.MAX_SAFE_INTEGER + 2])("refuses to move to %s", (place) => {
    expect(refusalFrom(() => cursorOver("abc").moveTo(place))).toContain("outside itself");
  });

  it("matches a word where it stands, and only there", () => {
    const cursor = cursorOver("xref 1");
    expect(cursor.startsWith("xref")).toBe(true);
    expect(cursor.startsWith("xrex")).toBe(false);
    expect(cursor.startsWith("xref 1 more")).toBe(false);
  });
});
