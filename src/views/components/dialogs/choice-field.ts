import { ChangeBinding, HandleRequest } from "../../elements/bindings/bindings";
import type { HandleWanted, TextChange } from "../../elements/bindings/binding-wiring";
import type { ElementBinding } from "../../elements/bindings/element-binding";
import { FieldRow, Select } from "../../elements/kinds/containers";
import { Option } from "../../elements/kinds/fields";

const DROPDOWN_CLASS = "dropdown";

export interface Choice {
  readonly value: string;
  readonly text: string;
}

export class ChoiceField {
  constructor(
    private readonly name: string,
    private readonly choices: readonly Choice[],
    private readonly field: TextChange,
  ) {}

  build(value: string, handle: HandleWanted | null): FieldRow {
    const bindings: ElementBinding[] = [new ChangeBinding(this.field)];
    if (handle !== null) bindings.push(new HandleRequest(handle));
    const options: Option[] = [];
    for (const choice of this.choices) options.push(new Option({ text: choice.text }, choice.value, choice.value === value));
    return new FieldRow(this.name, null, [new Select({ cls: [DROPDOWN_CLASS], bindings }, options)]);
  }
}
