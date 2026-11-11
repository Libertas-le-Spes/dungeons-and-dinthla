export function choiceOf<T extends string>(choices: readonly T[], value: string): T | undefined {
  return choices.find((choice) => choice === value);
}
