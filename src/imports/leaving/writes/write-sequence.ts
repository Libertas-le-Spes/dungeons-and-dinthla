import type { PlannedWrite } from "./planned-write";
import { nothingSwitched, partlySwitched } from "./write-words";

export class WriteSequence {
  constructor(private readonly writes: readonly PlannedWrite[]) {}

  async run(): Promise<void> {
    const done: string[] = [];
    for (const write of this.writes) {
      try {
        await write.apply();
      } catch (error) {
        if (done.length === 0) throw nothingSwitched(write.failed, error);
        throw partlySwitched(done, write.failed, error);
      }
      done.push(write.done);
    }
  }
}
