import { RefusedKey } from "../refusals/refused-key";

export const REFUSED_TRAILER_KEYS: readonly RefusedKey[] = [
  new RefusedKey("Encrypt", "This PDF is locked with a password or encryption, so it was not read."),
  new RefusedKey("XRefStm", "This PDF mixes two kinds of index, which the reader does not read, so it was not read."),
];
