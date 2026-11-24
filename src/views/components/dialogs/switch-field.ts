import { HandleRequest } from "../../elements/bindings/bindings";
import type { HandleWanted } from "../../elements/bindings/binding-wiring";
import { FieldRow } from "../../elements/kinds/containers";
import { Switch, type SwitchChange } from "../../elements/kinds/fields";

export class SwitchField {
  constructor(
    private readonly name: string,
    private readonly field: SwitchChange,
  ) {}

  build(on: boolean, row: HandleWanted): FieldRow {
    return new FieldRow(this.name, null, [new Switch({}, on, this.field)], { bindings: [new HandleRequest(row)] });
  }
}
