import type { Refusal } from "../../shape/refusal";
import { CleanLine } from "../../text/clean-line";
import type { SheetFields } from "../sheet-fields";

export class PrintedLine {
  constructor(
    readonly fieldName: string,
    private readonly whenMissing: () => Refusal,
  ) {}

  read(fields: SheetFields): CleanLine {
    const printed = fields.textAt(this.fieldName);
    if (printed === null) throw this.whenMissing();
    if (printed.trim() === "") throw this.whenMissing();
    return CleanLine.of(printed);
  }
}
