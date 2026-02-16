export enum ProviderEnum {
  EMAIL = 'EMAIL',
  GOOGLE = 'GOOGLE',
  FACEBOOK = 'FACEBOOK',
}

export type ProviderEnumType = keyof typeof ProviderEnum;
