import type { ViewState, WorkspaceLeaf } from "obsidian";

type SetViewState = WorkspaceLeaf["setViewState"];

export interface ViewStateSetter {
  setViewState: SetViewState;
}

export type ChangeViewState = (viewState: ViewState) => ViewState;

interface PatchSwitch {
  active: boolean;
}

function changedState(patch: PatchSwitch, change: ChangeViewState, viewState: ViewState): ViewState {
  if (!patch.active) return viewState;
  try {
    return change(viewState);
  } catch {
    return viewState;
  }
}

function undoPatch(owner: ViewStateSetter, wrapper: SetViewState, original: SetViewState, patch: PatchSwitch): void {
  patch.active = false;
  if (owner.setViewState === wrapper) owner.setViewState = original;
}

export function patchSetViewState(owner: ViewStateSetter, change: ChangeViewState): () => void {
  const original = owner.setViewState;
  const patch: PatchSwitch = { active: true };
  const wrapper: SetViewState = function (this: WorkspaceLeaf, viewState: ViewState, eState?: unknown) {
    return original.call(this, changedState(patch, change, viewState), eState);
  };
  owner.setViewState = wrapper;
  return () => undoPatch(owner, wrapper, original, patch);
}
