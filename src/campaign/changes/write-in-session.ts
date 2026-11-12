import type { FencedFiles } from "../../fence/gate/fenced-files";
import { refuseIfSessionGone } from "../paths/session-gone";
import type { RecordChange } from "./record-change";
import type { SessionChangeWriter } from "./session-change-writer";
import { writeRecordChange } from "./write-record-change";

export async function writeInSession<Plan>(
  files: Pick<FencedFiles, "getFileByPath">,
  sessionPath: string,
  changeOf: () => RecordChange<Plan>,
  writer: Pick<SessionChangeWriter, "apply">,
): Promise<boolean> {
  refuseIfSessionGone(files, sessionPath);
  return writeRecordChange(changeOf(), writer);
}
