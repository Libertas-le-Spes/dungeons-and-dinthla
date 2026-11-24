import type { ElementHandle } from "../element-handle";
import type { PageAction } from "./page-action";

export interface TextChange {
  changed(value: string): void;
}

export interface HandleWanted {
  received(handle: ElementHandle): void;
}

export interface BindingWiring {
  press(action: PageAction): void;
  keys(keys: readonly string[], action: PageAction): void;
  change(field: TextChange): void;
  handle(wanted: HandleWanted): void;
}
