interface Held<T> {
  resolve: (value: T) => void;
  reject: (error: Error) => void;
}

interface Waiter {
  count: number;
  wake: () => void;
}

export class HeldCalls<T> {
  private readonly held: Held<T>[] = [];
  private waiters: Waiter[] = [];

  hold(): Promise<T> {
    const promise = new Promise<T>(this.keep.bind(this));
    this.wakeWaiters();
    return promise;
  }

  made(count: number): Promise<void> {
    const waiting = new Promise<void>(this.waitFor.bind(this, count));
    this.wakeWaiters();
    return waiting;
  }

  resolve(position: number, value: T): void {
    this.at(position).resolve(value);
  }

  reject(position: number, error: Error): void {
    this.at(position).reject(error);
  }

  private keep(resolve: (value: T) => void, reject: (error: Error) => void): void {
    this.held.push({ resolve, reject });
  }

  private waitFor(count: number, wake: () => void): void {
    this.waiters.push({ count, wake });
  }

  private at(position: number): Held<T> {
    const held = this.held[position];
    if (held === undefined) throw new Error(`Call ${position} was never made.`);
    return held;
  }

  private wakeWaiters(): void {
    const still: Waiter[] = [];
    for (const waiter of this.waiters) {
      if (this.held.length >= waiter.count) waiter.wake();
      else still.push(waiter);
    }
    this.waiters = still;
  }
}
