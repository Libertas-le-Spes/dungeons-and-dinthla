export interface CharacterCreators {
  newCharacter(returnFocus: () => void): void;
  importCharacter(returnFocus: () => void): void;
  makeMain(path: string, returnFocus: () => void): void;
  died(path: string, returnFocus: () => void): void;
}
