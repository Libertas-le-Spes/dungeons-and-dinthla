export interface OpenPlace {
  readonly newTab: boolean;
}

export const HERE: OpenPlace = { newTab: false };

export const NEW_TAB: OpenPlace = { newTab: true };
