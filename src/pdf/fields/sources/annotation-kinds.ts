import { REFUSED_ANNOTATION_KINDS, REFUSED_OTHER_ANNOTATION_KEYS } from "../../document/refused-entries";
import type { IndirectDictionary } from "../../file/object-store";
import { refuseKeys } from "../../refusals/refused-key";
import { refuseNamed } from "../../refusals/refused-name";
import type { AnnotationKind, WidgetSink } from "./annotation-kind";

class WidgetAnnotation implements AnnotationKind {
  handles(subtype: string | null): boolean {
    return subtype === "Widget";
  }

  handle(annotation: IndirectDictionary, _subtype: string | null, widgets: WidgetSink): void {
    widgets.widget(annotation);
  }
}

class OtherAnnotation implements AnnotationKind {
  handles(): boolean {
    return true;
  }

  handle(annotation: IndirectDictionary, subtype: string | null): void {
    refuseNamed(subtype, REFUSED_ANNOTATION_KINDS);
    refuseKeys(annotation.dictionary, REFUSED_OTHER_ANNOTATION_KEYS);
  }
}

export const ANNOTATION_KINDS: readonly AnnotationKind[] = [new WidgetAnnotation(), new OtherAnnotation()];
