import { Bold, Div, PlainText, Strong } from "../../../views/elements/kinds/containers";
import type { ViewElement } from "../../../views/elements/view-element";
import { NOT_KNOWN } from "../../reading/character-sheet";
import { ABILITIES, modifierOf, type SheetValues } from "../../reading/sheet-values";
import { statValueOf } from "./card-parts";

const STAT_BLOCK_LINES = [
  { label: "Class", name: "class" },
  { label: "Armor Class", name: "AC" },
  { label: "Hit Points", name: "HP" },
  { label: "Speed", name: "speed" },
];

export const STAT_BLOCK_CLASS = "dd-stat-block";

function rule(): ViewElement {
  return new Div({ cls: ["dd-stat-block-rule"] });
}

export class StatBlock {
  build(characterName: string, values: SheetValues): ViewElement[] {
    const block: ViewElement[] = [new Div({ cls: ["dd-stat-block-name"], text: characterName })];
    block.push(...this.knownLine("dd-stat-block-type", values, "type"), ...this.knownLine("dd-stat-block-subtitle", values, "subtitle"), rule());
    for (const { label, name } of STAT_BLOCK_LINES) block.push(new Div({ cls: ["dd-stat-block-line"] }, [new Strong({ text: label }), new PlainText(" "), statValueOf(values, name)]));
    block.push(rule(), this.abilitiesOf(values));
    return block;
  }

  private knownLine(cls: string, values: SheetValues, name: string): ViewElement[] {
    const value = values.get(name);
    if (value === undefined || value === NOT_KNOWN) return [];
    return [new Div({ cls: [cls], text: value })];
  }

  private abilitiesOf(values: SheetValues): ViewElement {
    const cells: ViewElement[] = [];
    for (const ability of ABILITIES) cells.push(new Div({}, this.abilityCell(values, ability)));
    return new Div({ cls: ["dd-stat-block-abilities"] }, cells);
  }

  private abilityCell(values: SheetValues, ability: string): ViewElement[] {
    const cell: ViewElement[] = [new Bold({ text: ability }), statValueOf(values, ability)];
    const score = values.get(ability);
    if (score === undefined) return cell;
    const modifier = modifierOf(score);
    if (modifier !== "") cell.push(new PlainText(` (${modifier})`));
    return cell;
  }
}
