import { placeReferenceKind } from "../../kinds/place-reference-kind";
import { findPlaceLinks } from "../../notes/parts/link";
import type { ReferenceReader } from "./reference-reader";

export const placeReader: ReferenceReader = {
  kind: placeReferenceKind.name,
  linksIn: findPlaceLinks,
};
