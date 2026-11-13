import type { BlockState } from "./block-state";
import { openText } from "./block-states";

export class BlockTracker {
  private state: BlockState = openText();

  allowsHeading(line: string): boolean {
    const allowed = this.state.allowsHeading;
    this.state = this.state.after(line);
    return allowed;
  }

  isClosed(): boolean {
    return this.state.isClosed;
  }
}
