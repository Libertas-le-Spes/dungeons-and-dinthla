import type { Source } from "../campaign/campaign";

export const PENDING_FOCUS_MS = 3000;

export function focusRowAt(container: HTMLElement, source: Source): boolean {
  const rows = Array.from(container.querySelectorAll<HTMLElement>(".dd-row"));
  const row = rows.find((candidate) => candidate.dataset.path === source.path && candidate.dataset.line === String(source.line));
  if (row === undefined) return false;
  const folded = row.closest("details");
  if (folded !== null) folded.open = true;
  row.focus();
  return true;
}

interface PendingFocus {
  container: HTMLElement;
  source: Source;
  fallback: () => void;
  until: number;
}

export class RowFocus {
  private pending: PendingFocus | null = null;

  afterClose(container: HTMLElement, source: Source, changed: boolean, fallback: () => void): void {
    focusRowAt(container, source);
    this.pending = null;
    if (changed) this.pending = { container, source, fallback, until: Date.now() + PENDING_FOCUS_MS };
  }

  afterRender(): void {
    const pending = this.pending;
    this.pending = null;
    if (pending === null || Date.now() > pending.until) return;
    if (!focusRowAt(pending.container, pending.source)) pending.fallback();
  }
}
