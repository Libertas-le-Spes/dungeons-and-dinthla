import { vi } from "vitest";

export function stubLineOpeners() {
  return { openQuestion: vi.fn(), openQuest: vi.fn(), openItem: vi.fn(), openLedgerEntry: vi.fn() };
}
