import type { ViewState, WorkspaceLeaf } from "obsidian";
import { around } from "monkey-around";

type SetViewState = WorkspaceLeaf["setViewState"];

export interface ViewStateSetter {
  setViewState: SetViewState;
}

export type ChangeViewState = (viewState: ViewState) => ViewState;

export interface SetStep {
  typeBefore: string;
  incoming: ViewState;
  sent: ViewState;
}

export type ViewStateSettled = (leaf: WorkspaceLeaf, step: SetStep) => void;

export interface ViewStateHooks {
  change: ChangeViewState;
  settled: ViewStateSettled;
}

function changedState(change: ChangeViewState, viewState: ViewState): ViewState {
  try {
    return change(viewState);
  } catch {
    return viewState;
  }
}

function typeShownIn(leaf: WorkspaceLeaf): string {
  try {
    return leaf.view.getViewType();
  } catch {
    return "";
  }
}

function tellSettled(settled: ViewStateSettled, leaf: WorkspaceLeaf, step: SetStep): void {
  try {
    settled(leaf, step);
  } catch {
    return;
  }
}

function ignoreFailure(): void {}

function wrapperOf(hooks: ViewStateHooks, original: SetViewState): SetViewState {
  return function (this: WorkspaceLeaf, viewState: ViewState, eState?: unknown) {
    const typeBefore = typeShownIn(this);
    const sent = changedState(hooks.change, viewState);
    const setting = original.call(this, sent, eState);
    const step = { typeBefore, incoming: viewState, sent };
    void Promise.resolve(setting).then(() => tellSettled(hooks.settled, this, step), ignoreFailure);
    return setting;
  };
}

export function patchSetViewState(owner: ViewStateSetter, hooks: ViewStateHooks): () => void {
  return around(owner, { setViewState: wrapperOf.bind(null, hooks) });
}
