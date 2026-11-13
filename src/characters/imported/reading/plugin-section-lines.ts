import { headingSpansOf } from "./heading-spans";

export function pluginSectionLinesOf(lines: readonly string[], bodyStart: number): Set<number> {
  const inside = new Set<number>();
  for (const span of headingSpansOf(lines, bodyStart)) {
    if (span.section === null) continue;
    for (let index = span.heading; index < span.end; index++) inside.add(index);
  }
  return inside;
}
