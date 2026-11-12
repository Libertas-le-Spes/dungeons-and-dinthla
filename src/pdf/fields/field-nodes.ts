import type { ObjectStore, IndirectDictionary } from "../file/object-store";
import { MAX_FIELD_DEPTH } from "../limits/pdf-limits";
import { PdfRefusal } from "../refusals/pdf-refusal";
import type { FieldActions } from "./field-actions";
import { FieldNode } from "./field-node";

const TOO_DEEP = "The file's form fields are nested too deeply, or loop, so it was not read.";
const BAD_PARENT = "A form field points at a parent that is not a field, so the file was not read.";

export class FieldNodes {
  private readonly climbedNodes = new Map<number, FieldNode>();

  constructor(
    private readonly store: ObjectStore,
    private readonly actions: FieldActions,
  ) {}

  created(indirect: IndirectDictionary, parent: FieldNode | null): FieldNode {
    this.actions.check(indirect.number, indirect.dictionary);
    return new FieldNode(indirect.number, indirect.dictionary, parent);
  }

  climbed(indirect: IndirectDictionary, depth: number): FieldNode {
    if (depth > MAX_FIELD_DEPTH) throw new PdfRefusal(TOO_DEEP);
    const known = this.climbedNodes.get(indirect.number);
    if (known !== undefined) return known;
    const node = this.created(indirect, this.parentOf(indirect, depth));
    this.climbedNodes.set(indirect.number, node);
    return node;
  }

  private parentOf(indirect: IndirectDictionary, depth: number): FieldNode | null {
    const parent = indirect.dictionary.get("Parent");
    if (!parent.isPresent()) return null;
    return this.climbed(this.store.indirectDictionary(parent, BAD_PARENT), depth + 1);
  }
}
