const FIELD_TAGS = ["INPUT", "TEXTAREA", "SELECT"];
const INPUT_TAG = "INPUT";

export function isField(el: HTMLElement): el is HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement {
  return FIELD_TAGS.includes(el.tagName);
}

export function isInput(el: HTMLElement): el is HTMLInputElement {
  return el.tagName === INPUT_TAG;
}
