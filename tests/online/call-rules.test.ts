import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { BeyondReply } from "../../src/online/beyond-reply";
import { BeyondCalls, COOLDOWN_MS, TIME_LIMIT_MS } from "../../src/online/call-rules";
import type { CharacterId } from "../../src/online/character-id";
import { COULD_NOT_REACH, STILL_WAITING, TIMED_OUT, TOO_SOON } from "../../src/online/online-words";
import { HeldCalls } from "../stubs/held-calls";
import { goodReply, madeUpId } from "./builders/made-up-beyond";

class MadeUpClock {
  time = 0;

  now(): number {
    return this.time;
  }
}

class Calls {
  readonly held = new HeldCalls<BeyondReply>();
  readonly ids: CharacterId[] = [];

  call(id: CharacterId): Promise<BeyondReply> {
    this.ids.push(id);
    return this.held.hold();
  }
}

let clock: MadeUpClock;
let calls: Calls;
let rules: BeyondCalls;

beforeEach(() => {
  vi.useFakeTimers();
  clock = new MadeUpClock();
  calls = new Calls();
  rules = new BeyondCalls(calls.call.bind(calls), clock.now.bind(clock));
});

afterEach(() => {
  vi.useRealTimers();
});

async function refusedWith(promise: Promise<unknown>): Promise<string> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof Error) return error.message;
    throw error;
  }
  throw new Error("Nothing was refused.");
}

async function pressAndAnswer(): Promise<void> {
  const position = calls.ids.length;
  const pressed = rules.characterFor(madeUpId());
  calls.held.resolve(position, goodReply());
  await pressed;
}

describe("the first press", () => {
  it("sends one call with the id and gives back the character of a good reply", async () => {
    const pressed = rules.characterFor(madeUpId());
    expect(calls.ids).toHaveLength(1);
    calls.held.resolve(0, goodReply());
    const replied = await pressed;
    expect(replied.character.name.text).toBe("Primary Monk");
    expect(vi.getTimerCount()).toBe(0);
  });

  it("is not held back by the cooldown, whatever the clock says", async () => {
    clock.time = -5;
    await pressAndAnswer();
    expect(calls.ids).toHaveLength(1);
  });
});

describe("one call at a time", () => {
  it("sends nothing and says it is still waiting while a call has not been answered", async () => {
    const first = rules.characterFor(madeUpId());
    clock.time = COOLDOWN_MS * 5;
    expect(await refusedWith(rules.characterFor(madeUpId()))).toBe(STILL_WAITING);
    expect(calls.ids).toHaveLength(1);
    calls.held.resolve(0, goodReply());
    await first;
  });

  it("still says it is waiting after the time limit, until the call itself settles", async () => {
    const first = refusedWith(rules.characterFor(madeUpId()));
    await vi.advanceTimersByTimeAsync(TIME_LIMIT_MS);
    expect(await first).toBe(TIMED_OUT);
    clock.time = COOLDOWN_MS * 5;
    expect(await refusedWith(rules.characterFor(madeUpId()))).toBe(STILL_WAITING);
    expect(calls.ids).toHaveLength(1);
    calls.held.resolve(0, goodReply());
    await vi.advanceTimersByTimeAsync(0);
    await pressAndAnswer();
    expect(calls.ids).toHaveLength(2);
  });

  it("is free again after a call that failed", async () => {
    const first = refusedWith(rules.characterFor(madeUpId()));
    calls.held.reject(0, new Error("offline"));
    expect(await first).toBe(COULD_NOT_REACH);
    clock.time = COOLDOWN_MS;
    await pressAndAnswer();
    expect(calls.ids).toHaveLength(2);
  });
});

describe("the cooldown", () => {
  it("refuses a press less than ten seconds after the last one was sent, and sends nothing", async () => {
    await pressAndAnswer();
    clock.time = COOLDOWN_MS - 1;
    expect(await refusedWith(rules.characterFor(madeUpId()))).toBe(TOO_SOON);
    expect(calls.ids).toHaveLength(1);
  });

  it("lets a press through at exactly ten seconds", async () => {
    await pressAndAnswer();
    clock.time = COOLDOWN_MS;
    await pressAndAnswer();
    expect(calls.ids).toHaveLength(2);
  });

  it("counts from the press that sent, not from a press that was refused", async () => {
    await pressAndAnswer();
    clock.time = COOLDOWN_MS - 1;
    await refusedWith(rules.characterFor(madeUpId()));
    clock.time = COOLDOWN_MS;
    await pressAndAnswer();
    expect(calls.ids).toHaveLength(2);
  });

  it("counts from the press, not from when the reply came", async () => {
    const first = rules.characterFor(madeUpId());
    clock.time = 8_000;
    calls.held.resolve(0, goodReply());
    await first;
    clock.time = COOLDOWN_MS;
    await pressAndAnswer();
    expect(calls.ids).toHaveLength(2);
  });
});

describe("the time limit", () => {
  it("keeps waiting until the limit and stops waiting at it, saying so", async () => {
    const pressed = refusedWith(rules.characterFor(madeUpId()));
    let said: string | null = null;
    void pressed.then((words) => {
      said = words;
    });
    await vi.advanceTimersByTimeAsync(TIME_LIMIT_MS - 1);
    expect(said).toBeNull();
    await vi.advanceTimersByTimeAsync(1);
    expect(said).toBe(TIMED_OUT);
  });

  it("drops a reply that comes after the limit, so nothing is given back", async () => {
    const pressed = rules.characterFor(madeUpId());
    const refused = refusedWith(pressed);
    await vi.advanceTimersByTimeAsync(TIME_LIMIT_MS);
    expect(await refused).toBe(TIMED_OUT);
    calls.held.resolve(0, goodReply());
    await vi.advanceTimersByTimeAsync(0);
    expect(await refusedWith(pressed)).toBe(TIMED_OUT);
  });

  it("says it could not reach D&D Beyond when the call fails, and stops the timer", async () => {
    const pressed = refusedWith(rules.characterFor(madeUpId()));
    calls.held.reject(0, new Error("offline"));
    expect(await pressed).toBe(COULD_NOT_REACH);
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe("a reply that is not a character", () => {
  it("is refused in plain words after the call, and frees the next press after the cooldown", async () => {
    const pressed = refusedWith(rules.characterFor(madeUpId()));
    calls.held.resolve(0, { status: 404, contentType: "application/json", text: "{}" });
    expect(await pressed).toBe("No character has that link.");
    clock.time = COOLDOWN_MS;
    await pressAndAnswer();
    expect(calls.ids).toHaveLength(2);
  });
});
