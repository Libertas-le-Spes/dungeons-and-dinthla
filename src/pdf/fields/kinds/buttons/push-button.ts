import type { FieldValue } from "../../field-value";
import type { ButtonKind } from "./button-kind";

const PUSH_BUTTON_FLAG = 1 << 16;

export class PushButton implements ButtonKind {
  handles(flags: number): boolean {
    return (flags & PUSH_BUTTON_FLAG) !== 0;
  }

  read(): FieldValue | null {
    return null;
  }
}
