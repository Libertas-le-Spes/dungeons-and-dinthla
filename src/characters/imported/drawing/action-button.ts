import { ButtonComponent } from "obsidian";

export interface ButtonAction {
  run(returnFocus: () => void): void;
}

class ButtonPress {
  constructor(
    private readonly button: ButtonComponent,
    private readonly action: ButtonAction,
  ) {}

  press(): void {
    this.action.run(this.focusButton.bind(this));
  }

  private focusButton(): void {
    this.button.buttonEl.focus();
  }
}

export function addActionButton(parent: HTMLElement, label: string, classes: readonly string[], action: ButtonAction): void {
  const button = new ButtonComponent(parent).setButtonText(label);
  button.buttonEl.addClass(...classes);
  const press = new ButtonPress(button, action);
  button.onClick(press.press.bind(press));
}
