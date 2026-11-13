import type { LineLoss } from "../../../../beyond/sheet/lines/line-loss";
import { LEFT_OUT_START } from "../../../layout/section-line-format";

export function leftOutLinesOf(loss: LineLoss): string[] {
  if (loss.tooLong + loss.notClean === 0) return [];
  return [`${LEFT_OUT_START}${loss.tooLong} too long, ${loss.notClean} not clean`];
}
