export interface Pause<Args extends unknown[]> {
  call(...args: Args): void;
  cancel(): void;
}

export interface Pauses {
  pauseOf<Args extends unknown[]>(run: (...args: Args) => void, ms: number): Pause<Args>;
}
