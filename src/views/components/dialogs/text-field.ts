import { ChangeBinding, HandleRequest, EnterBinding } from "../../elements/bindings/bindings";
import type { ElementBinding } from "../../elements/bindings/element-binding";
import type { HandleWanted, TextChange } from "../../elements/bindings/binding-wiring";
import type { PageAction } from "../../elements/bindings/page-action";
import { FieldRow } from "../../elements/kinds/containers";
import { TextInput } from "../../elements/kinds/fields";
import type { FieldWords } from "./field-words";

export class TextField {
  constructor(
    private readonly words: FieldWords,
    private readonly field: TextChange,
    private readonly entered: PageAction,
  ) {}

  build(value: string, handle: HandleWanted | null, row: HandleWanted | null = null): FieldRow {
    const bindings: ElementBinding[] = [new ChangeBinding(this.field), new EnterBinding(false, this.entered)];
    if (handle !== null) bindings.push(new HandleRequest(handle));
    const input = new TextInput({ placeholder: this.words.placeholder, value, label: this.words.label, bindings });
    if (row === null) return new FieldRow(this.words.name, null, [input]);
    return new FieldRow(this.words.name, null, [input], { bindings: [new HandleRequest(row)] });
  }
}
