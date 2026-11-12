import { REFUSED_PAGE_KEYS } from "../../document/refused-entries";
import type { IndirectDictionary, ObjectStore } from "../../file/object-store";
import { MAX_PAGE_TREE_DEPTH } from "../../limits/pdf-limits";
import { PdfRefusal } from "../../refusals/pdf-refusal";
import { refuseKeys } from "../../refusals/refused-key";
import type { PdfDictionary } from "../../values/pdf-dictionary";
import { ANNOTATION_KINDS } from "./annotation-kinds";
import type { WidgetSink } from "./annotation-kind";
import type { FieldSource } from "./field-source";

const BAD_PAGES = "The file's pages could not be read, so it was not read.";
const BAD_ANNOTATION = "A page holds something that is not a plain object, so the file was not read.";

export class PageWalk implements FieldSource {
  private readonly visitedPages = new Set<number>();

  constructor(
    private readonly catalog: PdfDictionary,
    private readonly store: ObjectStore,
    private readonly widgets: WidgetSink,
  ) {}

  collect(): void {
    this.walk(this.store.indirectDictionary(this.catalog.get("Pages"), BAD_PAGES), 1);
  }

  private walk(node: IndirectDictionary, depth: number): void {
    if (depth > MAX_PAGE_TREE_DEPTH || this.visitedPages.has(node.number)) throw new PdfRefusal(BAD_PAGES);
    this.visitedPages.add(node.number);
    const kids = node.dictionary.get("Kids");
    if (!kids.isPresent()) {
      this.readPage(node.dictionary);
      return;
    }
    const array = this.store.resolve(kids).asArray();
    if (array === null) throw new PdfRefusal(BAD_PAGES);
    for (const item of array.items) this.walk(this.store.indirectDictionary(item, BAD_PAGES), depth + 1);
  }

  private readPage(page: PdfDictionary): void {
    refuseKeys(page, REFUSED_PAGE_KEYS);
    const annotations = page.get("Annots");
    if (!annotations.isPresent()) return;
    const array = this.store.resolve(annotations).asArray();
    if (array === null) throw new PdfRefusal(BAD_ANNOTATION);
    for (const item of array.items) this.handle(this.store.indirectDictionary(item, BAD_ANNOTATION));
  }

  private handle(annotation: IndirectDictionary): void {
    const subtype = this.store.resolve(annotation.dictionary.get("Subtype")).asName();
    for (const kind of ANNOTATION_KINDS) {
      if (kind.handles(subtype)) {
        kind.handle(annotation, subtype, this.widgets);
        return;
      }
    }
  }
}

