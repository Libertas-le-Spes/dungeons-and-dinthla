import { addActionButton, type ButtonAction } from "./action-button";

const BEYOND_BUTTON_CLASSES = ["dd-create", "dd-beyond"];

export function addBeyondButton(parent: HTMLElement, label: string, action: ButtonAction): void {
  addActionButton(parent, label, BEYOND_BUTTON_CLASSES, action);
}
