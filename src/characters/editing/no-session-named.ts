import { NoSessionToWrite } from "../../campaign/paths/session-to-write";

export class NoSessionNamed {
  readonly path = "";
  readonly label = null;

  constructor(private readonly words: string) {}

  refuseIfMoved(): void {
    throw new NoSessionToWrite(this.words);
  }
}
