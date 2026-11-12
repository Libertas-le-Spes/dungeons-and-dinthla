import { REFUSED_FORM_KEYS } from "../../document/refused-entries";
import type { IndirectDictionary, ObjectStore } from "../../file/object-store";
import { MAX_FIELD_DEPTH } from "../../limits/pdf-limits";
import { PdfRefusal } from "../../refusals/pdf-refusal";
import { refuseKeys } from "../../refusals/refused-key";
import type { PdfDictionary } from "../../values/pdf-dictionary";
import type { PdfValue } from "../../values/pdf-value";
import type { FieldCollector } from "../field-collector";
import type { FieldNode } from "../field-node";
import type { FieldNodes } from "../field-nodes";
import type { FieldSource } from "./field-source";

const TOO_DEEP = "The file's form fields are nested too deeply, or loop, so it was not read.";
const BAD_FORM = "The file's form could not be read, so it was not read.";
const BAD_KID = "A form field has a part that is not a plain object, so the file was not read.";

export class AcroFormSource implements FieldSource {
  private readonly visited = new Set<number>();

  constructor(
    private readonly form: PdfDictionary,
    private readonly store: ObjectStore,
    private readonly nodes: FieldNodes,
    private readonly collector: FieldCollector,
  ) {}

  collect(): void {
    refuseKeys(this.form, REFUSED_FORM_KEYS);
    for (const root of this.indirectItems(this.form.get("Fields"), BAD_FORM)) this.walk(root, null, 1);
  }

  private indirectItems(value: PdfValue, refusal: string): IndirectDictionary[] {
    const array = this.store.resolve(value).asArray();
    if (array === null) throw new PdfRefusal(refusal);
    const items: IndirectDictionary[] = [];
    for (const item of array.items) items.push(this.store.indirectDictionary(item, BAD_KID));
    return items;
  }

  private walk(indirect: IndirectDictionary, parent: FieldNode | null, depth: number): void {
    if (depth > MAX_FIELD_DEPTH || this.visited.has(indirect.number)) throw new PdfRefusal(TOO_DEEP);
    this.visited.add(indirect.number);
    const node = this.nodes.created(indirect, parent);
    const kids = this.kidsOf(indirect);
    if (!kids.some(isNamed)) {
      for (const widget of kids) this.nodes.created(widget, node);
      this.collector.record(node);
      return;
    }
    for (const kid of kids) this.walkKid(kid, node, depth);
  }

  private walkKid(kid: IndirectDictionary, parent: FieldNode, depth: number): void {
    if (isNamed(kid)) this.walk(kid, parent, depth + 1);
    else this.nodes.created(kid, parent);
  }

  private kidsOf(indirect: IndirectDictionary): IndirectDictionary[] {
    const kids = indirect.dictionary.get("Kids");
    if (!kids.isPresent()) return [];
    return this.indirectItems(kids, BAD_KID);
  }
}

function isNamed(indirect: IndirectDictionary): boolean {
  return indirect.dictionary.get("T").isPresent();
}
