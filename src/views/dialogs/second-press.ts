import type { ButtonComponent } from "obsidian";

export const CONFIRM_MS = 4000;
export const PRESS_AGAIN = "Press again to delete";

export class SecondPress {
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly showArmed: (armed: boolean) => void,
    private readonly confirmed: () => void,
  ) {}

  press(): void {
    if (this.timer !== null) {
      this.stop();
      this.confirmed();
      return;
    }
    this.showArmed(true);
    this.timer = setTimeout(() => this.stop(), CONFIRM_MS);
  }

  stop(): void {
    if (this.timer === null) return;
    clearTimeout(this.timer);
    this.timer = null;
    this.showArmed(false);
  }
}

export function deleteOnSecondPress(button: ButtonComponent, label: string, confirmed: () => void): SecondPress {
  const showArmed = (armed: boolean) => {
    if (armed) button.setButtonText(PRESS_AGAIN);
    else button.setButtonText(label);
  };
  const secondPress = new SecondPress(showArmed, confirmed);
  button.setButtonText(label).setWarning().onClick(() => secondPress.press());
  button.buttonEl.addClass("dd-delete");
  return secondPress;
}
