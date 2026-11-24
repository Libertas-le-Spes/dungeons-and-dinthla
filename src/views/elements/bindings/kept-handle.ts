import type { ElementHandle } from "../element-handle";
import type { HandleWanted } from "./binding-wiring";

export class KeptHandle implements HandleWanted {
  handle: ElementHandle | null = null;

  received(handle: ElementHandle): void {
    this.handle = handle;
  }

  focus(): void {
    if (this.handle !== null) this.handle.focus();
  }

  setText(text: string): void {
    if (this.handle !== null) this.handle.setText(text);
  }
}
