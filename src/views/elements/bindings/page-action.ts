import type { OpenPlace } from "./open-place";

export interface PageAction {
  run(place: OpenPlace): void;
}
