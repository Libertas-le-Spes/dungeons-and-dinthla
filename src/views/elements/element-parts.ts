import type { ElementBinding } from "./bindings/element-binding";

export interface ElementParts {
  readonly cls?: readonly string[];
  readonly text?: string;
  readonly role?: string;
  readonly label?: string;
  readonly labelledBy?: string;
  readonly live?: "polite" | "assertive";
  readonly current?: string;
  readonly selected?: boolean;
  readonly pressed?: boolean;
  readonly expanded?: boolean;
  readonly controls?: string;
  readonly hasPopup?: string;
  readonly hiddenFromReaders?: boolean;
  readonly tabIndex?: number;
  readonly id?: string;
  readonly title?: string;
  readonly dataPath?: string;
  readonly dataLine?: number;
  readonly dataName?: string;
  readonly dataItem?: string;
  readonly dataState?: string;
  readonly hidden?: boolean;
  readonly undraggable?: boolean;
  readonly bindings?: readonly ElementBinding[];
}
