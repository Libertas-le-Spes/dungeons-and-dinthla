import type { FieldValue } from "../../pdf/fields/field-value";

export class SheetFields {
  constructor(private readonly fields: ReadonlyMap<string, FieldValue>) {}

  textAt(name: string): string | null {
    const value = this.fields.get(name);
    if (typeof value === "string") return value;
    return null;
  }
}
