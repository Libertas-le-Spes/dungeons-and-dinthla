import { ToggleComponent } from "obsidian";
import type { Anchor, Bold, Button, Description, DescriptionList, Details, Div, Form, Heading1, Heading2, Heading3, Label, List, ListItem, Mark, PlainText, Nav, OrderedList, Paragraph, Pre, Section, Select, Span, Strong, Summary, Term, NameLink, FieldRow } from "../../../views/elements/kinds/containers";
import type { DateInput, FileInput, Option, Switch, TextArea, TextInput } from "../../../views/elements/kinds/fields";
import { FilePick } from "./file-pick";
import type { Mounter, MountPlace } from "../../../views/elements/mounter";
import { partsOn } from "./element-parts-on";
import type { MountKit } from "./mount-kit";
import { ElementPlace, elementOf } from "./element-place";

function placed(el: HTMLElement): MountPlace {
  return new ElementPlace(el);
}

export class ObsidianMounter implements Mounter {
  constructor(private readonly kit: MountKit) {}

  section(element: Section, into: MountPlace): MountPlace {
    return placed(partsOn(elementOf(into).createEl("section"), element.parts, this.kit));
  }

  div(element: Div, into: MountPlace): MountPlace {
    return placed(partsOn(elementOf(into).createDiv(), element.parts, this.kit));
  }

  span(element: Span, into: MountPlace): MountPlace {
    return placed(partsOn(elementOf(into).createSpan(), element.parts, this.kit));
  }

  paragraph(element: Paragraph, into: MountPlace): MountPlace {
    return placed(partsOn(elementOf(into).createEl("p"), element.parts, this.kit));
  }

  button(element: Button, into: MountPlace): MountPlace {
    return placed(partsOn(elementOf(into).createEl("button"), element.parts, this.kit));
  }

  list(element: List, into: MountPlace): MountPlace {
    return placed(partsOn(elementOf(into).createEl("ul"), element.parts, this.kit));
  }

  orderedList(element: OrderedList, into: MountPlace): MountPlace {
    return placed(partsOn(elementOf(into).createEl("ol"), element.parts, this.kit));
  }

  listItem(element: ListItem, into: MountPlace): MountPlace {
    return placed(partsOn(elementOf(into).createEl("li"), element.parts, this.kit));
  }

  heading1(element: Heading1, into: MountPlace): MountPlace {
    return placed(partsOn(elementOf(into).createEl("h1"), element.parts, this.kit));
  }

  heading2(element: Heading2, into: MountPlace): MountPlace {
    return placed(partsOn(elementOf(into).createEl("h2"), element.parts, this.kit));
  }

  heading3(element: Heading3, into: MountPlace): MountPlace {
    return placed(partsOn(elementOf(into).createEl("h3"), element.parts, this.kit));
  }

  bold(element: Bold, into: MountPlace): MountPlace {
    return placed(partsOn(elementOf(into).createEl("b"), element.parts, this.kit));
  }

  strong(element: Strong, into: MountPlace): MountPlace {
    return placed(partsOn(elementOf(into).createEl("strong"), element.parts, this.kit));
  }

  details(element: Details, into: MountPlace): MountPlace {
    return placed(partsOn(elementOf(into).createEl("details"), element.parts, this.kit));
  }

  summary(element: Summary, into: MountPlace): MountPlace {
    return placed(partsOn(elementOf(into).createEl("summary"), element.parts, this.kit));
  }

  label(element: Label, into: MountPlace): MountPlace {
    return placed(partsOn(elementOf(into).createEl("label"), element.parts, this.kit));
  }

  anchor(element: Anchor, into: MountPlace): MountPlace {
    return placed(partsOn(elementOf(into).createEl("a", { href: "#" }), element.parts, this.kit));
  }

  plainText(element: PlainText, into: MountPlace): void {
    elementOf(into).appendText(element.text);
  }

  mark(element: Mark, into: MountPlace): MountPlace {
    return placed(partsOn(elementOf(into).createEl("mark"), element.parts, this.kit));
  }

