import { beforeEach, describe, expect, it, vi } from "vitest";

const made = vi.hoisted(() => ({
  notices: [] as { message: string; timeout: number; spans: string[]; hide: () => void }[],
  buttons: [] as { text: string; click: () => void }[],
}));

vi.mock("obsidian", () => {
  class Notice {
    readonly messageEl = {
      createSpan: (options: { text: string }) => {
        this.record.spans.push(options.text);
      },
    };
    readonly hide = vi.fn();
    private readonly record: { message: string; timeout: number; spans: string[]; hide: () => void };

    constructor(message: string, timeout: number) {
      this.record = { message, timeout, spans: [], hide: this.hide };
      made.notices.push(this.record);
    }
  }
  class ButtonComponent {
    private text = "";

    constructor(readonly containerEl: unknown) {}

    setButtonText(text: string): this {
      this.text = text;
      return this;
    }

    onClick(click: () => void): this {
      made.buttons.push({ text: this.text, click });
      return this;
    }
  }
  return { Notice, ButtonComponent };
});

import { askInNotice } from "../../../src/views/dialogs/differing-notice";

beforeEach(() => {
  made.notices.length = 0;
  made.buttons.length = 0;
});

describe("askInNotice", () => {
  it("shows one notice that stays until it is dismissed, holding the message", () => {
    askInNotice("Questions for Session 2 differ from the session.", vi.fn(), vi.fn());
    expect(made.notices).toHaveLength(1);
    expect(made.notices[0]?.timeout).toBe(0);
    expect(made.notices[0]?.spans).toEqual(["Questions for Session 2 differ from the session. "]);
  });

  it("offers Fix and Keep, in that order", () => {
    askInNotice("message", vi.fn(), vi.fn());
    expect(made.buttons.map((button) => button.text)).toEqual(["Fix", "Keep"]);
  });

  it("calls fix once, and not keep, when Fix is pressed, and hides the notice", () => {
    const fix = vi.fn();
    const keep = vi.fn();
    askInNotice("message", fix, keep);
    made.buttons[0]?.click();
    expect(fix).toHaveBeenCalledOnce();
    expect(keep).not.toHaveBeenCalled();
    expect(made.notices[0]?.hide).toHaveBeenCalledOnce();
  });

  it("calls keep once, and not fix, when Keep is pressed, and hides the notice", () => {
    const fix = vi.fn();
    const keep = vi.fn();
    askInNotice("message", fix, keep);
    made.buttons[1]?.click();
    expect(keep).toHaveBeenCalledOnce();
    expect(fix).not.toHaveBeenCalled();
    expect(made.notices[0]?.hide).toHaveBeenCalledOnce();
  });
});
