import { describe, expect, it } from "vitest";
import { boxTextOf, diskTextFor } from "../../../src/campaign/writing/disk-text";

const BOM = "﻿";

describe("boxTextOf", () => {
  it("is a note's text as a box shows it: no mark at its start, and every line ending a plain new line", () => {
    expect(boxTextOf(`${BOM}The wheel turns.\r\nLady Vess owns it.\rRain.\n`)).toBe("The wheel turns.\nLady Vess owns it.\nRain.\n");
  });

  it("leaves a note with plain new lines and no mark as it is", () => {
    expect(boxTextOf("The wheel turns.\nLady Vess owns it.")).toBe("The wheel turns.\nLady Vess owns it.");
  });

  it("keeps a mark that isn't at the note's start", () => {
    expect(boxTextOf(`The wheel ${BOM}turns.`)).toBe(`The wheel ${BOM}turns.`);
  });
});

describe("diskTextFor", () => {
  it("writes a box's text with the note's own Windows line endings", () => {
    expect(diskTextFor("The wheel turns.\nRain.\n", "The wheel.\r\nStill.")).toBe("The wheel turns.\r\nRain.\r\n");
  });

  it("puts back the mark the note started with", () => {
    expect(diskTextFor("The wheel turns.\nRain.", `${BOM}The wheel.\r\n`)).toBe(`${BOM}The wheel turns.\r\nRain.`);
  });

  it("writes plain new lines and no mark for a note that had neither", () => {
    expect(diskTextFor("The wheel turns.\r\nRain.", "The wheel.\nStill.")).toBe("The wheel turns.\nRain.");
  });
});
