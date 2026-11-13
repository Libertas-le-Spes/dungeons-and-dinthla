import { sectionHeadingsIn, type SectionHeading } from "../../layout/blocks/section-headings";
import { plainLineOf } from "./line-ending";
import { bodyLineTooLong, unclosedBlock } from "./note-refusals";
import { MOST_BODY_LINE } from "./note-limits";

export type Boundary = SectionHeading;

export function boundariesIn(lines: readonly string[], from: number): Boundary[] {
  const plain: string[] = [];
  for (const [index, written] of lines.entries()) {
    const line = plainLineOf(written);
    if (index >= from && line.length > MOST_BODY_LINE) throw bodyLineTooLong();
    plain.push(line);
  }
  const headings = sectionHeadingsIn(plain, from);
  if (!headings.closed) throw unclosedBlock();
  return [...headings.found];
}
