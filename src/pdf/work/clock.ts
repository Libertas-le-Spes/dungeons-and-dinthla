export type Clock = () => number;

export function wallClock(): number {
  return Date.now();
}
