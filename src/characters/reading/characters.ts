import { characterReferenceKind } from "../../kinds/character-reference-kind";
import { isInReferenceFolder } from "../../campaign/paths/campaign-folders";
import type { Gate } from "../../fence/gate/gatekeeper";

export interface Character {
  name: string;
  linktext: string;
}

export function charactersIn(gate: Gate, campaignFolder: string, sessionPath: string): Character[] {
  const characters: Character[] = [];
  for (const file of gate.files.getMarkdownFiles()) {
    if (!isInReferenceFolder(characterReferenceKind, campaignFolder, file.path)) continue;
    if (characters.some((character) => character.name === file.basename)) continue;
    characters.push({ name: file.basename, linktext: gate.metadata.fileToLinktext(file, sessionPath, true) });
  }
  return characters.sort((first, second) => first.name.localeCompare(second.name));
}
