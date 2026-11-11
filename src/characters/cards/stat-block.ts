import { NOT_KNOWN } from "../reading/character-sheet";
import { ABILITIES, modifierOf, type SheetValues } from "../reading/sheet-values";

const STAT_BLOCK_LINES = [
  { label: "Class", name: "class" },
  { label: "Armor Class", name: "AC" },
  { label: "Hit Points", name: "HP" },
  { label: "Speed", name: "speed" },
];

function knownValueOf(values: SheetValues, name: string): string | undefined {
  const value = values.get(name);
  if (value === NOT_KNOWN) return undefined;
  return value;
}

export function addStatValue(parent: HTMLElement, values: SheetValues, name: string): void {
  const value = knownValueOf(values, name);
  if (value === undefined) parent.createSpan({ cls: "dd-unknown", text: NOT_KNOWN });
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

export function startStatBlock(block: HTMLElement, characterName: string): void {
  block.addClass("dd-stat-block");
  block.createDiv({ cls: "dd-stat-block-name", text: characterName });
}

export function addStatBlockLine(block: HTMLElement): HTMLElement {
  return block.createDiv({ cls: "dd-stat-block-line" });
}

export function fillStatBlock(block: HTMLElement, characterName: string, values: SheetValues): void {
  startStatBlock(block, characterName);
  addKnownLine(block, "dd-stat-block-type", knownValueOf(values, "type"));
  addKnownLine(block, "dd-stat-block-subtitle", knownValueOf(values, "subtitle"));
  block.createDiv({ cls: "dd-stat-block-rule" });
  for (const { label, name } of STAT_BLOCK_LINES) {
    const line = addStatBlockLine(block);
    line.createEl("strong", { text: label });
    line.appendText(" ");
    addStatValue(line, values, name);
  }
  block.createDiv({ cls: "dd-stat-block-rule" });
  addAbilities(block, values);
}
