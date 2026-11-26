import { debounce, type Debouncer } from "obsidian";
import type { Pause, Pauses } from "../../host/keeping/pauses";

class DebouncedPause<Args extends unknown[]> implements Pause<Args> {
  constructor(private readonly debouncer: Debouncer<Args, void>) {}

  call(...args: Args): void {
    this.debouncer(...args);
  }

  cancel(): void {
    this.debouncer.cancel();
  }
}

class ObsidianPauses implements Pauses {
  pauseOf<Args extends unknown[]>(run: (...args: Args) => void, ms: number): Pause<Args> {
    return new DebouncedPause(debounce<Args, void>(run, ms, true));
  }
}

export const OBSIDIAN_PAUSES: Pauses = new ObsidianPauses();
