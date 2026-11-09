import { charactersFolderOf } from "./campaign-folders";
import type { Gate } from "../fence/gatekeeper";

export interface Character {
  name: string;
  linktext: string;
}

export function charactersIn(gate: Gate, campaignFolder: string, sessionPath: string): Character[] {
  const charactersFolder = `${charactersFolderOf(campaignFolder)}/`;
  const characters: Character[] = [];
  for (const file of gate.files.getMarkdownFiles()) {
    if (!file.path.startsWith(charactersFolder)) continue;
    if (characters.some((character) => character.name === file.basename)) continue;
    characters.push({ name: file.basename, linktext: gate.metadata.fileToLinktext(file, sessionPath, true) });
  }
  return characters.sort((first, second) => first.name.localeCompare(second.name));
}
