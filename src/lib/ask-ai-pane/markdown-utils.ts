import { Children, isValidElement, type ReactNode } from "react"
import type { TableRow, TableMdastNode, TableHastNode } from './types'
import { codeBlockLanguages } from "@/components/ui/code-block-node"

export const extractTextFromNode = (node: ReactNode): string => {
  if (typeof node === "string" || typeof node === "number") return String(node)
  if (Array.isArray(node)) return node.map(extractTextFromNode).join("")
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return extractTextFromNode(node.props.children ?? "")
  }
  return ""
}

export const getCodeLanguage = (className?: string) => {
  const match = className?.match(/language-([\w-]+)/)
  return match?.[1] || "plaintext"
}

export const getCodeLanguageLabel = (lang?: string) =>
  codeBlockLanguages.find((language) => language.value === lang)?.label || "Plain Text"

const normalizeCellText = (value: string) =>
  value
    .split("\n")
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ")

export const collectTableRows = (node: ReactNode): TableRow[] => {
  const rows: TableRow[] = []

  Children.forEach(node, (child) => {
    if (!isValidElement<{ children?: ReactNode }>(child)) return
    const type =
      typeof child.type === "string"
        ? child.type
        : typeof (child.props as { node?: { tagName?: string } })?.node?.tagName === "string"
          ? (child.props as { node?: { tagName?: string } }).node?.tagName ?? ""
          : ""

    if (type === "thead" || type === "tbody") {
      rows.push(...collectTableRows(child.props.children))
      return
    }

    if (type === "tr") {
      const cells: string[] = []
      let isHeader = false

      Children.forEach(child.props.children, (cell) => {
        if (!isValidElement<{ children?: ReactNode }>(cell)) return
        const cellType = typeof cell.type === "string" ? cell.type : ""
        if (cellType === "th" || cellType === "td") {
          const text = normalizeCellText(extractTextFromNode(cell.props.children))
          cells.push(text)
          if (cellType === "th") isHeader = true
        }
      })

      if (cells.length) {
        rows.push({ cells, isHeader })
      }
    }
  })

  return rows
}

const extractTextFromMdast = (node?: TableMdastNode): string => {
  if (!node) return ""
  if (typeof node.value === "string") return node.value
  if (Array.isArray(node.children)) return node.children.map(extractTextFromMdast).join("")
  return ""
}

const extractTextFromHast = (node?: TableHastNode): string => {
  if (!node) return ""
  if (node.type === "text" && typeof node.value === "string") return node.value
  if (Array.isArray(node.children)) return node.children.map(extractTextFromHast).join("")
  return ""
}

const collectRowsFromMdast = (node?: TableMdastNode): TableRow[] => {
  const rows: TableRow[] = []
  if (!node?.children) return rows

  node.children.forEach((child) => {
    if (child.type === "tableRow") {
      const cells: string[] = []
      child.children?.forEach((c) => {
        if (c.type === "tableCell") {
          const text = normalizeCellText(extractTextFromMdast(c))
          cells.push(text)
        }
      })
      if (cells.length) rows.push({ cells, isHeader: false })
    }
  })

  return rows
}

const collectRowsFromHast = (node?: TableHastNode): TableRow[] => {
  const rows: TableRow[] = []
  if (!node?.children) return rows

  node.children.forEach((child) => {
    const tag = child.tagName
    if (tag === "thead" || tag === "tbody") {
      rows.push(...collectRowsFromHast(child))
      return
    }
    if (tag === "tr") {
      const cells: string[] = []
      let isHeader = false

      child.children?.forEach((c) => {
        const cellTag = c.tagName
        if (cellTag === "th" || cellTag === "td") {
          const text = normalizeCellText(extractTextFromHast(c))
          cells.push(text)
          if (cellTag === "th") isHeader = true
        }
      })

      if (cells.length) {
        rows.push({ cells, isHeader })
      }
    }
  })

  return rows
}

export const buildMarkdownTable = (node: ReactNode): string | null => {
  const rows = collectTableRows(node)
  if (!rows.length) return null

  const headerRow = rows.find((row) => row.isHeader) ?? rows[0]
  const bodyRows = rows.filter((row) => row !== headerRow)
  const columnCount = headerRow.cells.length

  const toMdRow = (cells: string[]) => `| ${cells.map((cell) => cell || " ").join(" | ")} |`
  const header = toMdRow(headerRow.cells)
  const separator = `| ${Array.from({ length: columnCount }, () => "---").join(" | ")} |`
  const body = bodyRows.map((row) => toMdRow(row.cells)).join("\n")

  return [header, separator, body].filter(Boolean).join("\n")
}

export const buildMarkdownTableFromMdast = (node: unknown): string | null => {
  const table = node as TableMdastNode
  if (table?.type !== "table" || !Array.isArray(table.children)) return null

  const rows = collectRowsFromMdast(table)
  if (!rows.length) return null

  const headerRow = rows[0]
  const bodyRows = rows.slice(1)
  const columnCount = headerRow.cells.length || 1
  const align = Array.isArray(table.align) ? table.align : []

  const toMdRow = (cells: string[]) => `| ${cells.map((cell) => cell || " ").join(" | ")} |`
  const separator = `| ${Array.from({ length: columnCount }, (_, idx) => {
    const a = align[idx]
    if (a === "left") return ":---"
    if (a === "right") return "---:"
    if (a === "center") return ":---:"
    return "---"
  }).join(" | ")} |`
  const header = toMdRow(headerRow.cells)
  const body = bodyRows.map((row) => toMdRow(row.cells)).join("\n")

  return [header, separator, body].filter(Boolean).join("\n")
}

export const buildMarkdownTableFromHast = (node: unknown): string | null => {
  const table = node as TableHastNode
  if (table?.type !== "element" || table.tagName !== "table") return null

  const rows = collectRowsFromHast(table)
  if (!rows.length) return null

  const headerRow = rows.find((row) => row.isHeader) ?? rows[0]
  const bodyRows = rows.filter((row) => row !== headerRow)
  const columnCount = headerRow.cells.length || 1

  const toMdRow = (cells: string[]) => `| ${cells.map((cell) => cell || " ").join(" | ")} |`
  const header = toMdRow(headerRow.cells)
  const separator = `| ${Array.from({ length: columnCount }, () => "---").join(" | ")} |`
  const body = bodyRows.map((row) => toMdRow(row.cells)).join("\n")

  return [header, separator, body].filter(Boolean).join("\n")
}

