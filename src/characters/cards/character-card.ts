import { addRowButton, addRowButtonIn, type LinkActions } from "../../views/lists/linked-text";
import type { SheetValues } from "../reading/sheet-values";
import { leftPlayMarkOf, type CardStanding } from "./card-standing";
import { fillStatBlock } from "./stat-block";

export interface CharacterCard {
  path: string;
  name: string;
  values: SheetValues;
  isOwn: boolean;
  standing: CardStanding;
}

function dressedCard(element: HTMLElement, card: CharacterCard): HTMLElement {
  element.addClass("dd-card");
  if (card.isOwn) {
    element.addClass("dd-card-own");
    element.createDiv({ cls: "dd-card-own-label", text: "Your character" });
  }
  const mark = leftPlayMarkOf(card.standing);
  if (mark !== null) element.createDiv({ cls: "dd-card-standing", text: mark });
  return element;
}

export function addCardButton(list: HTMLElement, card: CharacterCard, actions: LinkActions): HTMLElement {
  return dressedCard(addRowButton(list, { path: card.path, line: 0 }, actions), card);
}

export function addCharacterCardIn(item: HTMLElement, card: CharacterCard, actions: LinkActions): HTMLElement {
  const element = dressedCard(addRowButtonIn(item, { path: card.path, line: 0 }, actions), card);
  fillStatBlock(element, card.name, card.values);
  return element;
}
