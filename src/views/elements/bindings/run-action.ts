import type { OpenPlace } from "./open-place";
import type { PageAction } from "./page-action";

export class RunAction implements PageAction {
  constructor(private readonly runs: () => void) {}

  run(_place: OpenPlace): void {
    this.runs();
  }
}
