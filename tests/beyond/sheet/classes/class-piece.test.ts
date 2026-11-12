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

  it.each(["Monk 0", "Monk 21"])("has no level known for %j, which is outside 1 to 20", (piece) => {
    expect(classOfPiece(piece)?.level.isKnown).toBe(false);
  });

  it.each(["Monk 1", "Monk 20"])("has a level known for %j, at the edge", (piece) => {
    expect(classOfPiece(piece)?.level.isKnown).toBe(true);
  });

  it("takes markup out of the name", () => {
    expect(classOfPiece("<b>Monk</b> 3")?.name.text).toBe("Monk");
  });

  it.each(["", "   ", "<i></i> 3"])("is nothing for %j", (piece) => {
    expect(classOfPiece(piece)).toBeNull();
  });

  it("refuses a piece longer than a line", () => {
    expect(() => classOfPiece(`${"x".repeat(301)} 3`)).toThrow("A line of text is over the limit");
  });
});
