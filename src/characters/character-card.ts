import { addRowButton, type LinkActions } from "../views/lists/linked-text";
import type { SheetValues } from "./sheet-values";
import { fillStatBlock } from "./stat-block";

export interface CharacterCard {
  path: string;
  name: string;
  values: SheetValues;
  isOwn: boolean;
}

export function addCardButton(list: HTMLElement, card: CharacterCard, actions: LinkActions): HTMLElement {
  const element = addRowButton(list, { path: card.path, line: 0 }, actions);
  element.addClass("dd-card");
  if (card.isOwn) {
    element.addClass("dd-card-own");
    element.createDiv({ cls: "dd-card-own-label", text: "Your character" });
  }
  return element;
}

export function addCharacterCard(gallery: HTMLElement, card: CharacterCard, actions: LinkActions): HTMLElement {
  const element = addCardButton(gallery, card, actions);
  fillStatBlock(element, card.name, card.values);
  return element;
}
