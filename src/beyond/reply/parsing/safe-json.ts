import { byteCountOf } from "../../shape/byte-count";
import { REPLY_DEPTH, REPLY_SIZE } from "../../shape/import-limits";
import { refuseAbove } from "../../shape/refuse-above";
import { notJson } from "../reply-refusals";
import { keptValue } from "./dropped-keys";
import { deepestNestingOf } from "./nesting-depth";

function parsed(text: string): unknown {
  try {
    return JSON.parse(text, keptValue);
  } catch {
    throw notJson();
  }
}

export function safeJsonOf(text: string): unknown {
  refuseAbove(REPLY_SIZE, byteCountOf(text));
  refuseAbove(REPLY_DEPTH, deepestNestingOf(text));
  return parsed(text);
}
