import { Refusal } from "../../shape/refusal";

export function notJson(): Refusal {
  return new Refusal("The reply is not valid JSON.");
}

export function needsText(key: string): Refusal {
  return new Refusal(`The reply's "${key}" is missing or is not text.`);
}

export function needsObject(key: string): Refusal {
  return new Refusal(`The reply's "${key}" is missing or is not an object.`);
}

export function needsList(key: string): Refusal {
  return new Refusal(`The reply's "${key}" is missing or is not a list.`);
}

export function beyondSaidNo(): Refusal {
  return new Refusal("D&D Beyond says it could not give this character.");
}

export function noClass(): Refusal {
  return new Refusal("The reply lists no class for this character.");
}

export function abilityListedTwice(): Refusal {
  return new Refusal("The reply sets the same ability twice.");
}

export function noCharacterNumber(): Refusal {
  return new Refusal("The reply does not say which character it is.");
}
