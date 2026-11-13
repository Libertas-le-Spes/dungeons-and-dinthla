import { vi, type Mock } from "vitest";
import type { WrittenListener } from "../../../src/fence/gate/written-notes";

export interface ReportListenerSpy extends WrittenListener {
  textSaved: Mock<(path: string, text: string) => void>;
  trashed: Mock<(path: string) => void>;
  renamed: Mock<(from: string, to: string) => void>;
  heardNothing(): boolean;
}

export function reportListenerSpy(): ReportListenerSpy {
  const spy: ReportListenerSpy = {
    textSaved: vi.fn<(path: string, text: string) => void>(),
    trashed: vi.fn<(path: string) => void>(),
    renamed: vi.fn<(from: string, to: string) => void>(),
    heardNothing: () => spy.textSaved.mock.calls.length + spy.trashed.mock.calls.length + spy.renamed.mock.calls.length === 0,
  };
  return spy;
}
