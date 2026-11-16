import { Events, type EventRef } from "obsidian";
import type { FileEvent } from "../../src/fence/gate/fenced-files";

type Heard = (...data: unknown[]) => unknown;

export class FileEvents extends Events {
  override on(name: FileEvent, callback: (...data: never[]) => unknown): EventRef {
    return super.on(name, callback as Heard);
  }
}
