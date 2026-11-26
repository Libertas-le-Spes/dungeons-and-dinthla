import type { BindingWiring } from "./binding-wiring";

export interface ElementBinding {
  wireOn(wiring: BindingWiring): void;
}
