const FIELD_TAGS = ["INPUT", "TEXTAREA", "SELECT"];
const INPUT_TAG = "INPUT";
const TYPED_TAGS = ["INPUT", "TEXTAREA"];
const BUTTON_TAG = "BUTTON";

export function isField(el: HTMLElement): el is HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement {
  return FIELD_TAGS.includes(el.tagName);
}

export function isButton(el: HTMLElement): el is HTMLButtonElement {
  return el.tagName === BUTTON_TAG;
}

export function isInput(el: HTMLElement): el is HTMLInputElement {
  return el.tagName === INPUT_TAG;
}

export function isTyped(el: HTMLElement): el is HTMLInputElement | HTMLTextAreaElement {
  return TYPED_TAGS.includes(el.tagName);
}
