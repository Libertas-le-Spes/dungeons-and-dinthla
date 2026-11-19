import { holderKeyOf } from "../../campaign/record/holder-key";
import type { ItemStatus } from "./item-plan";

export interface HoldingState {
  holderText: string;
  holderLinked: boolean;
  status: ItemStatus;
  held: number;
}

export interface Receiver {
  readonly holderText: string;
  readonly holderLinked: boolean;
}

function sameHolder(state: HoldingState, holderText: string): boolean {
  return holderKeyOf(state.holderText) === holderKeyOf(holderText);
}

export class ExpectedHoldings {
  constructor(private readonly states: HoldingState[]) {}

  get all(): readonly HoldingState[] {
    return this.states;
  }

  stateOf(holderText: string): HoldingState | null {
    for (const state of this.states) {
      if (sameHolder(state, holderText)) return state;
    }
    return null;
  }

  needsName(holderText: string): boolean {
    const held: HoldingState[] = [];
    for (const state of this.states) {
      if (state.status === "held") held.push(state);
    }
    const [first] = held;
    if (first === undefined) return false;
    return !sameHolder(first, holderText);
  }

  revive(holderText: string): void {
    const state = this.stateOf(holderText);
    if (state !== null) state.status = "held";
  }

  take(holderText: string, count: number, status: ItemStatus): void {
    const state = this.stateOf(holderText);
    if (state === null) return;
    if (count < state.held) state.held -= count;
    else state.status = status;
  }

  give(holderText: string, count: number, receiver: Receiver): void {
    const from = this.stateOf(holderText);
    if (from === null || sameHolder(from, receiver.holderText)) return;
    const existing = this.stateOf(receiver.holderText);
    if (existing === null && count >= from.held) {
      from.holderText = receiver.holderText;
      from.holderLinked = receiver.holderLinked;
      return;
    }
    from.held -= count;
    if (from.held <= 0) this.states.splice(this.states.indexOf(from), 1);
    this.receive(receiver, count, existing);
  }

  private receive(receiver: Receiver, count: number, existing: HoldingState | null): void {
    if (existing === null) {
      this.states.push({ ...receiver, status: "held", held: count });
      return;
    }
    if (existing.status !== "held") existing.held = count;
    else existing.held += count;
    existing.status = "held";
    existing.holderLinked = receiver.holderLinked;
  }
}
