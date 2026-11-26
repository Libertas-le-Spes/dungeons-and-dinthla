import { ActionButton, type ButtonAction } from "../../../views/components/buttons/action-button";
import type { ViewElement } from "../../../views/elements/view-element";

const BEYOND_BUTTON_CLASSES = ["dd-create", "dd-beyond"];

export function beyondButton(label: string, action: ButtonAction): ViewElement {
  return new ActionButton(label, BEYOND_BUTTON_CLASSES, action).build();
}
