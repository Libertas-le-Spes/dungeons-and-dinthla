import type { ImportedNumber } from "../../shape/imported-number";
import type { NumberRange } from "../../shape/number-range";
import type { SheetFields } from "../sheet-fields";
import type { NumberText } from "./number-text";
import { PrintedNumber } from "./printed-number";

export class NumberRow {
  private readonly printed: PrintedNumber;

  constructor(
    readonly name: string,
    fieldName: string,
    range: NumberRange,
    text: NumberText,
  ) {
    this.printed = new PrintedNumber(fieldName, range, text);
  }

  read(fields: SheetFields): ImportedNumber {
    return { name: this.name, value: this.printed.read(fields) };
  }
}