  pre(element: Pre, into: MountPlace): MountPlace {
    return placed(partsOn(elementOf(into).createEl("pre"), element.parts, this.kit));
  }

  nav(element: Nav, into: MountPlace): MountPlace {
    return placed(partsOn(elementOf(into).createEl("nav"), element.parts, this.kit));
  }

  form(element: Form, into: MountPlace): MountPlace {
    return placed(partsOn(elementOf(into).createEl("form"), element.parts, this.kit));
  }

  descriptionList(element: DescriptionList, into: MountPlace): MountPlace {
    return placed(partsOn(elementOf(into).createEl("dl"), element.parts, this.kit));
  }

  term(element: Term, into: MountPlace): MountPlace {
    return placed(partsOn(elementOf(into).createEl("dt"), element.parts, this.kit));
  }

  description(element: Description, into: MountPlace): MountPlace {
    return placed(partsOn(elementOf(into).createEl("dd"), element.parts, this.kit));
  }

  select(element: Select, into: MountPlace): MountPlace {
    return placed(partsOn(elementOf(into).createEl("select"), element.parts, this.kit));
  }

  textInput(element: TextInput, into: MountPlace): MountPlace {
    const input = elementOf(into).createEl("input", { type: "text" });
    if (element.parts.value !== undefined) input.value = element.parts.value;
    if (element.parts.placeholder !== undefined) input.placeholder = element.parts.placeholder;
    if (element.parts.spellcheck !== undefined) input.spellcheck = element.parts.spellcheck;
    return placed(partsOn(input, element.parts, this.kit));
  }

  dateInput(element: DateInput, into: MountPlace): MountPlace {
    const input = elementOf(into).createEl("input", { type: "date" });
    if (element.parts.value !== undefined) input.value = element.parts.value;
    return placed(partsOn(input, element.parts, this.kit));
  }

  textArea(element: TextArea, into: MountPlace): MountPlace {
    const area = elementOf(into).createEl("textarea");
    if (element.rows !== null) area.setAttr("rows", String(element.rows));
    if (element.parts.value !== undefined) area.value = element.parts.value;
    if (element.parts.placeholder !== undefined) area.placeholder = element.parts.placeholder;
    if (element.parts.spellcheck !== undefined) area.spellcheck = element.parts.spellcheck;
    return placed(partsOn(area, element.parts, this.kit));
  }

  nameLink(element: NameLink, into: MountPlace): MountPlace {
    return placed(partsOn(elementOf(into).createEl("a"), element.parts, this.kit));
  }

  fieldRow(element: FieldRow, into: MountPlace): MountPlace {
    const row = partsOn(elementOf(into).createDiv({ cls: "setting-item" }), element.parts, this.kit);
    const info = row.createDiv({ cls: "setting-item-info" });
    info.createDiv({ cls: "setting-item-name", text: element.name });
    const description = partsOn(info.createDiv({ cls: "setting-item-description" }), element.descriptionParts, this.kit);
    if (element.description !== null) description.setText(element.description);
    return placed(row.createDiv({ cls: "setting-item-control" }));
  }

  option(element: Option, into: MountPlace): MountPlace {
    const option = elementOf(into).createEl("option");
    option.value = element.value;
    option.selected = element.chosen;
    return placed(partsOn(option, element.parts, this.kit));
  }

  toggleSwitch(element: Switch, into: MountPlace): MountPlace {
    const toggle = new ToggleComponent(elementOf(into));
    toggle.setValue(element.on);
    toggle.onChange(element.field.flipped.bind(element.field));
    return placed(partsOn(toggle.toggleEl, element.parts, this.kit));
  }

  fileInput(element: FileInput, into: MountPlace): MountPlace {
    const input = elementOf(into).createEl("input", { type: "file" });
    new FilePick(input, element.field).listen();
    return placed(partsOn(input, element.parts, this.kit));
  }
}
