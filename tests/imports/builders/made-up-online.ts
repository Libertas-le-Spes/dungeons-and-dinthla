import type { PrintedSheet } from "../../../src/beyond/sheet/printed-sheet";
import type { OnlineBlock } from "../../../src/imports/dialog/online/online-block";
import type { OnlineSource } from "../../../src/imports/dialog/online/online-source";
import { HeldCalls } from "../../stubs/held-calls";

class UnusedOnline implements OnlineSource {
  sheetFor(): Promise<PrintedSheet> {
    return Promise.reject(new Error("A test reached the online route without setting it up."));
  }
}

class NoOnlineBlock implements OnlineBlock {
  draw(): void {}
}

export const NO_ONLINE: OnlineSource = new UnusedOnline();
export const NO_ONLINE_BLOCK: OnlineBlock = new NoOnlineBlock();

export class HeldOnline implements OnlineSource {
  readonly held = new HeldCalls<PrintedSheet>();
  readonly links: string[] = [];

  sheetFor(link: string): Promise<PrintedSheet> {
    this.links.push(link);
    return this.held.hold();
  }
}
