import { PdfRefusal } from "../refusals/pdf-refusal";
import type { PdfDictionary } from "../values/pdf-dictionary";
import type { PdfValue } from "../values/pdf-value";

export class FieldNode {
  constructor(
    readonly number: number,
    readonly dictionary: PdfDictionary,
    private readonly parent: FieldNode | null,
  ) {}

  hasOwnName(): boolean {
    return this.dictionary.get("T").isPresent();
  }

  nearestNamed(): FieldNode | null {
    if (this.hasOwnName()) return this;
    if (this.parent === null) return null;
    return this.parent.nearestNamed();
  }

  inherited(key: string): PdfValue {
    const own = this.dictionary.get(key);
    if (own.isPresent() || this.parent === null) return own;
    return this.parent.inherited(key);
  }

  partialNames(): string[] {
    const own = this.partialName();
    if (this.parent === null) return own;
    return [...this.parent.partialNames(), ...own];
  }

  private partialName(): string[] {
    const name = this.dictionary.get("T");
    if (!name.isPresent()) return [];
    const text = name.asText();
    if (text === null) throw new PdfRefusal("A field's name is not text, so the file was not read.");
    return [text];
  }
}
