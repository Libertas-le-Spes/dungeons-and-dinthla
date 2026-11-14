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

export function propertyNextToLoose(key: string): Refusal {
  return new Refusal(`${key} has a blank or comment line next to it in the note's properties, so nothing was written. Tidy those lines first.`);
}

export function propertiesUnreadable(key: string): Refusal {
  return new Refusal(`The note's properties couldn't be read as properties, so ${key} wasn't written. Fix them first.`);
}

export function propertyReadsDifferently(key: string): Refusal {
  return new Refusal(`The note's properties would read differently than only ${key}, so nothing was written.`);
}
