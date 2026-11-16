import type { ViewState, WorkspaceLeaf } from "obsidian";

type SetViewState = WorkspaceLeaf["setViewState"];

export interface ViewStateSetter {
  setViewState: SetViewState;
}

export type ChangeViewState = (viewState: ViewState, leaf: WorkspaceLeaf) => ViewState;

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

interface PatchSwitch {
  active: boolean;
}

function changedState(patch: PatchSwitch, change: ChangeViewState, viewState: ViewState, leaf: WorkspaceLeaf): ViewState {
  if (!patch.active) return viewState;
  try {
    return change(viewState, leaf);
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

function tellSettled(patch: PatchSwitch, settled: ViewStateSettled, leaf: WorkspaceLeaf, step: SetStep): void {
  if (!patch.active) return;
  try {
    settled(leaf, step);
  } catch {
    return;
  }
}

function ignoreFailure(): void {}

function undoPatch(owner: ViewStateSetter, wrapper: SetViewState, original: SetViewState, patch: PatchSwitch): void {
  patch.active = false;
  if (owner.setViewState === wrapper) owner.setViewState = original;
}

export function patchSetViewState(owner: ViewStateSetter, hooks: ViewStateHooks): () => void {
  const original = owner.setViewState;
  const patch: PatchSwitch = { active: true };
  const wrapper: SetViewState = function (this: WorkspaceLeaf, viewState: ViewState, eState?: unknown) {
    const typeBefore = typeShownIn(this);
    const sent = changedState(patch, hooks.change, viewState, this);
    const setting = original.call(this, sent, eState);
    const step = { typeBefore, incoming: viewState, sent };
    void Promise.resolve(setting).then(() => tellSettled(patch, hooks.settled, this, step), ignoreFailure);
    return setting;
  };
  owner.setViewState = wrapper;
  return () => undoPatch(owner, wrapper, original, patch);
}
