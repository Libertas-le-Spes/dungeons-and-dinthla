import { NUMBERS_SECTION } from "../../../imports/layout/plugin-sections";
import { LINE_START, PART_SEPARATOR } from "../../../imports/layout/section-line-format";
import { sameName } from "../../facts/same-name";
import { sectionLinesOf } from "./section-lines";
import { withoutEscapes } from "./shown-text";

const FIRST_WORKING_PART = 2;

interface Working {
  readonly name: string;
  readonly working: string;
}

function workingParts(parts: readonly string[]): string[] {
  const middle: string[] = [];
  const last = parts.length - 1;
  for (const [position, part] of parts.entries()) {
    if (position >= FIRST_WORKING_PART && position < last) middle.push(part);
  }
  return middle;
}

function nameOf(parts: string): string {
  const end = parts.indexOf(PART_SEPARATOR);
  if (end === -1) return parts;
  return parts.substring(0, end);
}

function workingOf(text: string): Working | null {
  if (!text.startsWith(LINE_START)) return null;
  const written = text.substring(LINE_START.length);
  const parts = written.split(PART_SEPARATOR);
  return { name: withoutEscapes(nameOf(written)), working: withoutEscapes(workingParts(parts).join(PART_SEPARATOR)) };
}

export class NumberWorkings {
  private constructor(private readonly workings: readonly Working[]) {}

  static of(lines: readonly string[], bodyStart: number): NumberWorkings {
    const workings: Working[] = [];
    for (const line of sectionLinesOf(lines, bodyStart, NUMBERS_SECTION)) {
      const working = workingOf(line.text);
      if (working !== null) workings.push(working);
    }
    return new NumberWorkings(workings);
  }

  workingFor(name: string): string {
    for (const working of this.workings) {
      if (sameName(working.name, name)) return working.working;
    }
    return "";
  }
}
