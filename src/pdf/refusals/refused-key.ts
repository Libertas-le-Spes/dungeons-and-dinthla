import type { PdfDictionary } from "../values/pdf-dictionary";
import { PdfRefusal } from "./pdf-refusal";

export class RefusedKey {
  constructor(
    private readonly key: string,
    private readonly words: string,
  ) {}

  check(dictionary: PdfDictionary): void {
    if (dictionary.has(this.key)) throw new PdfRefusal(this.words);
  }
}

export function refuseKeys(dictionary: PdfDictionary, keys: readonly RefusedKey[]): void {
  for (const key of keys) key.check(dictionary);
}
