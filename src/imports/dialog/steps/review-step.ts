import { CHOOSE_ANOTHER, CLOSE_BUTTON } from "../import-words";
import { problemLinesOf, summaryLinesOf } from "../review/sheet-summary";
import type { Review, ReviewActions } from "./review";
import { PlainButton } from "../../../views/components/dialogs/dialog-buttons";
import { PressBinding } from "../../../views/elements/bindings/bindings";
import { RunAction } from "../../../views/elements/bindings/run-action";
import { Button, Div, Heading3, List, ListItem, Paragraph } from "../../../views/elements/kinds/containers";
import type { ViewElement } from "../../../views/elements/view-element";

function summaryTree(review: Review): ViewElement {
  const inside: ViewElement[] = [new Heading3({ text: review.sheet.character.name.text })];
  for (const line of summaryLinesOf(review.sheet)) inside.push(new Paragraph({ text: line }));
  const problems = problemLinesOf(review.sheet);
  if (problems.length > 0) inside.push(new List({ cls: ["dd-import-problems"] }, problems.map((problem) => new ListItem({ text: problem }))));
  return new Div({ cls: ["dd-import-summary"] }, inside);
}

function canWrite(review: Review): boolean {
  if (review.refusal !== null) return false;
  return review.target.hasWork(review.changes);
}

function failureTrees(review: Review): ViewElement[] {
  if (review.failure === null) return [];
  return [new Paragraph({ cls: ["dd-import-refusal", "dd-import-failure"], text: review.failure, role: "alert" })];
}

function whatChangesTrees(review: Review): ViewElement[] {
  if (review.refusal !== null) return [new Paragraph({ cls: ["dd-import-refusal"], text: review.refusal, role: "alert" })];
  return review.target.planOf(review.changes);
}

function firstButton(review: Review, actions: ReviewActions): ViewElement {
  if (!canWrite(review)) return new PlainButton(CLOSE_BUTTON, new RunAction(actions.closeChosen.bind(actions))).build();
  return new Button({ cls: ["mod-cta", "dd-import-write"], text: review.target.buttonWords, bindings: [new PressBinding(new RunAction(actions.writeChosen.bind(actions)))] });
}

export function reviewTrees(review: Review, actions: ReviewActions): ViewElement[] {
  const body = [summaryTree(review), ...failureTrees(review), ...whatChangesTrees(review)];
  const buttons = [firstButton(review, actions), new PlainButton(CHOOSE_ANOTHER, new RunAction(actions.chooseAnother.bind(actions))).build()];
  return [new Div({ cls: ["dd-import-body"] }, body), new Div({ cls: ["modal-button-container", "dd-import-footer"] }, buttons)];
}
