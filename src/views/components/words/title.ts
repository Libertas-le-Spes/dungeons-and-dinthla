import { Heading2, Span } from "../../elements/kinds/containers";

const TITLE_CLASS = "dd-title";
const COUNT_CLASS = "dd-count";

export class Title {
  constructor(private readonly text: string) {}

  build(): Heading2 {
    return new Heading2({ cls: [TITLE_CLASS], text: this.text });
  }

  counted(count: string): Heading2 {
    return new Heading2({ cls: [TITLE_CLASS], text: this.text }, [new Span({ cls: [COUNT_CLASS], text: count })]);
  }
}
