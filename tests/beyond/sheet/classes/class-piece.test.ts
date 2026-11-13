import { describe, expect, it } from "vitest";
import { classOfPiece } from "../../../../src/beyond/sheet/classes/class-piece";

describe("one class and level printed on the sheet", () => {
  it("is the class and its level, on the PDF route", () => {
    const found = classOfPiece("Monk 4");
    expect([found?.name.text, found?.level.valueOr(0), found?.level.route.name]).toEqual(["Monk", 4, "pdf"]);
  });

  it("keeps a class name of several words", () => {
    expect(classOfPiece(" Blood Hunter  7 ")?.name.text).toBe("Blood Hunter");
  });

  it("keeps a name with a subclass in brackets", () => {
    expect(classOfPiece("Monk (Primary Way) 2")?.name.text).toBe("Monk (Primary Way)");
  });

  it("is a class with no level known when no level follows", () => {
    const found = classOfPiece("Monk");
    expect([found?.name.text, found?.level.isKnown, found?.level.explanation]).toEqual(["Monk", false, "The sheet gives no level after this class."]);
  });

  it("takes the level only from the end of the piece", () => {
    const found = classOfPiece("Monk 4 (Open Hand)");
    expect([found?.name.text, found?.level.isKnown]).toEqual(["Monk 4 (Open Hand)", false]);
  });

  it("takes the last number as the level and leaves an earlier one in the name", () => {
    const found = classOfPiece("Monk 3 4");
    expect([found?.name.text, found?.level.valueOr(0)]).toEqual(["Monk 3", 4]);
  });

  it("is on the PDF route when the level is not known and when it is", () => {
    expect([classOfPiece("Monk")?.level.route.name, classOfPiece("Monk 3")?.level.route.name]).toEqual(["pdf", "pdf"]);
  });

  it.each(["Monk 0", "Monk 21"])("has no level known for %j, which is outside 1 to 20", (piece) => {
    expect(classOfPiece(piece)?.level.isKnown).toBe(false);
  });

  it.each(["Monk 1", "Monk 20"])("has a level known for %j, at the edge", (piece) => {
    expect(classOfPiece(piece)?.level.isKnown).toBe(true);
  });

  it.each(["", "   ", "<br> 3", "⠀ 3", "́ 3", "-- 3"])("is nothing for %j, which names no class", (piece) => {
    expect(classOfPiece(piece)).toBeNull();
  });

  it("is nothing for a name of 101 characters, which is too long to keep", () => {
    expect(classOfPiece(`${"x".repeat(101)} 3`)).toBeNull();
  });

  it("is a class of a name of 100 characters", () => {
    expect(classOfPiece(`${"x".repeat(100)} 3`)?.name.text).toHaveLength(100);
  });
});
