import { DeletedKind } from "./deleted-kind";
import type { KeptKind } from "./kept-kind";
import { MissingKind } from "./missing-kind";
import { MovedKind } from "./moved-kind";

export const DELETED = new DeletedKind();
export const MOVED = new MovedKind();
export const MISSING = new MissingKind();

export const KEPT_KINDS: readonly KeptKind[] = [DELETED, MOVED, MISSING];
