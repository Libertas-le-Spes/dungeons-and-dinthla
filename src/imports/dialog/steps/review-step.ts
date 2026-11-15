import { ButtonComponent } from "obsidian";
import { CHOOSE_ANOTHER, CLOSE_BUTTON } from "../import-words";
import { problemLinesOf, summaryLinesOf } from "../review/sheet-summary";
import type { Review, ReviewActions } from "./review";

function drawSummary(parent: HTMLElement, review: Review): void {
  const summary = parent.createDiv({ cls: "dd-import-summary" });
  summary.createEl("h3", { text: review.sheet.character.name.text });
  for (const line of summaryLinesOf(review.sheet)) summary.createEl("p", { text: line });
  const problems = problemLinesOf(review.sheet);
  if (problems.length === 0) return;
  const list = summary.createEl("ul", { cls: "dd-import-problems" });
  for (const problem of problems) list.createEl("li", { text: problem });
}

function canWrite(review: Review): boolean {
  if (review.refusal !== null) return false;
  return review.target.hasWork(review.changes);
}

function drawFailure(parent: HTMLElement, review: Review): void {
  if (review.failure === null) return;
  parent.createEl("p", { cls: "dd-import-refusal dd-import-failure", text: review.failure, attr: { role: "alert" } });
}

function drawWhatChanges(parent: HTMLElement, review: Review): void {
  if (review.refusal !== null) {
    parent.createEl("p", { cls: "dd-import-refusal", text: review.refusal, attr: { role: "alert" } });
    return;
  }
  review.target.drawPlan(parent, review.changes);
}

function drawButtons(parent: HTMLElement, review: Review, actions: ReviewActions): void {
  const row = parent.createDiv({ cls: ["modal-button-container", "dd-import-footer"] });
  if (canWrite(review)) {
    const write = new ButtonComponent(row).setButtonText(review.target.buttonWords).setCta().onClick(actions.writeChosen.bind(actions));
    write.buttonEl.addClass("dd-import-write");
  } else {
    new ButtonComponent(row).setButtonText(CLOSE_BUTTON).onClick(actions.closeChosen.bind(actions));
  }
  new ButtonComponent(row).setButtonText(CHOOSE_ANOTHER).onClick(actions.chooseAnother.bind(actions));
}

export function drawReview(parent: HTMLElement, review: Review, actions: ReviewActions): void {
  const body = parent.createDiv({ cls: "dd-import-body" });
  drawSummary(body, review);
  drawFailure(body, review);
  drawWhatChanges(body, review);
  drawButtons(parent, review, actions);
}
