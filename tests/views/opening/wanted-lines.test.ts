import { describe, expect, it, vi } from "vitest";
import { WantedLines } from "../../../src/views/opening/wanted-lines";

const SESSION = "Pale Moon/Sessions/Session 2.md";
const OTHER = "Pale Moon/Sessions/Session 3.md";

describe("WantedLines", () => {
  it("hands the line asked for to the session it was asked in, once", () => {
    const wanted = new WantedLines();
    wanted.want(SESSION, 4);
    expect(wanted.takeFor(SESSION)).toBe(4);
    expect(wanted.takeFor(SESSION)).toBeNull();
  });

  it("keeps the line for its own session when another session asks", () => {
    const wanted = new WantedLines();
    wanted.want(SESSION, 4);
    expect(wanted.takeFor(OTHER)).toBeNull();
    expect(wanted.takeFor(SESSION)).toBe(4);
  });

  it("keeps only the newest line asked for", () => {
    const wanted = new WantedLines();
    wanted.want(SESSION, 4);
    wanted.want(OTHER, 2);
    expect(wanted.takeFor(SESSION)).toBeNull();
    expect(wanted.takeFor(OTHER)).toBe(2);
  });

  it("tells each listener once for each line asked for", () => {
    const wanted = new WantedLines();
    const listener = vi.fn();
    wanted.subscribe(listener);
    wanted.want(SESSION, 4);
    expect(listener).toHaveBeenCalledOnce();
  });

  it("tells a listener nothing after it stops listening", () => {
    const wanted = new WantedLines();
    const listener = vi.fn();
    const stop = wanted.subscribe(listener);
    stop();
    wanted.want(SESSION, 4);
    expect(listener).not.toHaveBeenCalled();
  });
});
