import { describe, expect, it } from "vitest";
import { ChangeWork, type ChangeEnds } from "../../../src/views/dialogs/change-work";
import { RecordedTelling } from "../../host/showing/recorded-telling";

const FAILURE = "Couldn't save the sample";
const BROKEN = new Error("The note is gone.");

class HeldChanges {
  readonly finishes: ((wrote: boolean) => void)[] = [];
  readonly fails: ((error: unknown) => void)[] = [];

  held(): Promise<boolean> {
    return new Promise<boolean>(this.keep.bind(this));
  }

  failingAtOnce(): Promise<boolean> {
    throw BROKEN;
  }

  private keep(finish: (wrote: boolean) => void, fail: (error: unknown) => void): void {
    this.finishes.push(finish);
    this.fails.push(fail);
  }
}

class RecordedEnds implements ChangeEnds {
  readonly finishedWith: boolean[] = [];
  readonly failedWith: unknown[] = [];
  readonly saidWhenFailed: number[] = [];

  constructor(private readonly telling: RecordedTelling) {}

  finished(wrote: boolean): void {
    this.finishedWith.push(wrote);
  }

  failed(error: unknown): void {
    this.failedWith.push(error);
    this.saidWhenFailed.push(this.telling.said.length);
  }
}

function working() {
  const telling = new RecordedTelling();
  const ends = new RecordedEnds(telling);
  const changes = new HeldChanges();
  const work = new ChangeWork(telling, ends);
  const save = () => work.run(changes.held.bind(changes), FAILURE);
  const saveFailingAtOnce = () => work.run(changes.failingAtOnce.bind(changes), FAILURE);
  return { telling, ends, changes, work, save, saveFailingAtOnce };
}

describe("a dialog's change work", () => {
  it("starts once when saved twice while the first save runs, and is busy until it ends", () => {
    const { changes, work, save } = working();
    save();
    save();
    expect(changes.finishes).toHaveLength(1);
    expect(work.isBusy()).toBe(true);
  });

  it("can start again once a change has finished, and hands on whether each wrote", async () => {
    const { changes, ends, work, save } = working();
    save();
    changes.finishes[0]!(false);
    await work.settled();
    expect(work.isBusy()).toBe(false);
    save();
    changes.finishes[1]!(true);
    await work.settled();
    expect(ends.finishedWith).toEqual([false, true]);
    expect(ends.failedWith).toEqual([]);
  });

  it("says why a change failed in the dialog's words before handing on the error, and can start again", async () => {
    const { changes, ends, telling, work, save } = working();
    save();
    changes.fails[0]!(BROKEN);
    await work.settled();
    expect(telling.said).toEqual([`${FAILURE}: The note is gone.`]);
    expect(ends.saidWhenFailed).toEqual([1]);
    expect(ends.failedWith).toEqual([BROKEN]);
    save();
    expect(changes.finishes).toHaveLength(2);
  });

  it("says why a change failed when it fails before handing back anything to wait for, and is free again", async () => {
    const { ends, telling, work, saveFailingAtOnce } = working();
    saveFailingAtOnce();
    await work.settled();
    expect(telling.said).toEqual([`${FAILURE}: The note is gone.`]);
    expect(ends.failedWith).toEqual([BROKEN]);
    expect(work.isBusy()).toBe(false);
  });

  it("says nothing when a change finishes", async () => {
    const { changes, telling, work, save } = working();
    save();
    changes.finishes[0]!(true);
    await work.settled();
    expect(telling.said).toEqual([]);
  });
});
