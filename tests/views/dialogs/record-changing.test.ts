import { describe, expect, it, vi } from "vitest";
import { PartlyWritten } from "../../../src/campaign/writing/note-editor";
import type { DialogView } from "../../../src/views/dialogs/dialog-view";
import { RecordChanging } from "../../../src/views/dialogs/record-changing";
import { RecordedTelling } from "../../host/showing/recorded-telling";

function changing() {
  const onClosed = vi.fn();
  const view: DialogView = { show: vi.fn(), close: vi.fn() };
  const record = new RecordChanging(new RecordedTelling(), onClosed);
  record.opened(view);
  return { record, view, onClosed };
}

describe("a dialog that changes a record", () => {
  it.each([
    ["wrote", true],
    ["wrote nothing", false],
  ])("closes its view once a change that %s finishes, and tells whether it changed when closed", async (_how, wrote) => {
    const { record, view, onClosed } = changing();
    record.run(async () => wrote, "Couldn't");
    await record.settled();
    expect(view.close).toHaveBeenCalledOnce();
    record.closed();
    expect(onClosed).toHaveBeenCalledWith(wrote);
  });

  it("closes as changed when only part of a change was written", async () => {
    const { record, view, onClosed } = changing();
    record.run(async () => Promise.reject(new PartlyWritten("Only one line.")), "Couldn't");
    await record.settled();
    expect(view.close).toHaveBeenCalledOnce();
    record.closed();
    expect(onClosed).toHaveBeenCalledWith(true);
  });

  it("stays open when a change fails outright, so it can be tried again", async () => {
    const { record, view } = changing();
    record.run(async () => Promise.reject(new Error("The disk is full.")), "Couldn't");
    await record.settled();
    expect(view.close).not.toHaveBeenCalled();
    expect(record.mayClose()).toBe(true);
  });

  it("may not close while a change runs", () => {
    const { record } = changing();
    record.run(() => new Promise<boolean>(() => undefined), "Couldn't");
    expect(record.mayClose()).toBe(false);
  });

  it("stops everything it keeps when closed", () => {
    const { record } = changing();
    const first = { stop: vi.fn() };
    const second = { stop: vi.fn() };
    record.stopOnClose(first);
    record.stopOnClose(second);
    record.closed();
    expect(first.stop).toHaveBeenCalledOnce();
    expect(second.stop).toHaveBeenCalledOnce();
  });

  it("closes nothing when asked to close before it was opened", () => {
    const onClosed = vi.fn();
    const record = new RecordChanging(new RecordedTelling(), onClosed);
    record.close();
    record.closed();
    expect(onClosed).toHaveBeenCalledWith(false);
  });
});
