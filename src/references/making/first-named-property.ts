import type { ChangeProperties } from "../../fence/gate/fenced-file-actions";

export const FIRST_NAMED = "first named";

export function firstNamedIn(sessionLink: string): ChangeProperties {
  return (properties) => {
    properties[FIRST_NAMED] = sessionLink;
  };
}
