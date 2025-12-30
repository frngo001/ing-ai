/**
 * Unterstützte Dateitypen für Content-Extraktion
 * Basierend auf textract: https://github.com/devmehq/extract-text
 */
export const SUPPORTED_FILE_TYPES = {
  // Text-Formate (clientseitig)
  txt: {
    mimeTypes: ['text/plain'],
    extensions: ['.txt'],
    clientExtraction: true,
  },
  md: {
    mimeTypes: ['text/markdown', 'text/x-markdown'],
    extensions: ['.md', '.markdown', '.mdx'],
    clientExtraction: true,
  },
  html: {
    mimeTypes: ['text/html'],
    extensions: ['.html', '.htm'],
    clientExtraction: true,
  },
  xml: {
    mimeTypes: ['text/xml', 'application/xml'],
    extensions: ['.xml', '.xsl'],
    clientExtraction: true,
  },
  css: {
    mimeTypes: ['text/css'],
    extensions: ['.css'],
    clientExtraction: true,
  },
  js: {
    mimeTypes: ['text/javascript', 'application/javascript'],
    extensions: ['.js', '.mjs', '.cjs'],
    clientExtraction: true,
  },
  json: {
    mimeTypes: ['application/json'],
    extensions: ['.json'],
    clientExtraction: true,
  },
  csv: {
    mimeTypes: ['text/csv'],
    extensions: ['.csv'],
    clientExtraction: true,
  },
  
  // PDF (serverseitig mit pdf2json)
  pdf: {
    mimeTypes: ['application/pdf'],
    extensions: ['.pdf'],
    clientExtraction: false,
  },
  
  // Word-Dokumente (serverseitig mit textract)
  doc: {
    mimeTypes: ['application/msword'],
    extensions: ['.doc'],
    clientExtraction: false,
  },
  docx: {
    mimeTypes: [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    extensions: ['.docx'],
    clientExtraction: false,
  },
  odt: {
    mimeTypes: ['application/vnd.oasis.opendocument.text'],
    extensions: ['.odt', '.ott'],
    clientExtraction: false,
  },
  rtf: {
    mimeTypes: ['application/rtf', 'text/rtf'],
    extensions: ['.rtf'],
    clientExtraction: false,
  },
  
  // Excel-Dateien (serverseitig mit textract)
  xls: {
    mimeTypes: ['application/vnd.ms-excel'],
    extensions: ['.xls'],
    clientExtraction: false,
  },
  xlsx: {
    mimeTypes: [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
    extensions: ['.xlsx', '.xlsb', '.xlsm', '.xltx'],
    clientExtraction: false,
  },
  ods: {
    mimeTypes: ['application/vnd.oasis.opendocument.spreadsheet'],
    extensions: ['.ods', '.ots'],
    clientExtraction: false,
  },
  
  // PowerPoint-Dateien (serverseitig mit textract)
  pptx: {
    mimeTypes: [
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ],
    extensions: ['.pptx', '.potx'],
    clientExtraction: false,
  },
  odp: {
    mimeTypes: ['application/vnd.oasis.opendocument.presentation'],
    extensions: ['.odp', '.otp'],
    clientExtraction: false,
  },
  
  // Andere Formate (serverseitig mit textract)
  epub: {
    mimeTypes: ['application/epub+zip'],
    extensions: ['.epub'],
    clientExtraction: false,
  },
  atom: {
    mimeTypes: ['application/atom+xml'],
    extensions: ['.atom'],
    clientExtraction: false,
  },
  rss: {
    mimeTypes: ['application/rss+xml'],
    extensions: ['.rss'],
    clientExtraction: false,
  },
  
  // Bilder mit OCR (serverseitig mit textract + tesseract)
  png: {
    mimeTypes: ['image/png'],
    extensions: ['.png'],
    clientExtraction: false,
  },
  jpg: {
    mimeTypes: ['image/jpeg'],
    extensions: ['.jpg', '.jpeg'],
    clientExtraction: false,
  },
  gif: {
    mimeTypes: ['image/gif'],
    extensions: ['.gif'],
    clientExtraction: false,
  },
} as const

export type SupportedFileType = keyof typeof SUPPORTED_FILE_TYPES

/**
 * Prüft, ob eine Datei eines der unterstützten Formate ist
 */
export function isSupportedFileType(file: File): boolean {
  const fileName = file.name.toLowerCase()
  const fileType = file.type.toLowerCase()

  // Prüfe nach Extension
  for (const typeConfig of Object.values(SUPPORTED_FILE_TYPES)) {
    if (typeConfig.extensions.some((ext) => fileName.endsWith(ext))) {
      return true
    }
  }

  // Prüfe nach MIME-Type
  for (const typeConfig of Object.values(SUPPORTED_FILE_TYPES)) {
    if ((typeConfig.mimeTypes as readonly string[]).includes(fileType)) {
      return true
    }
  }

  return false
}

/**
 * Ermittelt den Dateityp einer Datei
 */
export function getFileType(file: File): SupportedFileType | null {
  const fileName = file.name.toLowerCase()
  const fileType = file.type.toLowerCase()

  for (const [type, config] of Object.entries(SUPPORTED_FILE_TYPES)) {
    if (
      config.extensions.some((ext) => fileName.endsWith(ext)) ||
      (config.mimeTypes as readonly string[]).includes(fileType)
    ) {
      return type as SupportedFileType
    }
  }

  return null
}

/**
 * Prüft, ob eine Datei clientseitig extrahiert werden kann
 */
export function canExtractClientSide(file: File): boolean {
  const fileType = getFileType(file)
  if (!fileType) return false
  return SUPPORTED_FILE_TYPES[fileType].clientExtraction
}

/**
 * Gibt die accept-Attribute für File-Input zurück
 */
export function getFileInputAccept(): string {
  const allExtensions = Object.values(SUPPORTED_FILE_TYPES)
    .flatMap((config) => config.extensions)
    .join(',')
  const allMimeTypes = Object.values(SUPPORTED_FILE_TYPES)
    .flatMap((config) => config.mimeTypes)
    .join(',')

  return `${allExtensions},${allMimeTypes}`
}

/**
 * Liste aller unterstützten Dateiendungen (für Fehlermeldungen)
 */
export function getSupportedExtensionsList(): string {
  const extensions = Object.values(SUPPORTED_FILE_TYPES)
    .flatMap((config) => config.extensions)
    .map((ext) => ext.toUpperCase())
    .filter((ext, index, arr) => arr.indexOf(ext) === index) // Eindeutige Werte
    .sort()
    .join(', ')
  
  return extensions
}

