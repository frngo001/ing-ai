declare module 'rtf-parser' {
  export interface RTFDocument {
    content?: any
    children?: any[]
  }

  export function parseString(
    text: string,
    callback: (err: Error | null, doc: RTFDocument) => void
  ): void
}

