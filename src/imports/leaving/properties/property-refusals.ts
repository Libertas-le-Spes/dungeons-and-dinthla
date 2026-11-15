import { Refusal } from "../../../beyond/shape/refusal";

export function propertyTwice(key: string): Refusal {
  return new Refusal(`The note has two ${key} properties. Remove one.`);
}

export function propertyByCapitals(found: string, key: string): Refusal {
  return new Refusal(`The note has "${found}", which differs from "${key}" only by capitals. Rename or remove it.`);
}

export function propertyChangedMore(key: string): Refusal {
  return new Refusal(`Changing ${key} would change more than that property.`);
}

export function propertyNextToLoose(key: string): Refusal {
  return new Refusal(`${key} has a blank or comment line beside it. Tidy the properties.`);
}

export function propertiesUnreadable(key: string): Refusal {
  return new Refusal(`The properties couldn't be read, so ${key} wasn't written. Fix them.`);
}

export function propertyReadsDifferently(key: string): Refusal {
  return new Refusal(`Changing ${key} would change the other properties.`);
}
