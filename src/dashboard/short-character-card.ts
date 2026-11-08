import { addSheetValue, type CharacterCard } from "../characters/character-card";
import { addRowButton, type LinkActions } from "../views/linked-text";

const PARTY_LINES = [
  { label: "Class", name: "class" },
  { label: "AC", name: "AC" },
  { label: "HP", name: "HP" },
];

export function addPartyCard(party: HTMLElement, card: CharacterCard, actions: LinkActions): void {
  const element = addRowButton(party, { path: card.path, line: 0 }, actions);
  element.addClass("dd-card");
  if (card.isOwn) {
    element.addClass("dd-card-own");
    element.createDiv({ cls: "dd-card-own-label", text: "Your character" });
  }
  element.createDiv({ cls: "dd-card-name", text: card.name });
  const line = element.createDiv({ cls: "dd-card-line" });
  PARTY_LINES.forEach(({ label, name }, index) => {
    if (index > 0) line.appendText(" · ");
    line.createEl("strong", { text: label });
    line.appendText(" ");
    addSheetValue(line, card.values.get(name));
  });
}
