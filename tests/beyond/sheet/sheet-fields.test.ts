import { describe, expect, it } from "vitest";
import { SheetFields } from "../../../src/beyond/sheet/sheet-fields";
import { MadeUpSheet } from "../builders/made-up-sheet";

function fieldsWith(name: string, value: string | boolean | string[]): SheetFields {
  return new SheetFields(MadeUpSheet.empty().with(name, value).fields());
}

describe("the fields of a sheet", () => {
  it("give the text of a field", () => {
    expect(fieldsWith("Primary", "Monk").textAt("Primary")).toBe("Monk");
  });

  it("give nothing for a field that is not there", () => {
    expect(fieldsWith("Primary", "Monk").textAt("Secondary")).toBeNull();
  });

  it.each([true, false, ["Monk"]])("give nothing for a field that holds %j instead of text", (held) => {
    expect(fieldsWith("Primary", held).textAt("Primary")).toBeNull();
  });

  it("tell names apart that differ only by a space at the end", () => {
    expect(fieldsWith("Primary ", "Monk").textAt("Primary")).toBeNull();
  });

  it("tell names apart that differ only by a double space", () => {
    expect(fieldsWith("Primary  Class", "Monk").textAt("Primary Class")).toBeNull();
  });

  it("find a name that has its double space", () => {
    expect(fieldsWith("Primary  Class", "Monk").textAt("Primary  Class")).toBe("Monk");
  });

  it("find no field by the name of a prototype key", () => {
    expect(fieldsWith("Primary", "Monk").textAt("constructor")).toBeNull();
  });
});
