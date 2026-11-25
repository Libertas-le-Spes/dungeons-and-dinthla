import { Div, PlainText, Span } from "../../views/elements/kinds/containers";
import type { ViewElement } from "../../views/elements/view-element";
import { NOT_KNOWN } from "../reading/character-sheet";
import type { SheetValues } from "../reading/sheet-values";
import { leftPlayMarkOf } from "./card-standing";
import type { CharacterCard } from "./character-card";

export function cardClasses(card: CharacterCard): string[] {
  const classes = ["dd-card"];
  if (card.isOwn) classes.push("dd-card-own");
  return classes;
}

export function cardLabels(card: CharacterCard): ViewElement[] {
  const labels: ViewElement[] = [];
  if (card.isOwn) labels.push(new Div({ cls: ["dd-card-own-label"], text: "Your character" }));
  const mark = leftPlayMarkOf(card.standing);
  if (mark !== null) labels.push(new Div({ cls: ["dd-card-standing"], text: mark }));
  return labels;
}

export function statValueOf(values: SheetValues, name: string): ViewElement {
  const value = values.get(name);
  if (value === undefined || value === NOT_KNOWN) return new Span({ cls: ["dd-unknown"], text: NOT_KNOWN });
  return new PlainText(value);
}
