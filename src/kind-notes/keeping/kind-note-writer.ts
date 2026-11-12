import type { TFile } from "obsidian";
import type { ChangeProperties } from "../../fence/gate/fenced-file-actions";
import { NewNoteMaker, type MakerActions, type MakerFiles } from "../../note-keeping/new-note-maker";
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

  constructor(files: MakerFiles, actions: MakerActions) {
    this.maker = new NewNoteMaker(files, actions);
    this.properties = new PropertyWriter(files, actions);
  }

  async make(path: string, sessionLink: string, lines: string[]): Promise<void> {
    await this.maker.make(path, linkAndLines(sessionLink, lines));
  }

  async fill(file: TFile, sessionLink: string, lines: string[]): Promise<void> {
    await this.maker.fill(file, linkAndLines(sessionLink, lines));
  }

  async setLines(file: TFile, lines: string[]): Promise<void> {
    await this.properties.set(file, (properties) => {
      properties.lines = lines;
    });
  }

  async trashOrEmpty(file: TFile, linesToEmpty: boolean): Promise<void> {
    if (await this.maker.trashIfNothingOfHis(file)) return;
    if (linesToEmpty) await this.setLines(file, []);
  }
}
