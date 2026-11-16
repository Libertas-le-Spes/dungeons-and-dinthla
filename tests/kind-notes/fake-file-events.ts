import type { EventRef, TAbstractFile } from "obsidian";
import type { FileEvent } from "../../src/fence/gate/fenced-files";
import { fileAt } from "../stubs/note-files";

type Heard = (file: TAbstractFile) => unknown;

interface Listener {
  name: FileEvent;
  heard: Heard;
}

export class FakeFileEvents {
  private readonly listeners = new Map<EventRef, Listener>();

  on(name: FileEvent, callback: (...data: never[]) => unknown): EventRef {
    const ref: EventRef = {};
    this.listeners.set(ref, { name, heard: callback as Heard });
    return ref;
  }

  offref(ref: EventRef): void {
    this.listeners.delete(ref);
  }

  modify(path: string): void {
    for (const listener of this.listeners.values()) this.tellIfModify(listener, path);
  }

  private tellIfModify(listener: Listener, path: string): void {
    if (listener.name === "modify") listener.heard(fileAt(path));
  }
}
