const TOO_LONG_END = " too long";
const NOT_CLEAN_END = " not clean";
const BETWEEN_COUNTS = ", ";
const WHOLE_NUMBER = /^\d+$/;

export interface LeftOutCounts {
  readonly tooLong: number;
  readonly notClean: number;
}

function countBefore(part: string, ending: string): number | null {
  if (part.endsWith(ending) === false) return null;
  const digits = part.substring(0, part.length - ending.length);
  if (WHOLE_NUMBER.test(digits) === false) return null;
  return Number(digits);
}

export function leftOutCountsOf(written: string): LeftOutCounts | null {
  const between = written.indexOf(BETWEEN_COUNTS);
  if (between === -1) return null;
  const tooLong = countBefore(written.substring(0, between), TOO_LONG_END);
  const notClean = countBefore(written.substring(between + BETWEEN_COUNTS.length), NOT_CLEAN_END);
  if (tooLong === null || notClean === null) return null;
  return { tooLong, notClean };
}
