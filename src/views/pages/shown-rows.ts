import type { Source } from "../../campaign/record/campaign";
import { KeptHandle } from "../elements/bindings/kept-handle";
import { sourceKeyOf } from "../lists/row-keys";

export class ShownRows {
  private readonly rows = new Map<string, KeptHandle>();

  clear(): void {
    this.rows.clear();
  }

  handleFor(source: Source): KeptHandle {
    const handle = new KeptHandle();
    this.rows.set(sourceKeyOf(source), handle);
    return handle;
  }

  focus(source: Source): boolean {
    const handle = this.rows.get(sourceKeyOf(source));
    if (handle === undefined) return false;
    handle.focus();
    return true;
  }
}
