import { SOURCE_ROWS, sourceKeyOf } from "./row-keys";
import type { Source } from "../../campaign/record/campaign";

export const PENDING_FOCUS_MS = 3000;

export function focusRowAt(container: HTMLElement, source: Source): boolean {
  const rows = Array.from(container.querySelectorAll<HTMLElement>(".dd-row"));
  const key = sourceKeyOf(source);
  const row = rows.find((candidate) => SOURCE_ROWS.keyOf(candidate) === key);
  if (row === undefined) return false;
  const folded = row.closest("details");
  if (folded !== null) folded.open = true;
  row.focus();
  return true;
}

export type FocusRow = () => boolean;

export const NO_ROW: FocusRow = () => false;

interface PendingFocus {
  focusRow: FocusRow;
  fallback: () => void;
  until: number;
}

export class RowFocus {
  private pending: PendingFocus | null = null;

  afterClose(focusRow: FocusRow, changed: boolean, fallback: () => void): void {
    focusRow();
    this.pending = null;
    if (changed) this.pending = { focusRow, fallback, until: Date.now() + PENDING_FOCUS_MS };
  }

  afterRender(): void {
    const pending = this.pending;
    this.pending = null;
    if (pending === null || Date.now() > pending.until) return;
    if (!pending.focusRow()) pending.fallback();
  }
}
