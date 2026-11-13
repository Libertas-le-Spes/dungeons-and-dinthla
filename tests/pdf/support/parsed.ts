import { VALUE_PARSER } from "../../../src/pdf/parsing/object-readers";
import { PdfRefusal } from "../../../src/pdf/refusals/pdf-refusal";
import type { PdfValue } from "../../../src/pdf/values/pdf-value";
import { cursorOver } from "./cursors";

export function parsed(text: string): PdfValue {
  return VALUE_PARSER.read(cursorOver(text), 0);
}

function reasonOf(error: unknown): string {
  if (error instanceof PdfRefusal) return error.reason;
  throw error;
}

export function refusalFrom(action: () => unknown): string {
  try {
    action();
  } catch (error) {
    return reasonOf(error);
  }
  return "";
}

export async function refusalFromAsync(action: () => Promise<unknown>): Promise<string> {
  try {
    await action();
  } catch (error) {
    return reasonOf(error);
  }
  return "";
}
