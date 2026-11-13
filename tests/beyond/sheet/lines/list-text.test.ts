import { describe, expect, it } from "vitest";
import { listTextAt, listTextsAt } from "../../../../src/beyond/sheet/lines/list-text";
import { SheetFields } from "../../../../src/beyond/sheet/sheet-fields";
import { MadeUpSheet } from "../../builders/made-up-sheet";

function fieldsOf(sheet: MadeUpSheet): SheetFields {
  return new SheetFields(sheet.fields());
}

describe("the text of a list field", () => {
  it("is the text of the field", () => {
    expect(listTextAt(fieldsOf(MadeUpSheet.empty().with("One", "a")), "One")).toBe("a");
  });

  it("is nothing when the field is missing or holds no text", () => {
    const fields = fieldsOf(MadeUpSheet.empty().with("One", true));
    expect([listTextAt(fields, "One"), listTextAt(fields, "Two")]).toEqual([null, null]);
  });

  it("is kept at 8,000 characters", () => {
    expect(listTextAt(fieldsOf(MadeUpSheet.empty().with("One", "x".repeat(8000))), "One")).toHaveLength(8000);
  });

  it("is refused at 8,001 characters, before any line is made", () => {
    expect(() => listTextAt(fieldsOf(MadeUpSheet.empty().with("One", "x".repeat(8001))), "One")).toThrow("A list field of the sheet is over the limit of 8000 characters.");
  });

  it("is refused for a field of a million line breaks", () => {
    expect(() => listTextAt(fieldsOf(MadeUpSheet.empty().with("One", "\n".repeat(1_000_000))), "One")).toThrow("A list field of the sheet is over the limit");
  });
});

describe("the texts of several list fields", () => {
  const fields = fieldsOf(MadeUpSheet.empty().with("One", "a").with("Two", true).with("Four", "d"));

  it("are those of the fields that hold text, in the order asked for", () => {
    expect(listTextsAt(fields, ["Four", "Two", "Three", "One"])).toEqual(["d", "a"]);
  });

  it("are refused when any one is over the limit", () => {
    const long = fieldsOf(MadeUpSheet.empty().with("One", "a").with("Two", "x".repeat(8001)));
    expect(() => listTextsAt(long, ["One", "Two"])).toThrow(Error);
  });
});
