export interface CharacterCreators {
  newCharacter(returnFocus: () => void): void;
  importCharacter(returnFocus: () => void): void;
}
