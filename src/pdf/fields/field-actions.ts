import { NOT_A_SCRIPT, REFUSED_ACTION_KEYS } from "../document/refused-entries";
import type { ObjectStore } from "../file/object-store";
import { MAX_NESTING } from "../limits/pdf-limits";
import { PdfRefusal } from "../refusals/pdf-refusal";
import { refuseKeys } from "../refusals/refused-key";
import type { PdfDictionary } from "../values/pdf-dictionary";
import type { PdfValue } from "../values/pdf-value";

const READ_PAST_ACTION = "JavaScript";
const UNREADABLE = "A field has an action the reader can't make sense of, so the file was not read.";

export class FieldActions {
  private readonly walkedActions = new Set<number>();

  constructor(private readonly store: ObjectStore) {}

  check(dictionary: PdfDictionary): void {
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
    this.checkIsScript(action);
    this.checkFollowing(action.get("Next"), depth + 1);
  }

  private checkIsScript(action: PdfDictionary): void {
    refuseKeys(action, REFUSED_ACTION_KEYS);
    if (this.store.resolve(action.get("S")).asName() !== READ_PAST_ACTION) throw new PdfRefusal(NOT_A_SCRIPT);
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
