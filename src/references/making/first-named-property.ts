import type { ChangeProperties } from "../../fence/gate/fenced-file-actions";

export function firstNamedIn(sessionLink: string): ChangeProperties {
  return (properties) => {
    properties["first named"] = sessionLink;
  };
}
