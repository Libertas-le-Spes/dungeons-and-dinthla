import { Keymap } from "obsidian";
import type { BindingWiring, CaretWatcher, HandleWanted, PressedKey, TextChange } from "../../../views/elements/bindings/binding-wiring";
import { HERE, NEW_TAB, type OpenPlace } from "../../../views/elements/bindings/open-place";
import type { PageAction } from "../../../views/elements/bindings/page-action";
import { isSubmit } from "../../../views/dialogs/keys";
import { isField, isInput, isTyped } from "./field-element";
import type { MountKit } from "./mount-kit";
import { ObsidianHandle } from "./obsidian-handle";

function placeOf(event: MouseEvent | KeyboardEvent): OpenPlace {
  if (Keymap.isModEvent(event)) return NEW_TAB;
  return HERE;
}

class Press {
  constructor(private readonly action: PageAction) {}

  clicked(event: MouseEvent): void {
    event.preventDefault();
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

class Enter {
  constructor(
    private readonly needsModifier: boolean,
    private readonly action: PageAction,
  ) {}

  pressed(event: KeyboardEvent): void {
    if (event.defaultPrevented || !isSubmit(event, this.needsModifier)) return;
    event.preventDefault();
    this.action.run(HERE);
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

class KeyDown implements PressedKey {
  readonly key: string;
  readonly modified: boolean;

  constructor(private readonly event: KeyboardEvent) {
    this.key = event.key;
    this.modified = event.ctrlKey || event.metaKey || event.altKey || event.shiftKey;
  }

  handled(): void {
    this.event.preventDefault();
  }

  keptHere(): void {
    this.event.preventDefault();
    this.event.stopPropagation();
  }
}

class Caret {
  constructor(
    private readonly el: HTMLInputElement | HTMLTextAreaElement,
    private readonly watcher: CaretWatcher,
  ) {}

  keyDown(event: KeyboardEvent): void {
    this.watcher.keyDown(new KeyDown(event));
  }

  typed(): void {
    this.watcher.typed(this.el.value, this.caret());
  }

  moved(): void {
    this.watcher.caretMoved(this.caret());
  }

  left(): void {
    this.watcher.left();
  }

  private caret(): number {
    const at = this.el.selectionStart;
    if (at === null) return this.el.value.length;
    return at;
  }
}

function holdFocus(event: MouseEvent): void {
  event.preventDefault();
}

export class ObsidianWiring implements BindingWiring {
  constructor(
    private readonly el: HTMLElement,
    private readonly kit: MountKit,
  ) {}

  press(action: PageAction): void {
    const press = new Press(action);
    this.el.addEventListener("click", press.clicked.bind(press));
  }

  keys(keys: readonly string[], action: PageAction): void {
    const listener = new Keys(keys, action);
    this.el.addEventListener("keydown", listener.pressed.bind(listener));
  }

  enter(needsModifier: boolean, action: PageAction): void {
    const enter = new Enter(needsModifier, action);
    this.el.addEventListener("keydown", enter.pressed.bind(enter));
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

  suggest(names: readonly string[]): void {
    if (isInput(this.el)) this.kit.suggestNames(this.el, names);
  }

  caret(watcher: CaretWatcher): void {
    const box = this.el;
    if (!isTyped(box)) return;
    const caret = new Caret(box, watcher);
    this.el.addEventListener("keydown", caret.keyDown.bind(caret));
    this.el.addEventListener("input", caret.typed.bind(caret));
    this.el.addEventListener("click", caret.moved.bind(caret));
    this.el.addEventListener("keyup", caret.moved.bind(caret));
    this.el.addEventListener("blur", caret.left.bind(caret));
  }

  holdFocus(): void {
    this.el.addEventListener("mousedown", holdFocus);
  }

  handle(wanted: HandleWanted): void {
    wanted.received(new ObsidianHandle(this.el, this.kit));
  }
}
