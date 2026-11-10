import type { LineState } from "./line-state";

export interface ThreadStatus {
  className: string;
  label: string;
}

export interface ThreadLook {
  markClass: string;
  sign: string;
  label: string | null;
  textClass: string;
  status: ThreadStatus | null;
}

export interface EndedLook {
  state: LineState;
  row: ThreadLook;
}
