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
