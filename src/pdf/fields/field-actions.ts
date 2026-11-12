import { REFUSED_ACTION_KINDS } from "../document/refused-entries";
import type { ObjectStore } from "../file/object-store";
import { MAX_NESTING } from "../limits/pdf-limits";
import { PdfRefusal } from "../refusals/pdf-refusal";
import { refuseNamed } from "../refusals/refused-name";
import type { PdfDictionary } from "../values/pdf-dictionary";
import type { PdfValue } from "../values/pdf-value";

const UNREADABLE = "A field has an action the reader can't make sense of, so the file was not read.";

export class FieldActions {
  private readonly checkedObjects = new Set<number>();
  private readonly walkedActions = new Set<number>();

  constructor(private readonly store: ObjectStore) {}

  check(number: number, dictionary: PdfDictionary): void {
    if (this.checkedObjects.has(number)) return;
    this.checkedObjects.add(number);
    this.checkAction(dictionary.get("A"), 0);
    this.checkTriggers(dictionary.get("AA"));
  }

  private checkTriggers(triggers: PdfValue): void {
    if (!triggers.isPresent()) return;
    const dictionary = this.store.dictionaryOf(triggers);
    if (dictionary === null) throw new PdfRefusal(UNREADABLE);
    for (const action of dictionary.values()) this.checkAction(action, 0);
  }

  private checkAction(value: PdfValue, depth: number): void {
    this.store.chargeStep();
    if (!value.isPresent()) return;
    if (depth > MAX_NESTING) throw new PdfRefusal(UNREADABLE);
    if (this.isAlreadyWalked(value)) return;
    const action = this.store.dictionaryOf(value);
    if (action === null) throw new PdfRefusal(UNREADABLE);
    refuseNamed(this.store.resolve(action.get("S")).asName(), REFUSED_ACTION_KINDS);
    this.checkFollowing(action.get("Next"), depth + 1);
  }

  private checkFollowing(next: PdfValue, depth: number): void {
    const array = this.store.resolve(next).asArray();
    if (array === null) {
      this.checkAction(next, depth);
      return;
    }
    for (const item of array.items) this.checkAction(item, depth);
  }

  private isAlreadyWalked(value: PdfValue): boolean {
    const reference = value.asReference();
    if (reference === null) return false;
    if (this.walkedActions.has(reference.number)) return true;
    this.walkedActions.add(reference.number);
    return false;
  }
}
