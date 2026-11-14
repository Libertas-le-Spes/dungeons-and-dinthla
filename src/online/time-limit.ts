import type { Refusal } from "../beyond/shape/refusal";

export function withinTimeLimit<T>(work: Promise<T>, limitMs: number, runOut: Refusal): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(runOut), limitMs);
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
