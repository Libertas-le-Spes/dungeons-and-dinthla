import type { Section, Div, Span, Paragraph, Button, List, OrderedList, ListItem, Heading1, Heading2, Heading3, Bold, Strong, Details, Summary, Label, Anchor, Mark, Pre, Nav, Form, DescriptionList, Term, Description, Select } from "./kinds/containers";
import type { Option, TextArea, TextInput } from "./kinds/fields";

export interface MountPlace {
  readonly mountPlace: true;
}

export interface Mounter {
  section(element: Section, into: MountPlace): MountPlace;
  div(element: Div, into: MountPlace): MountPlace;
  span(element: Span, into: MountPlace): MountPlace;
  paragraph(element: Paragraph, into: MountPlace): MountPlace;
  button(element: Button, into: MountPlace): MountPlace;
  list(element: List, into: MountPlace): MountPlace;
  orderedList(element: OrderedList, into: MountPlace): MountPlace;
  listItem(element: ListItem, into: MountPlace): MountPlace;
  heading1(element: Heading1, into: MountPlace): MountPlace;
  heading2(element: Heading2, into: MountPlace): MountPlace;
  heading3(element: Heading3, into: MountPlace): MountPlace;
  bold(element: Bold, into: MountPlace): MountPlace;
  strong(element: Strong, into: MountPlace): MountPlace;
  details(element: Details, into: MountPlace): MountPlace;
  summary(element: Summary, into: MountPlace): MountPlace;
  label(element: Label, into: MountPlace): MountPlace;
  anchor(element: Anchor, into: MountPlace): MountPlace;
  mark(element: Mark, into: MountPlace): MountPlace;
  pre(element: Pre, into: MountPlace): MountPlace;
  nav(element: Nav, into: MountPlace): MountPlace;
  form(element: Form, into: MountPlace): MountPlace;
  descriptionList(element: DescriptionList, into: MountPlace): MountPlace;
  term(element: Term, into: MountPlace): MountPlace;
  description(element: Description, into: MountPlace): MountPlace;
  select(element: Select, into: MountPlace): MountPlace;
  textInput(element: TextInput, into: MountPlace): MountPlace;
  textArea(element: TextArea, into: MountPlace): MountPlace;
  option(element: Option, into: MountPlace): MountPlace;
}

