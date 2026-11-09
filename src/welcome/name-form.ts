import { Notice, type Component } from "obsidian";
import { messageOf } from "../views/message-of";

export interface NameForm {
  label: string;
  buttonText: string;
  buttonCls: string;
  failed: string;
  make(name: string): Promise<void>;
}

async function makeWhileDisabled(form: NameForm, name: string, button: HTMLButtonElement): Promise<void> {
  button.disabled = true;
  try {
    await form.make(name);
  } finally {
    button.disabled = false;
  }
}

export function addNameForm(owner: Component, parentEl: HTMLElement, form: NameForm): void {
  const formEl = parentEl.createEl("form", { cls: "dd-welcome-make" });
  const name = formEl.createEl("input", { type: "text", placeholder: form.label, attr: { "aria-label": form.label } });
  const button = formEl.createEl("button", { cls: form.buttonCls, type: "submit", text: form.buttonText });
  owner.registerDomEvent(formEl, "submit", (event) => {
    event.preventDefault();
    makeWhileDisabled(form, name.value, button).catch((error: unknown) => new Notice(`${form.failed}: ${messageOf(error)}`));
  });
}
