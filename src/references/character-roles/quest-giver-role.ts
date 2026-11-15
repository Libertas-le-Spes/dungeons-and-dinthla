import { findLinks } from "../../notes/parts/link";
import { readMarker } from "../../notes/reading/marker";
import { readQuest } from "../../notes/reading/quest";
import type { CharacterRole } from "./character-role";

export const questGiverRole: CharacterRole = {
  linksIn(text: string): string[] {
    const marked = readMarker(text);
    if (marked.marker !== "quest") return [];
    const { givenBy } = readQuest(marked.body);
    if (givenBy === undefined) return [];
    return findLinks(givenBy).slice(0, 1);
  },
};
