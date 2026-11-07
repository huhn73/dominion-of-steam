/** Plural forms, picked with `Intl.PluralRules` from the parameter `count` */
export interface Plural {
  one: string
  other: string
}

/** The shape every translation must have: the German dictionary with plain strings */
export type DictShape<T> = T extends string
  ? string
  : T extends Plural
    ? Plural
    : { readonly [K in keyof T]: DictShape<T[K]> }

/** Dotted paths to all texts of a dictionary ("common.language.label") */
export type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string | Plural ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>
}[keyof T & string]

export type Params = Record<string, string | number>
