export function newNamesTitle(sessionName: string): string {
  return `New names in ${sessionName}`;
}

export const NEW_NAMES_EXPLAINED =
  "These names are on three or more lines, and nothing says whether each is a character or a place. Choose one to make its note. Names you leave are asked about again after your next save that names them.";

export function chosenWords(label: string): string {
  return `You chose ${label}.`;
}
