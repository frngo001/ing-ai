import { canExtractClientSide, getFileType, isSupportedFileType, getSupportedExtensionsList } from './file-types'

export interface FileContentResult {
  content: string
  error?: string
  metadata?: {
    fileName: string
    fileType: string
    fileSize: number
  }
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_CONTENT_LENGTH = 50000 // 50.000 Zeichen

/**
 * Extrahiert Content aus einer Datei (clientseitig für TXT, MD)
 */
export async function extractFileContent(file: File): Promise<FileContentResult> {
  // Validierung
  if (!isSupportedFileType(file)) {
    const supportedList = getSupportedExtensionsList()
    return {
      content: '',
      error: `Dateityp "${file.name.split('.').pop()?.toUpperCase()}" wird nicht unterstützt. Unterstützte Formate: ${supportedList}`,
      metadata: {
        fileName: file.name,
        fileType: file.type || 'unknown',
        fileSize: file.size,
      },
    }
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      content: '',
      error: `Datei zu groß (max. ${MAX_FILE_SIZE / 1024 / 1024}MB)`,
      metadata: {
        fileName: file.name,
        fileType: file.type || 'unknown',
        fileSize: file.size,
      },
    }
  }

  const fileType = getFileType(file)

  // Clientseitige Extraktion für TXT und MD
  if (canExtractClientSide(file)) {
    try {
      const content = await file.text()
      const truncatedContent =
        content.length > MAX_CONTENT_LENGTH
          ? content.substring(0, MAX_CONTENT_LENGTH) +
            '\n\n[... Text gekürzt ...]'
          : content

      return {
        content: truncatedContent,
        metadata: {
          fileName: file.name,
          fileType: fileType || 'unknown',
          fileSize: file.size,
        },
      }
    } catch (error) {
      return {
        content: '',
        error: `Fehler beim Lesen der Datei: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
        metadata: {
          fileName: file.name,
          fileType: fileType || 'unknown',
          fileSize: file.size,
        },
      }
    }
  }

  // Für serverseitige Extraktion (PDF, DOCX, RTF) wird die Datei an die API gesendet
  // Diese Funktion wird in handlers.ts aufgerufen
  return {
    content: '',
    error: 'Datei muss serverseitig extrahiert werden',
    metadata: {
      fileName: file.name,
      fileType: fileType || 'unknown',
      fileSize: file.size,
    },
  }
}

/**
 * Extrahiert Content aus mehreren Dateien
 */
export async function extractMultipleFilesContent(
  files: File[]
): Promise<FileContentResult[]> {
  return Promise.all(files.map((file) => extractFileContent(file)))
}

