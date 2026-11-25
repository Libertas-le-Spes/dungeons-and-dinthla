import type { BindingWiring, CaretWatcher, HandleWanted, TextChange } from "../../src/views/elements/bindings/binding-wiring";
import { HERE } from "../../src/views/elements/bindings/open-place";
import type { PageAction } from "../../src/views/elements/bindings/page-action";
import type { ElementHandle } from "../../src/views/elements/element-handle";
import type { ElementParts } from "../../src/views/elements/element-parts";
import type { Mounter, MountPlace } from "../../src/views/elements/mounter";
import type { ViewElement } from "../../src/views/elements/view-element";
import type { Anchor, Bold, Button, Description, DescriptionList, Details, Div, FieldRow, Heading1, Heading2, Heading3, Label, List, ListItem, Mark, NameLink, Nav, OrderedList, Paragraph, PlainText, Pre, Section, Select, Span, Strong, Summary, Term } from "../../src/views/elements/kinds/containers";
import type { DateInput, FileInput, Option, SearchInput, Switch, TextArea, TextInput } from "../../src/views/elements/kinds/fields";

export class Recorded implements MountPlace, ElementHandle {
  readonly mountPlace = true;
  children: Recorded[] = [];
  text = "";
  value = "";
  hidden = false;
  disabled = false;
  readOnly = false;
  open = false;
  selected = false;
  focused = false;
  label: string | undefined;
  readonly classes = new Set<string>();
  readonly presses: PageAction[] = [];
  readonly changes: TextChange[] = [];
  readonly enters: PageAction[] = [];

  constructor(
    readonly kind: string,
    readonly parts: ElementParts,
  ) {
    if (parts.text !== undefined) this.text = parts.text;
    if (parts.hidden === true) this.hidden = true;
    this.label = parts.label;
    if (parts.cls !== undefined) for (const cls of parts.cls) this.classes.add(cls);
  }

  textContent(): string {
    let text = this.text;
    for (const child of this.children) text += child.textContent();
    return text;
  }

  all(): Recorded[] {
    const found: Recorded[] = [this];
    for (const child of this.children) found.push(...child.all());
    return found;
  }

  find(kind: string, text: string): Recorded {
    for (const each of this.all()) {
      if (each.kind === kind && each.textContent() === text) return each;
    }
    throw new Error(`No ${kind} reads "${text}".`);
  }

  first(kind: string): Recorded {
    for (const each of this.all()) {
      if (each.kind === kind) return each;
    }
    throw new Error(`No ${kind} is shown.`);
  }

  labelled(label: string): Recorded {
    for (const each of this.all()) {
      if (each.label === label) return each;
    }
    throw new Error(`Nothing is labelled ${label}.`);
  }

  withClass(cls: string): Recorded[] {
    const found: Recorded[] = [];
    for (const each of this.all()) {
      if (each.classes.has(cls)) found.push(each);
    }
    return found;
  }

  press(): void {
    for (const action of this.presses) action.run(HERE);
  }

  type(value: string): void {
    this.value = value;
    for (const change of this.changes) change.changed(value);
  }

  pressEnter(): void {
    for (const action of this.enters) action.run(HERE);
  }

  focus(): void {
    this.focused = true;
  }

  setHidden(hidden: boolean): void {
    this.hidden = hidden;
  }

  setOpen(open: boolean): void {
    this.open = open;
  }

  setSelected(selected: boolean): void {
    this.selected = selected;
  }

  setLabel(label: string): void {
    this.label = label;
  }

  setText(text: string): void {
    this.text = text;
    this.children = [];
  }

  setClassOn(name: string, on: boolean): void {
    if (on) this.classes.add(name);
    else this.classes.delete(name);
  }

  setValue(value: string): void {
    this.value = value;
  }

  setTabIndex(): void {}

  setDisabled(disabled: boolean): void {
    this.disabled = disabled;
  }

  setReadOnly(readOnly: boolean): void {
    this.readOnly = readOnly;
  }

  placeCaret(): void {}

  bringIntoView(): void {}

  showInside(trees: readonly ViewElement[]): void {
    this.children = [];
    const mounter = new RecordedMounter();
    for (const tree of trees) tree.mountOn(mounter, this);
  }

  isShown(): boolean {
    return !this.hidden;
  }
}

class RecordedWiring implements BindingWiring {
  constructor(private readonly element: Recorded) {}

  press(action: PageAction): void {
    this.element.presses.push(action);
  }

  keys(): void {}

  enter(_needsModifier: boolean, action: PageAction): void {
    this.element.enters.push(action);
  }

  change(field: TextChange): void {
    this.element.changes.push(field);
  }

  handle(wanted: HandleWanted): void {
    wanted.received(this.element);
  }

  follow(action: PageAction): void {
    this.element.presses.push(action);
  }

  suggest(): void {}

  caret(_watcher: CaretWatcher): void {}

  holdFocus(): void {}
}

