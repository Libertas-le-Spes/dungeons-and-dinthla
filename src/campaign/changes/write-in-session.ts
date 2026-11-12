import type { OpenedSession } from "../paths/session-gone";
import type { RecordChange } from "./record-change";
import type { SessionChangeWriter } from "./session-change-writer";
import { writeRecordChange } from "./write-record-change";

export async function writeInSession<Plan>(
  session: OpenedSession,
  changeOf: () => RecordChange<Plan>,
  writer: Pick<SessionChangeWriter, "apply">,
): Promise<boolean> {
  session.refuseIfMoved();
  return writeRecordChange(changeOf(), writer);
}
