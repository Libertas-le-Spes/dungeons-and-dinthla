import { ABILITIES, modifierOf, type SheetValues } from "./sheet-values";

const STAT_BLOCK_LINES = [
  { label: "Class", name: "class" },
  { label: "Armor Class", name: "AC" },
  { label: "Hit Points", name: "HP" },
  { label: "Speed", name: "speed" },
];

export function addStatValue(parent: HTMLElement, values: SheetValues, name: string): void {
  const value = values.get(name);
  if (value === undefined) parent.createSpan({ cls: "dd-unknown", text: "?" });
  else parent.appendText(value);
}

function addKnownLine(block: HTMLElement, cls: string, value: string | undefined): void {
  if (value !== undefined) block.createDiv({ cls, text: value });
}

function addAbilities(block: HTMLElement, values: SheetValues): void {
  const abilities = block.createDiv({ cls: "dd-stat-block-abilities" });
  for (const ability of ABILITIES) {
    const cell = abilities.createDiv();
    cell.createEl("b", { text: ability });
    addStatValue(cell, values, ability);
    const score = values.get(ability);
    if (score === undefined) continue;
    const modifier = modifierOf(score);
    if (modifier !== "") cell.appendText(` (${modifier})`);
  }
}

export function fillStatBlock(block: HTMLElement, characterName: string, values: SheetValues): void {
  block.addClass("dd-stat-block");
  block.createDiv({ cls: "dd-stat-block-name", text: characterName });
  addKnownLine(block, "dd-stat-block-type", values.get("type"));
  addKnownLine(block, "dd-stat-block-subtitle", values.get("subtitle"));
  block.createDiv({ cls: "dd-stat-block-rule" });
  for (const { label, name } of STAT_BLOCK_LINES) {
    const line = block.createDiv({ cls: "dd-stat-block-line" });
    line.createEl("strong", { text: label });
    line.appendText(" ");
    addStatValue(line, values, name);
  }
  block.createDiv({ cls: "dd-stat-block-rule" });
  addAbilities(block, values);
}
