import { Keymap } from "obsidian";
import type { BindingWiring, HandleWanted, TextChange } from "../../../views/elements/bindings/binding-wiring";
import { HERE, NEW_TAB, type OpenPlace } from "../../../views/elements/bindings/open-place";
import type { PageAction } from "../../../views/elements/bindings/page-action";
import { ObsidianHandle } from "./obsidian-handle";

function placeOf(event: MouseEvent | KeyboardEvent): OpenPlace {
  if (Keymap.isModEvent(event)) return NEW_TAB;
  return HERE;
}

class Press {
  constructor(private readonly action: PageAction) {}

  clicked(event: MouseEvent): void {
    this.action.run(placeOf(event));
  }
}

class Keys {
  constructor(
    private readonly keys: readonly string[],
    private readonly action: PageAction,
  ) {}

  pressed(event: KeyboardEvent): void {
    if (event.eventPhase !== event.AT_TARGET || !this.keys.includes(event.key)) return;
    event.preventDefault();
    this.action.run(placeOf(event));
  }
}

class Change {
  constructor(
    private readonly el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
    private readonly field: TextChange,
  ) {}

  changed(): void {
    this.field.changed(this.el.value);
  }
}

const FIELD_TAGS = ["INPUT", "TEXTAREA", "SELECT"];

const MIDDLE_BUTTON = 1;
const FOLLOWING_KEYS = ["Enter", " "];

class Follow {
  constructor(private readonly action: PageAction) {}

  clicked(event: MouseEvent): void {
    this.follow(event);
  }

  middleClicked(event: MouseEvent): void {
    if (event.button === MIDDLE_BUTTON) this.follow(event);
  }

  pressed(event: KeyboardEvent): void {
    if (FOLLOWING_KEYS.includes(event.key)) this.follow(event);
  }

  dragged(event: DragEvent): void {
    event.preventDefault();
  }

  private follow(event: MouseEvent | KeyboardEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.action.run(placeOf(event));
  }
}

function isField(el: HTMLElement): el is HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement {
  return FIELD_TAGS.includes(el.tagName);
}

export class ObsidianWiring implements BindingWiring {
  constructor(private readonly el: HTMLElement) {}

  press(action: PageAction): void {
    const press = new Press(action);
    this.el.addEventListener("click", press.clicked.bind(press));
  }

  keys(keys: readonly string[], action: PageAction): void {
    const listener = new Keys(keys, action);
    this.el.addEventListener("keydown", listener.pressed.bind(listener));
  }

  change(field: TextChange): void {
    if (!isField(this.el)) return;
    const change = new Change(this.el, field);
    this.el.addEventListener("input", change.changed.bind(change));
    this.el.addEventListener("change", change.changed.bind(change));
  }

  follow(action: PageAction): void {
    const follow = new Follow(action);
    this.el.addEventListener("click", follow.clicked.bind(follow));
    this.el.addEventListener("auxclick", follow.middleClicked.bind(follow));
    this.el.addEventListener("keydown", follow.pressed.bind(follow));
    this.el.addEventListener("dragstart", follow.dragged.bind(follow));
  }

  handle(wanted: HandleWanted): void {
    wanted.received(new ObsidianHandle(this.el));
  }
}
