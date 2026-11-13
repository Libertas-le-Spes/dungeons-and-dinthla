import { describe, expect, it, vi } from "vitest";
import { SaidOnce } from "../../src/note-keeping/said-once";

describe("SaidOnce", () => {
  it("says a message once however often it is said for the same key", () => {
    const tell = vi.fn();
    const said = new SaidOnce(tell);
    said.say("a", "first");
    said.say("a", "again");
    expect(tell).toHaveBeenCalledExactlyOnceWith("first");
  });

  it("says a message for each different key", () => {
    const tell = vi.fn();
    const said = new SaidOnce(tell);
    said.say("a", "one");
    said.say("b", "two");
    expect(tell.mock.calls).toEqual([["one"], ["two"]]);
  });
});
