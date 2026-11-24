import { plainLineOf } from "../../note/reading/line-ending";
import { PropertyLines } from "./property-lines";
import { propertyChangedMore, propertyReadsDifferently } from "./property-refusals";
import { propertiesOf, propertiesWithout, valueIn, wantedValueOf } from "./property-yaml";
import type { PropertiesSyntax } from "../../../campaign/paths/session-file";

function outsideTheProperty(text: string, key: string, syntax: PropertiesSyntax): string {
  const note = PropertyLines.of(text, syntax);
  const span = note.spanOf(key);
  let properties = note.linesIn(1, note.closing());
  if (span !== null) properties = note.linesIn(1, span.start).concat(note.linesIn(span.end, note.closing()));
  return JSON.stringify([properties, note.linesIn(note.bodyStart, note.lines.length)]);
}

function propertyLinesOf(text: string, key: string, syntax: PropertiesSyntax): string {
  const note = PropertyLines.of(text, syntax);
  const span = note.spanOf(key);
  const plain: string[] = [];
  if (span === null) return JSON.stringify(plain);
  for (const line of note.linesIn(span.start, span.end)) plain.push(plainLineOf(line));
  return JSON.stringify(plain);
}

function wantedLinesOf(wanted: string | null): string {
  if (wanted === null) return JSON.stringify([]);
  return JSON.stringify([wanted]);
}

export function refuseUnlessOnlyThePropertyChanged(before: string, after: string, key: string, wanted: string | null, syntax: PropertiesSyntax): void {
  if (outsideTheProperty(before, key, syntax) !== outsideTheProperty(after, key, syntax)) throw propertyChangedMore(key);
  if (propertyLinesOf(after, key, syntax) !== wantedLinesOf(wanted)) throw propertyChangedMore(key);
  const readBefore = propertiesOf(before, key, syntax);
  const readAfter = propertiesOf(after, key, syntax);
  if (propertiesWithout(readBefore, key) !== propertiesWithout(readAfter, key)) throw propertyReadsDifferently(key);
  if (valueIn(readAfter, key) !== wantedValueOf(wanted, key, syntax)) throw propertyReadsDifferently(key);
}
