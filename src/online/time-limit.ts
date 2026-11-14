import type { Refusal } from "../beyond/shape/refusal";

export const TIME_LIMIT_MS = 15_000;

export interface TimeLimit {
  readonly ms: number;
  readonly runOut: Refusal;
}

export function withinTimeLimit<T>(work: Promise<T>, limit: TimeLimit): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(limit.runOut), limit.ms);
    work.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}
