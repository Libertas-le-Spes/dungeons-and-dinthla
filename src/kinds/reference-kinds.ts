import { characterReferenceKind } from "./character-reference-kind";
import { placeReferenceKind } from "./place-reference-kind";
import type { ReferenceKind, ReferenceKindName } from "./reference-kind";

export const REFERENCE_KINDS = {
  character: characterReferenceKind,
  place: placeReferenceKind,
} satisfies Record<ReferenceKindName, ReferenceKind>;

export const REFERENCE_KIND_LIST: ReferenceKind[] = Object.values(REFERENCE_KINDS);
