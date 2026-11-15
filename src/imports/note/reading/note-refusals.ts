import { Refusal } from "../../../beyond/shape/refusal";
import type { PluginSection } from "../../layout/plugin-section";
import { MOST_BODY_LINE, MOST_NOTE_LINES, MOST_PROPERTY_LINE } from "./note-limits";

export function twoSections(section: PluginSection): Refusal {
  return new Refusal(`The note has two "${section.heading}" sections. Remove one.`);
}

export function tooManyLines(): Refusal {
  return new Refusal(`The note has over ${MOST_NOTE_LINES} lines.`);
}

export function propertyLineTooLong(): Refusal {
  return new Refusal(`A property is over ${MOST_PROPERTY_LINE} characters.`);
}

export function bodyLineTooLong(): Refusal {
  return new Refusal(`A line is over ${MOST_BODY_LINE} characters.`);
}

export function unclosedBlock(): Refusal {
  return new Refusal("The note has a code block or comment that never closes. Close it first.");
}

export function keyDiffersByCapitals(key: string, name: string): Refusal {
  return new Refusal(`The note has "${key}", which differs from "${name}" only by capitals. Rename or remove it.`);
}
