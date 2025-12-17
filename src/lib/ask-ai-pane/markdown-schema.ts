import rehypeSanitize, { defaultSchema } from "rehype-sanitize"
import type { Schema } from "hast-util-sanitize"

const baseAttributes: NonNullable<Schema["attributes"]> = defaultSchema.attributes ?? {}

export const markdownSanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...baseAttributes,
    code: [...(baseAttributes.code ?? []), "className", ["data-language"], ["data-theme"]],
    pre: [...(baseAttributes.pre ?? []), "className", ["data-language"], ["data-theme"]],
    span: [...(baseAttributes.span ?? []), "className"],
    table: [...(baseAttributes.table ?? []), "className"],
    thead: [...(baseAttributes.thead ?? []), "className"],
    tbody: [...(baseAttributes.tbody ?? []), "className"],
    tr: [...(baseAttributes.tr ?? []), "className"],
    th: [...(baseAttributes.th ?? []), "className"],
    td: [...(baseAttributes.td ?? []), "className"],
  },
} satisfies Schema

