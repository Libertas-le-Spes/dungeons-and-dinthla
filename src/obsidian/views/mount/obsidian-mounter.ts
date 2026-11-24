import type { Anchor, Bold, Button, Description, DescriptionList, Details, Div, Form, Heading1, Heading2, Heading3, Label, List, ListItem, Mark, Nav, OrderedList, Paragraph, Pre, Section, Select, Span, Strong, Summary, Term, NameLink, FieldRow } from "../../../views/elements/kinds/containers";
import type { Option, TextArea, TextInput } from "../../../views/elements/kinds/fields";
import type { Mounter, MountPlace } from "../../../views/elements/mounter";
import { partsOn } from "./element-parts-on";
import { ElementPlace, elementOf } from "./element-place";

function placed(el: HTMLElement): MountPlace {
  return new ElementPlace(el);
}

export class ObsidianMounter implements Mounter {
  section(element: Section, into: MountPlace): MountPlace {
    return placed(partsOn(elementOf(into).createEl("section"), element.parts));
  }

  div(element: Div, into: MountPlace): MountPlace {
    return placed(partsOn(elementOf(into).createDiv(), element.parts));
  }

  span(element: Span, into: MountPlace): MountPlace {
    return placed(partsOn(elementOf(into).createSpan(), element.parts));
  }

  paragraph(element: Paragraph, into: MountPlace): MountPlace {
    return placed(partsOn(elementOf(into).createEl("p"), element.parts));
  }

  button(element: Button, into: MountPlace): MountPlace {
    return placed(partsOn(elementOf(into).createEl("button"), element.parts));
  }

  list(element: List, into: MountPlace): MountPlace {
    return placed(partsOn(elementOf(into).createEl("ul"), element.parts));
  }

  orderedList(element: OrderedList, into: MountPlace): MountPlace {
    return placed(partsOn(elementOf(into).createEl("ol"), element.parts));
  }

  listItem(element: ListItem, into: MountPlace): MountPlace {
    return placed(partsOn(elementOf(into).createEl("li"), element.parts));
  }

  heading1(element: Heading1, into: MountPlace): MountPlace {
    return placed(partsOn(elementOf(into).createEl("h1"), element.parts));
  }

  heading2(element: Heading2, into: MountPlace): MountPlace {
    return placed(partsOn(elementOf(into).createEl("h2"), element.parts));
  }

  heading3(element: Heading3, into: MountPlace): MountPlace {
    return placed(partsOn(elementOf(into).createEl("h3"), element.parts));
  }

  bold(element: Bold, into: MountPlace): MountPlace {
    return placed(partsOn(elementOf(into).createEl("b"), element.parts));
  }

  strong(element: Strong, into: MountPlace): MountPlace {
    return placed(partsOn(elementOf(into).createEl("strong"), element.parts));
  }

  details(element: Details, into: MountPlace): MountPlace {
    return placed(partsOn(elementOf(into).createEl("details"), element.parts));
  }

  summary(element: Summary, into: MountPlace): MountPlace {
    return placed(partsOn(elementOf(into).createEl("summary"), element.parts));
  }

  label(element: Label, into: MountPlace): MountPlace {
    return placed(partsOn(elementOf(into).createEl("label"), element.parts));
  }

  anchor(element: Anchor, into: MountPlace): MountPlace {
    return placed(partsOn(elementOf(into).createEl("a", { href: "#" }), element.parts));
  }

  mark(element: Mark, into: MountPlace): MountPlace {
    return placed(partsOn(elementOf(into).createEl("mark"), element.parts));
  }

  pre(element: Pre, into: MountPlace): MountPlace {
    return placed(partsOn(elementOf(into).createEl("pre"), element.parts));
  }

  nav(element: Nav, into: MountPlace): MountPlace {
    return placed(partsOn(elementOf(into).createEl("nav"), element.parts));
  }

  form(element: Form, into: MountPlace): MountPlace {
    return placed(partsOn(elementOf(into).createEl("form"), element.parts));
  }

  descriptionList(element: DescriptionList, into: MountPlace): MountPlace {
    return placed(partsOn(elementOf(into).createEl("dl"), element.parts));
  }

  term(element: Term, into: MountPlace): MountPlace {
    return placed(partsOn(elementOf(into).createEl("dt"), element.parts));
  }

  description(element: Description, into: MountPlace): MountPlace {
    return placed(partsOn(elementOf(into).createEl("dd"), element.parts));
  }

  select(element: Select, into: MountPlace): MountPlace {
    return placed(partsOn(elementOf(into).createEl("select"), element.parts));
  }

  textInput(element: TextInput, into: MountPlace): MountPlace {
    const input = elementOf(into).createEl("input", { type: "text" });
    if (element.parts.value !== undefined) input.value = element.parts.value;
    if (element.parts.placeholder !== undefined) input.placeholder = element.parts.placeholder;
    if (element.parts.spellcheck !== undefined) input.spellcheck = element.parts.spellcheck;
    return placed(partsOn(input, element.parts));
  }

  textArea(element: TextArea, into: MountPlace): MountPlace {
    const area = elementOf(into).createEl("textarea");
    if (element.rows !== null) area.setAttr("rows", String(element.rows));
    if (element.parts.value !== undefined) area.value = element.parts.value;
    if (element.parts.placeholder !== undefined) area.placeholder = element.parts.placeholder;
    if (element.parts.spellcheck !== undefined) area.spellcheck = element.parts.spellcheck;
    return placed(partsOn(area, element.parts));
  }

  nameLink(element: NameLink, into: MountPlace): MountPlace {
    return placed(partsOn(elementOf(into).createEl("a"), element.parts));
  }

  fieldRow(element: FieldRow, into: MountPlace): MountPlace {
    const row = partsOn(elementOf(into).createDiv({ cls: "setting-item" }), element.parts);
    const info = row.createDiv({ cls: "setting-item-info" });
    info.createDiv({ cls: "setting-item-name", text: element.name });
    const description = info.createDiv({ cls: "setting-item-description" });
    if (element.description !== null) description.setText(element.description);
    return placed(row.createDiv({ cls: "setting-item-control" }));
  }

  option(element: Option, into: MountPlace): MountPlace {
    const option = elementOf(into).createEl("option");
    option.value = element.value;
    return placed(partsOn(option, element.parts));
  }
}
