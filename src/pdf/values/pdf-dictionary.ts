import { PdfAbsent } from "./pdf-absent";
import { PdfValue } from "./pdf-value";

export class PdfDictionary extends PdfValue {
  constructor(private readonly entries: ReadonlyMap<string, PdfValue>) {
    super();
  }

  get(key: string): PdfValue {
    const found = this.entries.get(key);
    if (found === undefined) return PdfAbsent.ABSENT;
    return found;
  }

  values(): IterableIterator<PdfValue> {
    return this.entries.values();
  }

  has(key: string): boolean {
    return this.entries.has(key);
  }

  override asDictionary(): PdfDictionary {
    return this;
  }
}
