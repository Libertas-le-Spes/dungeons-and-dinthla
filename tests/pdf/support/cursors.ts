import { ByteCursor } from "../../../src/pdf/bytes/byte-cursor";
import { WorkBudget } from "../../../src/pdf/work/work-budget";

export function bytesOfText(text: string): Uint8Array {
  return Uint8Array.from(Buffer.from(text, "latin1"));
}

export function budgetFor(size: number): WorkBudget {
  return new WorkBudget(size, () => 0);
}

export function cursorOver(text: string): ByteCursor {
  const bytes = bytesOfText(text);
  return new ByteCursor(bytes, budgetFor(bytes.byteLength), 0);
}

export function cursorOverBytes(bytes: Uint8Array): { cursor: ByteCursor; work: WorkBudget } {
  const work = budgetFor(bytes.byteLength);
  return { cursor: new ByteCursor(bytes, work, 0), work };
}
