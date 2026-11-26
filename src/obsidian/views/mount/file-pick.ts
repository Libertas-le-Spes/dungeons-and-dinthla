import type { ChosenFile, FileChoice } from "../../../views/elements/kinds/fields";

const FIRST_FILE = 0;

class PickedBlob implements ChosenFile {
  readonly size: number;

  constructor(private readonly file: Blob) {
    this.size = file.size;
  }

  async bytes(): Promise<Uint8Array> {
    return new Uint8Array(await this.file.arrayBuffer());
  }
}

export class FilePick {
  constructor(
    private readonly input: HTMLInputElement,
    private readonly field: FileChoice,
  ) {}

  listen(): void {
    this.input.addEventListener("change", this);
  }

  handleEvent(): void {
    const list = this.input.files;
    if (list === null) return;
    const file = list.item(FIRST_FILE);
    if (file === null) return;
    this.field.chosen(new PickedBlob(file));
  }
}
