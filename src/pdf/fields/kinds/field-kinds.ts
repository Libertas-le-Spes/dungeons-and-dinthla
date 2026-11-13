import { ButtonField } from "./button-field";
import { ChoiceField } from "./choice-field";
import type { FieldKind } from "./field-kind";
import { TextField } from "./text-field";

export const FIELD_KINDS: readonly FieldKind[] = [new TextField(), new ButtonField(), new ChoiceField()];
