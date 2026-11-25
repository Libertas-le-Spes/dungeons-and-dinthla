import type { Pause, Pauses } from "../../src/host/keeping/pauses";

class HeldCall<Args extends unknown[]> {
  constructor(
    private readonly run: (...args: Args) => void,
    private readonly args: Args,
  ) {}

  go(): void {
    this.run(...this.args);
  }
}

class HeldPause<Args extends unknown[]> implements Pause<Args> {
  constructor(
    private readonly pauses: HeldPauses,
    private readonly run: (...args: Args) => void,
  ) {}

  call(...args: Args): void {
    const held = new HeldCall(this.run, args);
    this.pauses.hold(held.go.bind(held));
  }

  cancel(): void {
    this.pauses.hold(null);
  }
}

export class HeldPauses implements Pauses {
  private waiting: (() => void) | null = null;
  readonly waits: number[] = [];

  pauseOf<Args extends unknown[]>(run: (...args: Args) => void, ms: number): Pause<Args> {
    this.waits.push(ms);
    return new HeldPause(this, run);
  }

  hold(call: (() => void) | null): void {
    this.waiting = call;
  }

  settle(): void {
    const call = this.waiting;
    this.waiting = null;
    if (call !== null) call();
  }
}

class AtOncePause<Args extends unknown[]> implements Pause<Args> {
  constructor(private readonly run: (...args: Args) => void) {}

  call(...args: Args): void {
    this.run(...args);
  }

  cancel(): void {}
}

class AtOncePauses implements Pauses {
  pauseOf<Args extends unknown[]>(run: (...args: Args) => void): Pause<Args> {
    return new AtOncePause(run);
  }
}

export const AT_ONCE_PAUSES: Pauses = new AtOncePauses();
