import { Refusal } from "../../../beyond/shape/refusal";
import type { PluginSection } from "../../layout/plugin-section";
import { MOST_BODY_LINE, MOST_NOTE_LINES, MOST_PROPERTY_LINE } from "./note-limits";

export function twoSections(section: PluginSection): Refusal {
  return new Refusal(`The note has two "${section.heading}" sections, so nothing was written. Remove one.`);
}

export function tooManyLines(): Refusal {
  return new Refusal(`The note has more than ${MOST_NOTE_LINES} lines, so nothing was written.`);
}

export function propertyLineTooLong(): Refusal {
  return new Refusal(`A property of the note is longer than ${MOST_PROPERTY_LINE} characters, so nothing was written.`);
}

export function bodyLineTooLong(): Refusal {
  return new Refusal(`A line of the note is longer than ${MOST_BODY_LINE} characters, so nothing was written.`);
}

export function unclosedBlock(): Refusal {
  return new Refusal("The note ends inside a code block or a comment that is never closed, where a section would be hidden, so nothing was written. Close it first.");
}

export function keyDiffersByCapitals(key: string, name: string): Refusal {
  return new Refusal(`The note has a property called ${key}, which only differs by capitals from the import's ${name}. Rename or remove it first, so nothing of yours is overwritten and no second ${name} is written.`);
}
