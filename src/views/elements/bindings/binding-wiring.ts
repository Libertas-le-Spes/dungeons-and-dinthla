import type { ElementHandle } from "../element-handle";
import type { PageAction } from "./page-action";

export interface TextChange {
  changed(value: string): void;
}

export interface PressedKey {
  readonly key: string;
  readonly modified: boolean;
  handled(): void;
  keptHere(): void;
}

export interface CaretWatcher {
  keyDown(pressed: PressedKey): void;
  typed(text: string, caret: number): void;
  caretMoved(caret: number): void;
  left(): void;
}

export interface HandleWanted {
  received(handle: ElementHandle): void;
}

export interface BindingWiring {
  press(action: PageAction): void;
  keys(keys: readonly string[], action: PageAction): void;
  enter(needsModifier: boolean, action: PageAction): void;
  change(field: TextChange): void;
  handle(wanted: HandleWanted): void;
  follow(action: PageAction): void;
  suggest(names: readonly string[]): void;
  caret(watcher: CaretWatcher): void;
  holdFocus(): void;
}
