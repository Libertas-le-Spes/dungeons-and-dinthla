import type { Mounter, MountPlace } from "./mounter";

export interface ViewElement {
  mountOn(mounter: Mounter, into: MountPlace): void;
}

export function mountAll(children: readonly ViewElement[], mounter: Mounter, into: MountPlace): void {
  for (const child of children) child.mountOn(mounter, into);
}
