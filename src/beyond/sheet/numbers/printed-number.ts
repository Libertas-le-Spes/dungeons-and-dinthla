import { NotKnownValue } from "../../shape/not-known-value";
import { numberInRange } from "../../shape/number-in-range";
import type { NumberRange } from "../../shape/number-range";
import type { WorkedValue } from "../../shape/worked-value";
import { PRINTED } from "../printed-route";
import type { SheetFields } from "../sheet-fields";
import type { NumberText } from "./number-text";

const NO_WORKING = "";

export class PrintedNumber {
  constructor(
    readonly fieldName: string,
    private readonly range: NumberRange,
    private readonly text: NumberText,
  ) {}

  read(fields: SheetFields): WorkedValue<number> {
    const printed = fields.textAt(this.fieldName);
    if (printed === null) return this.notKnown("is missing or is not text");
    const trimmed = printed.trim();
    if (trimmed === "") return this.notKnown("is blank");
    const found = this.text.numberIn(trimmed);
    if (found === null) return this.notKnown("does not hold a number in the form the sheet prints");
    if (Object.is(found, -0)) return this.notKnown("holds a negative zero");
    return numberInRange(found, this.range, NO_WORKING, PRINTED);
  }

  private notKnown(why: string): WorkedValue<number> {
    return new NotKnownValue(`The sheet's field "${this.fieldName}" ${why}.`, PRINTED);
  }
}