function placeOf(into: MountPlace): Recorded {
  return into as Recorded;
}

export class RecordedMounter implements Mounter {
  section(element: Section, into: MountPlace): MountPlace {
    return this.add("section", element.parts, into);
  }

  div(element: Div, into: MountPlace): MountPlace {
    return this.add("div", element.parts, into);
  }

  span(element: Span, into: MountPlace): MountPlace {
    return this.add("span", element.parts, into);
  }

  paragraph(element: Paragraph, into: MountPlace): MountPlace {
    return this.add("p", element.parts, into);
  }

  button(element: Button, into: MountPlace): MountPlace {
    return this.add("button", element.parts, into);
  }

  list(element: List, into: MountPlace): MountPlace {
    return this.add("ul", element.parts, into);
  }

  orderedList(element: OrderedList, into: MountPlace): MountPlace {
    return this.add("ol", element.parts, into);
  }

  listItem(element: ListItem, into: MountPlace): MountPlace {
    return this.add("li", element.parts, into);
  }

  heading1(element: Heading1, into: MountPlace): MountPlace {
    return this.add("h1", element.parts, into);
  }

  heading2(element: Heading2, into: MountPlace): MountPlace {
    return this.add("h2", element.parts, into);
  }

  heading3(element: Heading3, into: MountPlace): MountPlace {
    return this.add("h3", element.parts, into);
  }

  bold(element: Bold, into: MountPlace): MountPlace {
    return this.add("b", element.parts, into);
  }

  strong(element: Strong, into: MountPlace): MountPlace {
    return this.add("strong", element.parts, into);
  }

  details(element: Details, into: MountPlace): MountPlace {
    return this.add("details", element.parts, into);
  }

  summary(element: Summary, into: MountPlace): MountPlace {
    return this.add("summary", element.parts, into);
  }

  label(element: Label, into: MountPlace): MountPlace {
    return this.add("label", element.parts, into);
  }

  anchor(element: Anchor, into: MountPlace): MountPlace {
    return this.add("a", element.parts, into);
  }

  mark(element: Mark, into: MountPlace): MountPlace {
    return this.add("mark", element.parts, into);
  }

  pre(element: Pre, into: MountPlace): MountPlace {
    return this.add("pre", element.parts, into);
  }

  nav(element: Nav, into: MountPlace): MountPlace {
    return this.add("nav", element.parts, into);
  }

  descriptionList(element: DescriptionList, into: MountPlace): MountPlace {
    return this.add("dl", element.parts, into);
  }

  term(element: Term, into: MountPlace): MountPlace {
    return this.add("dt", element.parts, into);
  }

  description(element: Description, into: MountPlace): MountPlace {
    return this.add("dd", element.parts, into);
  }

  select(element: Select, into: MountPlace): MountPlace {
    return this.add("select", element.parts, into);
  }

  nameLink(element: NameLink, into: MountPlace): MountPlace {
    return this.add("a", element.parts, into);
  }

  textInput(element: TextInput, into: MountPlace): MountPlace {
    return this.field("input", element.parts, into);
  }

  searchInput(element: SearchInput, into: MountPlace): MountPlace {
    return this.field("input", element.parts, into);
  }

  dateInput(element: DateInput, into: MountPlace): MountPlace {
    return this.field("input", element.parts, into);
  }

  textArea(element: TextArea, into: MountPlace): MountPlace {
    return this.field("textarea", element.parts, into);
  }

  plainText(element: PlainText, into: MountPlace): void {
    const text = new Recorded("text", {});
    text.text = element.text;
    placeOf(into).children.push(text);
  }

  option(element: Option, into: MountPlace): MountPlace {
    const option = this.add("option", element.parts, into);
    option.value = element.value;
    if (element.chosen) placeOf(into).value = element.value;
    return option;
  }

  fieldRow(element: FieldRow, into: MountPlace): MountPlace {
    const row = this.add("field-row", element.parts, into);
    const name = new Recorded("field-name", {});
    name.text = element.name;
    row.children.push(name);
    const description = this.add("field-description", element.descriptionParts, row);
    if (element.description !== null) description.text = element.description;
    return this.add("field-control", {}, row);
  }

  toggleSwitch(element: Switch, into: MountPlace): MountPlace {
    return this.add("switch", element.parts, into);
  }

  fileInput(element: FileInput, into: MountPlace): MountPlace {
    return this.add("file", element.parts, into);
  }

  private field(kind: string, parts: ElementParts & { value?: string }, into: MountPlace): Recorded {
    const field = this.add(kind, parts, into);
    if (parts.value !== undefined) field.value = parts.value;
    return field;
  }

  private add(kind: string, parts: ElementParts, into: MountPlace): Recorded {
    const element = new Recorded(kind, parts);
    placeOf(into).children.push(element);
    const wiring = new RecordedWiring(element);
    if (parts.bindings !== undefined) for (const binding of parts.bindings) binding.wireOn(wiring);
    return element;
  }
}
