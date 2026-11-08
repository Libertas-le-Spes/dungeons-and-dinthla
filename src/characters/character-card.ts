import { addRowButton, type LinkActions } from "../views/linked-text";
import { ABILITIES, modifierOf, type SheetValues } from "./sheet-values";

export interface CharacterCard {
  path: string;
  name: string;
  values: SheetValues;
  isOwn: boolean;
}

const CARD_LINES = [
  { label: "Class", name: "class" },
  { label: "Armor Class", name: "AC" },
  { label: "Hit Points", name: "HP" },
  { label: "Speed", name: "speed" },
];

export function addSheetValue(parent: HTMLElement, value: string | undefined): void {
  if (value === undefined) parent.createSpan({ cls: "dd-unknown", text: "?" });
  else parent.appendText(value);
}

function addKnownLine(card: HTMLElement, cls: string, value: string | undefined): void {
  if (value !== undefined) card.createDiv({ cls, text: value });
}

function addAbilities(card: HTMLElement, values: SheetValues): void {
  const abilities = card.createDiv({ cls: "dd-card-abilities" });
  for (const ability of ABILITIES) {
    const cell = abilities.createDiv();
    cell.createEl("b", { text: ability });
    const score = values.get(ability);
    addSheetValue(cell, score);
    if (score === undefined) continue;
    const modifier = modifierOf(score);
    if (modifier !== "") cell.appendText(` (${modifier})`);
  }
}

export function addCharacterCard(gallery: HTMLElement, card: CharacterCard, actions: LinkActions): HTMLElement {
  const element = addRowButton(gallery, { path: card.path, line: 0 }, actions);
  element.addClass("dd-card");
  if (card.isOwn) {
    element.addClass("dd-card-own");
    element.createDiv({ cls: "dd-card-own-label", text: "Your character" });
  }
  element.createDiv({ cls: "dd-card-name", text: card.name });
  addKnownLine(element, "dd-card-type", card.values.get("type"));
  addKnownLine(element, "dd-card-subtitle", card.values.get("subtitle"));
  element.createDiv({ cls: "dd-card-rule" });
  for (const { label, name } of CARD_LINES) {
    const line = element.createDiv({ cls: "dd-card-line" });
    line.createEl("strong", { text: label });
    line.appendText(" ");
    addSheetValue(line, card.values.get(name));
  }
  element.createDiv({ cls: "dd-card-rule" });
  addAbilities(element, card.values);
  return element;
}
