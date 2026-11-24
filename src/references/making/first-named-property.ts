import type { ChangeProperties } from "../../host/notes/note-keeping";

export function firstNamedIn(sessionLink: string): ChangeProperties {
  return (properties) => {
    properties["first named"] = sessionLink;
  };
}
