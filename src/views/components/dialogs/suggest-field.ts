import { ChangeBinding, SuggestBinding } from "../../elements/bindings/bindings";
import type { TextChange } from "../../elements/bindings/binding-wiring";
import { FieldRow } from "../../elements/kinds/containers";
import { TextInput } from "../../elements/kinds/fields";
import type { FieldWords } from "./field-words";

export class SuggestField {
  constructor(
    private readonly words: FieldWords,
    private readonly field: TextChange,
    private readonly names: readonly string[],
  ) {}

  build(): FieldRow {
    const bindings = [new ChangeBinding(this.field), new SuggestBinding(this.names)];
    return new FieldRow(this.words.name, null, [new TextInput({ placeholder: this.words.placeholder, value: "", label: this.words.label, bindings })]);
  }
}
