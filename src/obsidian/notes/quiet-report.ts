import type { WriteReport } from "../../fence/notes/write-report";

class QuietReport implements WriteReport {
  textSaved(): void {}

  trashed(): void {}

  renamed(): void {}
}

export const GATE_REPORTS_WRITES: WriteReport = new QuietReport();
