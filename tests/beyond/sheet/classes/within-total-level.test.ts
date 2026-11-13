import { describe, expect, it } from "vitest";
import { withinTotalLevel } from "../../../../src/beyond/sheet/classes/within-total-level";
import { KnownValue } from "../../../../src/beyond/shape/known-value";
import { CleanLine } from "../../../../src/beyond/text/clean-line";
import type { ImportedClass } from "../../../../src/beyond/shape/imported-class";
import { Pdf } from "../../../../src/beyond/shape/route";

function isKnown(found: ImportedClass): boolean {
  return found.level.isKnown;
}

function explanationOf(found: ImportedClass): string {
  return found.level.explanation;
}

function routeOf(found: ImportedClass): string {
  return found.level.route.name;
}

function nameOf(found: ImportedClass): string {
  return found.name.text;
}

function classAt(level: number) {
  return { name: CleanLine.of("Monk"), level: KnownValue.wholeNumber(level, "", new Pdf()) };
}

describe("the levels of the classes on a sheet", () => {
  it("stand when they add up to the most there can be", () => {
    expect(withinTotalLevel([classAt(20), classAt(20)]).map(isKnown)).toEqual([true, true]);
  });

  it("are all not known, with the reason, when they add up to one more", () => {
    const found = withinTotalLevel([classAt(20), classAt(20), classAt(1)]);
    expect(found.map(isKnown)).toEqual([false, false, false]);
    expect(found.map(explanationOf)).toEqual(Array(3).fill("The total level has to be at most 40."));
  });

  it("are on the PDF route when they are not known", () => {
    expect(withinTotalLevel([classAt(40), classAt(1)]).map(routeOf)).toEqual(["pdf", "pdf"]);
  });

  it("keep the names when the levels are not known", () => {
    expect(withinTotalLevel([classAt(40), classAt(1)]).map(nameOf)).toEqual(["Monk", "Monk"]);
  });
});
