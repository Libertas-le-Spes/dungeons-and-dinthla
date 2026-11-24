import type { BindingWiring, HandleWanted, TextChange } from "./binding-wiring";
import type { ElementBinding } from "./element-binding";
import type { PageAction } from "./page-action";

export class PressBinding implements ElementBinding {
  constructor(private readonly action: PageAction) {}

  wireOn(wiring: BindingWiring): void {
    wiring.press(this.action);
  }
}

export class KeyBinding implements ElementBinding {
  constructor(
    private readonly keys: readonly string[],
    private readonly action: PageAction,
  ) {}

  wireOn(wiring: BindingWiring): void {
    wiring.keys(this.keys, this.action);
  }
}

export class ChangeBinding implements ElementBinding {
  constructor(private readonly field: TextChange) {}

  wireOn(wiring: BindingWiring): void {
    wiring.change(this.field);
  }
}

export class FollowBinding implements ElementBinding {
  constructor(private readonly action: PageAction) {}

  wireOn(wiring: BindingWiring): void {
    wiring.follow(this.action);
  }
}

export class HandleRequest implements ElementBinding {
  constructor(private readonly wanted: HandleWanted) {}

  wireOn(wiring: BindingWiring): void {
    wiring.handle(this.wanted);
  }
}
