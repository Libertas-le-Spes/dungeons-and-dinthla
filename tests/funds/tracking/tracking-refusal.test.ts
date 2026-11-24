import { describe, expect, it } from "vitest";
import type { SessionNote } from "../../../src/campaign/record/campaign";
import { sessionNoteOf } from "../../../src/campaign/paths/session-file";
import { ALREADY_ON_FUNDS_PAGE, NOT_READ_AS_THE_ITEM, refusalForTracking } from "../../../src/funds/tracking/tracking-refusal";
import { STUB_SYNTAX } from "../../host/stub-syntax";

const ONE = "Pale Moon/Sessions/Session 1.md";
const TWO_OF_A_NAME = "$ Rope \\_x\n$$ Rope \\_x :lost\n$ Rope _x\n$$ Rope _x :sold\n";

function sessionsWith(text: string): SessionNote[] {
  return [sessionNoteOf(ONE, 1, text, STUB_SYNTAX)];
}

function rope(line: string): { line: string; written: string; key: string; holderName: string } {
  return { line, written: "Rope", key: "rope", holderName: "Primary Monk" };
}

describe("the check before an item is tracked", () => {
  it("lets one new item through, held by him, with the rest as it was", () => {
    expect(refusalForTracking(sessionsWith("$ Lantern\n$ +5 gp\n"), rope("$ [[Primary Monk]] Rope"), ONE, STUB_SYNTAX)).toBeNull();
  });

  it("refuses an item already on the page, by name with any capitals", () => {
    expect(refusalForTracking(sessionsWith("$ ROPE\n"), rope("$ [[Primary Monk]] Rope"), ONE, STUB_SYNTAX)).toBe(ALREADY_ON_FUNDS_PAGE);
  });

  it("refuses a line that would give the item to someone else", () => {
    expect(refusalForTracking(sessionsWith("We camped.\n"), rope("$ [[Secondary]] Rope"), ONE, STUB_SYNTAX)).toBe(NOT_READ_AS_THE_ITEM);
  });

  it("refuses a line that names him without a link", () => {
    expect(refusalForTracking(sessionsWith("We camped.\n"), rope("$$ Rope :changed to Primary Monk"), ONE, STUB_SYNTAX)).toBe(NOT_READ_AS_THE_ITEM);
  });

  it("refuses a line that would leave the item gone", () => {
    expect(refusalForTracking(sessionsWith("We camped.\n"), rope("$$ Rope :lost"), ONE, STUB_SYNTAX)).toBe(NOT_READ_AS_THE_ITEM);
  });

  it("refuses a line that would be read as coin, with no item", () => {
    expect(refusalForTracking(sessionsWith("We camped.\n"), rope("$ [[Primary Monk]] Rope 10 gp"), ONE, STUB_SYNTAX)).toBe(NOT_READ_AS_THE_ITEM);
  });

  it("refuses a line that would also change another item", () => {
    expect(refusalForTracking(sessionsWith("$ Lantern\n"), { line: "$$ Lantern :changed to [[Primary Monk]]", written: "Lantern", key: "rope", holderName: "Primary Monk" }, ONE, STUB_SYNTAX)).toBe(
      NOT_READ_AS_THE_ITEM,
    );
  });

  it("refuses a change that adds the item and also takes another one away", () => {
    expect(refusalForTracking(sessionsWith("$ Lantern\n"), rope("$ [[Primary Monk]] Rope\n$$ Lantern :lost"), ONE, STUB_SYNTAX)).toBe(NOT_READ_AS_THE_ITEM);
  });

  it("lets one of two gone items of the same name be tracked again, the other left as it was", () => {
    const tracked = { line: "$ [[Primary Monk]] Rope \\_x", written: "Rope \\_x", key: "rope _x", holderName: "Primary Monk" };
    expect(refusalForTracking(sessionsWith(TWO_OF_A_NAME), tracked, ONE, STUB_SYNTAX)).toBeNull();
  });

  it("refuses tracking one of two gone items of the same name when the line also alters the other", () => {
    const tracked = { line: "$ [[Primary Monk]] Rope \\_x\n$$ Rope _x :lost", written: "Rope \\_x", key: "rope _x", holderName: "Primary Monk" };
    expect(refusalForTracking(sessionsWith(TWO_OF_A_NAME), tracked, ONE, STUB_SYNTAX)).toBe(NOT_READ_AS_THE_ITEM);
  });

  it("lets an item used, sold or lost be tracked again, held by him", () => {
    expect(refusalForTracking(sessionsWith("$ Rope\n$$ Rope :lost\n"), rope("$ [[Primary Monk]] Rope"), ONE, STUB_SYNTAX)).toBeNull();
  });

  it("refuses a line that would name the item otherwise than as the note holds it", () => {
    expect(refusalForTracking(sessionsWith("We camped.\n"), { line: "$ [[Primary Monk]] Rope", written: "Rope\\_coil", key: "rope", holderName: "Primary Monk" }, ONE, STUB_SYNTAX)).toBe(NOT_READ_AS_THE_ITEM);
  });

  it("refuses when the session isn't among those read, so nothing would be added", () => {
    expect(refusalForTracking(sessionsWith("We camped.\n"), rope("$ [[Primary Monk]] Rope"), "Pale Moon/Sessions/Session 9.md", STUB_SYNTAX)).toBe(NOT_READ_AS_THE_ITEM);
  });
});
