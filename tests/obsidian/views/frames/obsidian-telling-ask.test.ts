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

import { firstOf, secondOf } from "../../../stubs/lists";
import { OBSIDIAN_TELLING } from "../../../../src/obsidian/views/frames/obsidian-telling";

beforeEach(() => {
  made.notices.length = 0;
  made.buttons.length = 0;
});

function askWith(first: () => void, second: () => void): void {
  OBSIDIAN_TELLING.ask("Questions for Session 2 differ from the session.", [
    { words: "Fix", chosen: first },
    { words: "Keep", chosen: second },
  ]);
}

describe("asking in a notice", () => {
  it("shows one notice that stays until it is dismissed, holding the message", () => {
    askWith(vi.fn(), vi.fn());
    expect(made.notices).toHaveLength(1);
    expect(firstOf(made.notices).timeout).toBe(0);
    expect(firstOf(made.notices).spans).toEqual(["Questions for Session 2 differ from the session. "]);
  });

  it("offers each choice as a button, in order", () => {
    askWith(vi.fn(), vi.fn());
    expect(made.buttons.map((button) => button.text)).toEqual(["Fix", "Keep"]);
  });

  it("calls the first choice once, and not the second, when it is pressed, and hides the notice", () => {
    const fix = vi.fn();
    const keep = vi.fn();
    askWith(fix, keep);
    firstOf(made.buttons).click();
    expect(fix).toHaveBeenCalledOnce();
    expect(keep).not.toHaveBeenCalled();
    expect(firstOf(made.notices).hide).toHaveBeenCalledOnce();
  });

  it("calls the second choice once, and not the first, when it is pressed, and hides the notice", () => {
    const fix = vi.fn();
    const keep = vi.fn();
    askWith(fix, keep);
    secondOf(made.buttons).click();
    expect(keep).toHaveBeenCalledOnce();
    expect(fix).not.toHaveBeenCalled();
    expect(firstOf(made.notices).hide).toHaveBeenCalledOnce();
  });
});
