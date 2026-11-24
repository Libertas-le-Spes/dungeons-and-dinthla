import { Paragraph } from "../../elements/kinds/containers";

const EMPTY_CLASS = "dd-empty";

export class Empty {
  constructor(private readonly text: string) {}

  build(): Paragraph {
    return new Paragraph({ cls: [EMPTY_CLASS], text: this.text });
  }
}
