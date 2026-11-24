import type { NoteRef } from "../../host/notes/note-ref";
import type { ChangeProperties } from "../../host/notes/note-keeping";
import { NewNoteMaker, type MakerParts } from "../../note-keeping/new-note-maker";
import { PropertyWriter } from "../../note-keeping/property-writer";

function linkAndLines(sessionLink: string, lines: string[]): ChangeProperties {
  return (properties) => {
    properties.session = sessionLink;
    properties.lines = lines;
  };
}

export class KindNoteWriter {
  private readonly maker: NewNoteMaker;
  private readonly properties: PropertyWriter;

  constructor(parts: MakerParts) {
    this.maker = new NewNoteMaker(parts);
    this.properties = new PropertyWriter(parts.store, parts.keeping, parts.syntax);
  }

  async make(path: string, sessionLink: string, lines: string[]): Promise<void> {
    await this.maker.make(path, linkAndLines(sessionLink, lines));
  }

  async fill(file: NoteRef, sessionLink: string, lines: string[]): Promise<void> {
    await this.maker.fill(file, linkAndLines(sessionLink, lines));
  }

  async setLines(file: NoteRef, lines: string[]): Promise<void> {
    await this.properties.set(file, (properties) => {
      properties.lines = lines;
    });
  }

  async trashOrEmpty(file: NoteRef, linesToEmpty: boolean): Promise<boolean> {
    if (await this.maker.trashIfNothingOfHis(file)) return true;
    if (linesToEmpty) await this.setLines(file, []);
    return false;
  }
}
