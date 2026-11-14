import { Refusal } from "../beyond/shape/refusal";
import { NOT_A_CHARACTER_LINK } from "./online-words";

const BARE_NUMBER = /^([1-9]\d{0,11})$/;
const CHARACTER_LINK = /^(?:https?:[/][/])?(?:www[.])?dndbeyond[.]com[/]characters[/]([1-9]\d{0,11})(?!\d)/i;
const FORMS = [BARE_NUMBER, CHARACTER_LINK];

function digitsOf(text: string, form: RegExp): string | null {
  const match = form.exec(text);
  if (match === null) return null;
  const [, digits] = match;
  if (digits === undefined) return null;
  return digits;
}

function firstDigitsIn(text: string): string | null {
  for (const form of FORMS) {
    const digits = digitsOf(text, form);
    if (digits !== null) return digits;
  }
  return null;
}

export class CharacterId {
  private constructor(private readonly digits: string) {}

  static of(link: string): CharacterId {
    const digits = firstDigitsIn(link.trim());
    if (digits === null) throw new Refusal(NOT_A_CHARACTER_LINK);
    return new CharacterId(digits);
  }

  appendedTo(address: string): string {
    return `${address}${this.digits}`;
  }

  isNumber(number: number): boolean {
    return Number(this.digits) === number;
  }
}
