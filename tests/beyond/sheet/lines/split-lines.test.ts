import { describe, expect, it } from "vitest";
import { splitLines } from "../../../../src/beyond/sheet/lines/split-lines";

describe("a text split into lines", () => {
  it("splits on a line feed, a carriage return, both, and the unicode breaks", () => {
    expect(splitLines("One\nTwo\rThree\r\nFour Five\u0085Six")).toEqual(["One", "Two", "Three", "Four", "Five", "Six"]);
  });

  it("keeps blank lines, for the tally to skip", () => {
    expect(splitLines("One\n\nTwo")).toEqual(["One", "", "Two"]);
  });

  it("does not split at a vertical tab or a form feed, which are taken out as control characters", () => {
    expect(splitLines("One\u000bTwo\u000cThree")).toEqual(["OneTwoThree"]);
  });
});
