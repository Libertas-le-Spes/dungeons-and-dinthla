import type { MountPlace } from "../../../views/elements/mounter";

const NOT_A_PLACE = "That isn't a place the Obsidian mount step made.";

export class ElementPlace implements MountPlace {
  readonly mountPlace = true;

  constructor(readonly el: HTMLElement) {}
}

export function elementOf(place: MountPlace): HTMLElement {
  if (!(place instanceof ElementPlace)) throw new Error(NOT_A_PLACE);
  return place.el;
}
