/** A catalog entry is a message with optional `{name}` placeholders, or a one/other plural pair. */
export type PluralMessage = { readonly one: string; readonly other: string }
export type CatalogShape = Readonly<Record<string, string | PluralMessage>>

/** Another language must translate every key of the English source catalog, and nothing else. */
export type Translation<Source extends CatalogShape> = {
  readonly [Key in keyof Source]: Source[Key] extends string ? string : PluralMessage
}
