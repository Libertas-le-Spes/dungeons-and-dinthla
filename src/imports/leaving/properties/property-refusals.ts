import { Refusal } from "../../../beyond/shape/refusal";

export function propertyTwice(key: string): Refusal {
  return new Refusal(`The note has two ${key} properties, so nothing was written. Remove one.`);
}

export function propertyByCapitals(found: string, key: string): Refusal {
  return new Refusal(`The note has a property called ${found}, which only differs by capitals from ${key}. Rename or remove it first, so no second ${key} is written.`);
}

export function propertyChangedMore(key: string): Refusal {
  return new Refusal(`Changing ${key} would change more of the note than that property, so nothing was written.`);
}
