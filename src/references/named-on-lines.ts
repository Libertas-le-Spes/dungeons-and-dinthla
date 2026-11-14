import type { Campaign, SessionNote } from "../campaign/record/campaign";
import { lineTextsOf } from "../campaign/record/line-texts";
import type { ReferenceKindName } from "../kinds/reference-kind";
import { trackedSourcesOf } from "../kind-notes/wanting/sources/tracked-sources";
import { namesOnLine } from "./line-names";

export interface NamedOnLines {
  name: string;
  lineCount: number;
  kind: ReferenceKindName | null;
}

interface Tally {
  lineCount: number;
  kinds: Set<ReferenceKindName>;
}

function kindOf(kinds: Set<ReferenceKindName>): ReferenceKindName | null {
  if (kinds.has("place")) return "place";
  if (kinds.has("character")) return "character";
  return null;
}

function tallyFor(tallies: Map<string, Tally>, name: string): Tally {
  const found = tallies.get(name);
  if (found !== undefined) return found;
  const made: Tally = { lineCount: 0, kinds: new Set() };
  tallies.set(name, made);
  return made;
}

export function namedOnLines(campaign: Campaign, sessions: SessionNote[]): NamedOnLines[] {
  const sources = trackedSourcesOf(campaign);
  const tallies = new Map<string, Tally>();
  for (const session of sessions) {
    for (const text of lineTextsOf(session, sources)) {
      for (const { name, kind } of namesOnLine(text)) {
        const tally = tallyFor(tallies, name);
        tally.lineCount += 1;
        if (kind !== null) tally.kinds.add(kind);
      }
    }
  }
  return [...tallies].map(([name, tally]) => ({ name, lineCount: tally.lineCount, kind: kindOf(tally.kinds) }));
}
