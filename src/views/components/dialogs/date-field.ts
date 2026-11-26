import { ChangeBinding } from "../../elements/bindings/bindings";
import type { TextChange } from "../../elements/bindings/binding-wiring";
import { FieldRow } from "../../elements/kinds/containers";
import { DateInput } from "../../elements/kinds/fields";

export class DateField {
  constructor(
    private readonly name: string,
    private readonly field: TextChange,
  ) {}

  build(value: string): FieldRow {
    return new FieldRow(this.name, null, [new DateInput({ value, label: this.name, bindings: [new ChangeBinding(this.field)] })]);
  }
}
