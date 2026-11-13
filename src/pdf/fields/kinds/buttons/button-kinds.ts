import type { ButtonKind } from "./button-kind";
import { CheckBox } from "./check-box";
import { PushButton } from "./push-button";
import { RadioButton } from "./radio-button";

export const BUTTON_KINDS: readonly ButtonKind[] = [new PushButton(), new RadioButton(), new CheckBox()];
