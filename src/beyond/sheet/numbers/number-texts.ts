import { FeetNumberText } from "./feet-number-text";
import type { NumberText } from "./number-text";
import { SignedNumberText } from "./signed-number-text";
import { WholeNumberText } from "./whole-number-text";

export const WHOLE: NumberText = new WholeNumberText();
export const SIGNED: NumberText = new SignedNumberText();
export const FEET: NumberText = new FeetNumberText();
