import { describe, expect, it } from "vitest";
import type { SessionNote } from "../../../src/campaign/record/campaign";
import { sessionNoteOf } from "../../../src/campaign/paths/session-file";
import { ALREADY_ON_FUNDS_PAGE, NOT_READ_AS_THE_ITEM, refusalForTracking } from "../../../src/funds/tracking/tracking-refusal";

const ONE = "Pale Moon/Sessions/Session 1.md";

function sessionsWith(text: string): SessionNote[] {
  return [sessionNoteOf(ONE, 1, text)];
}

function rope(line: string): { line: string; written: string; key: string; holderName: string } {
  return { line, written: "Rope", key: "rope", holderName: "Primary Monk" };
}

describe("the check before an item is tracked", () => {
  it("lets one new item through, held by him, with the rest as it was", () => {
    expect(refusalForTracking(sessionsWith("$ Lantern\n$ +5 gp\n"), rope("$ [[Primary Monk]] Rope"), ONE)).toBeNull();
  });

  it("refuses an item already on the page, by name with any capitals", () => {
    expect(refusalForTracking(sessionsWith("$ ROPE\n"), rope("$ [[Primary Monk]] Rope"), ONE)).toBe(ALREADY_ON_FUNDS_PAGE);
  });

  it("refuses a line that would give the item to someone else", () => {
    expect(refusalForTracking(sessionsWith("We camped.\n"), rope("$ [[Secondary]] Rope"), ONE)).toBe(NOT_READ_AS_THE_ITEM);
  });

  it("refuses a line that names him without a link", () => {
    expect(refusalForTracking(sessionsWith("We camped.\n"), rope("$$ Rope :changed to Primary Monk"), ONE)).toBe(NOT_READ_AS_THE_ITEM);
  });

  it("refuses a line that would leave the item gone", () => {
    expect(refusalForTracking(sessionsWith("We camped.\n"), rope("$$ Rope :lost"), ONE)).toBe(NOT_READ_AS_THE_ITEM);
  });

  it("refuses a line that would be read as coin, with no item", () => {
    expect(refusalForTracking(sessionsWith("We camped.\n"), rope("$ [[Primary Monk]] Rope 10 gp"), ONE)).toBe(NOT_READ_AS_THE_ITEM);
  });

  it("refuses a line that would also change another item", () => {
    expect(refusalForTracking(sessionsWith("$ Lantern\n"), { line: "$$ Lantern :changed to [[Primary Monk]]", written: "Lantern", key: "rope", holderName: "Primary Monk" }, ONE)).toBe(
      NOT_READ_AS_THE_ITEM,
    );
  });

  it("refuses a line that would name the item otherwise than as the note holds it", () => {
    expect(refusalForTracking(sessionsWith("We camped.\n"), { line: "$ [[Primary Monk]] Rope", written: "Rope\\_coil", key: "rope", holderName: "Primary Monk" }, ONE)).toBe(NOT_READ_AS_THE_ITEM);
  });

  it("refuses when the session isn't among those read, so nothing would be added", () => {
    expect(refusalForTracking(sessionsWith("We camped.\n"), rope("$ [[Primary Monk]] Rope"), "Pale Moon/Sessions/Session 9.md")).toBe(NOT_READ_AS_THE_ITEM);
  });
});
