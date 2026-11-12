import type { StartInflating } from "./streams/inflate/inflated-chunks";
import { startPlatformInflating } from "./streams/inflate/platform-inflating";
import type { Clock } from "./work/clock";
import { wallClock } from "./work/clock";

export interface ReaderParts {
  startInflating: StartInflating;
  clock: Clock;
}

export const PLATFORM_PARTS: ReaderParts = { startInflating: startPlatformInflating, clock: wallClock };
