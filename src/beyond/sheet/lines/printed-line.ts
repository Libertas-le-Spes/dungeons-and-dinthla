import type { Refusal } from "../../shape/refusal";
import { CleanLine } from "../../text/clean-line";
import type { SheetFields } from "../sheet-fields";
import { hasLetterOrDigit } from "./letter-or-digit";

export class PrintedLine {
  constructor(
    readonly fieldName: string,
    private readonly whenMissing: () => Refusal,
  ) {}

  read(fields: SheetFields): CleanLine {
    const printed = fields.textAt(this.fieldName);
    if (printed === null) throw this.whenMissing();
    if (printed.trim() === "") throw this.whenMissing();
    const line = CleanLine.of(printed);
    if (!hasLetterOrDigit(line.text)) throw this.whenMissing();
    return line;
  }
}
