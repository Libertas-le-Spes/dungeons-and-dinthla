import { addCardButton, type CharacterCard } from "../characters/character-card";
import { addStatValue } from "../characters/stat-block";
import type { LinkActions } from "../views/linked-text";

const SHORT_CARD_LINES = [
  { label: "Class", name: "class" },
  { label: "AC", name: "AC" },
  { label: "HP", name: "HP" },
];

export function addShortCharacterCard(list: HTMLElement, card: CharacterCard, actions: LinkActions): void {
  const element = addCardButton(list, card, actions);
  element.addClass("dd-stat-block");
  element.createDiv({ cls: "dd-stat-block-name", text: card.name });
  const line = element.createDiv({ cls: "dd-stat-block-line" });
  SHORT_CARD_LINES.forEach(({ label, name }, index) => {
    if (index > 0) line.appendText(" · ");
    line.createEl("strong", { text: label });
    line.appendText(" ");
    addStatValue(line, card.values, name);
  });
}
