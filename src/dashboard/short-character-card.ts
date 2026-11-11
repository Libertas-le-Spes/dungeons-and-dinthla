import { addCardButton, type CharacterCard } from "../characters/character-card";
import { addStatBlockLine, addStatValue, startStatBlock } from "../characters/stat-block";
import type { LinkActions } from "../views/lists/linked-text";

const SHORT_CARD_LINES = [
  { label: "Class", name: "class" },
  { label: "AC", name: "AC" },
  { label: "HP", name: "HP" },
];

export function addShortCharacterCard(list: HTMLElement, card: CharacterCard, actions: LinkActions): void {
  const element = addCardButton(list, card, actions);
  startStatBlock(element, card.name);
  const line = addStatBlockLine(element);
  SHORT_CARD_LINES.forEach(({ label, name }, index) => {
    if (index > 0) line.appendText(" · ");
    line.createEl("strong", { text: label });
    line.appendText(" ");
    addStatValue(line, card.values, name);
  });
}
