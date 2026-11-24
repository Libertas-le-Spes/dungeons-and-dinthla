import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { App } from "obsidian";
import { NewSessionDialog } from "../../src/sessions/new-session-dialog";
import type { NewSession } from "../../src/sessions/create-session";
import { ModalFrame } from "../../src/obsidian/views/frames/modal-frame";
import { MountedView } from "../host/showing/mounted-view";

function opened() {
  const start = vi.fn(async (_session: NewSession) => undefined);
  const shown = new NewSessionDialog(7, start);
  const modal = new ModalFrame({} as App, shown);
  modal.contentEl.ownerDocument.body.append(modal.contentEl);
  modal.open();
  const [title, played] = Array.from(modal.contentEl.querySelectorAll("input"));
  const button = (text: string) => Array.from(modal.contentEl.querySelectorAll("button")).find((candidate) => candidate.textContent === text)!;
  return { modal, shown, start, title: title!, played: played!, button };
}

function typed(el: HTMLInputElement, value: string): void {
  el.value = value;
  el.dispatchEvent(new (el.ownerDocument.defaultView!).Event("input"));
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 2, 7, 12));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("NewSessionDialog", () => {
  it("is titled for the session it starts, starts in the title, and has today in its date field", () => {
    const { modal, title, played } = opened();
    expect((modal as unknown as { title: string }).title).toBe("Start session 7");
    expect(title.ownerDocument.activeElement).toBe(title);
    expect(played.type).toBe("date");
    expect(played.value).toBe("2026-03-07");
  });

  it("puts the cursor in the title when it opens, whatever the frame focuses", () => {
    const view = new MountedView();
    new NewSessionDialog(7, vi.fn()).opened(view);
    expect(view.focused()).toBe(view.into.querySelector("input"));
  });

  it("closes and starts the session with what was typed", async () => {
    const { shown, start, title, played, button, modal } = opened();
    typed(title, "The Old Mill");
    typed(played, "2026-03-01");
    button("Start session").click();
    await shown.startSettled();
    expect(start.mock.calls).toEqual([[{ title: "The Old Mill", played: "2026-03-01" }]]);
    expect(modal.contentEl.childNodes).toHaveLength(0);
  });

  it("starts the session on Enter in the title", () => {
    const { start, title } = opened();
    title.dispatchEvent(new (title.ownerDocument.defaultView!).KeyboardEvent("keydown", { key: "Enter", cancelable: true }));
    expect(start).toHaveBeenCalledOnce();
  });

  it("takes today when the date was emptied", () => {
    const { start, played, button } = opened();
    typed(played, "");
    button("Start session").click();
    expect(start.mock.calls).toEqual([[{ title: "", played: "2026-03-07" }]]);
  });

  it("starts nothing on Cancel", () => {
    const { start, button, modal } = opened();
    button("Cancel").click();
    expect(start).not.toHaveBeenCalled();
    expect(modal.contentEl.childNodes).toHaveLength(0);
  });
});
