import { ChangeBinding, HandleRequest, EnterBinding } from "../../elements/bindings/bindings";
import type { ElementBinding } from "../../elements/bindings/element-binding";
import type { HandleWanted, TextChange } from "../../elements/bindings/binding-wiring";
import type { PageAction } from "../../elements/bindings/page-action";
import { FieldRow } from "../../elements/kinds/containers";
import { TextArea } from "../../elements/kinds/fields";
import type { FieldWords } from "./field-words";

export class TextAreaField {
  constructor(
    private readonly words: FieldWords,
    private readonly field: TextChange,
    private readonly entered: PageAction,
  ) {}

  build(value: string, handle: HandleWanted | null): FieldRow {
    const bindings: ElementBinding[] = [new ChangeBinding(this.field), new EnterBinding(true, this.entered)];
    if (handle !== null) bindings.push(new HandleRequest(handle));
    const area = new TextArea({ placeholder: this.words.placeholder, value, label: this.words.label, bindings });
    return new FieldRow(this.words.name, null, [area]);
  }
}
