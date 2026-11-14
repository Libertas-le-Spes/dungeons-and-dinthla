import { characterReferenceKind } from "../../kinds/character-reference-kind";
import { characterLinksIn } from "../character-roles/character-roles";
import type { ReferenceReader } from "./reference-reader";

export const characterReader: ReferenceReader = {
  kind: characterReferenceKind.name,
  linksIn: characterLinksIn,
};
