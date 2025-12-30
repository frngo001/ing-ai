import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 30

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_CONTENT_LENGTH = 50000 // 50.000 Zeichen

/**
 * Extrahiert Text aus einer DOCX-Datei mit mammoth
 */
async function extractDOCXContent(file: File): Promise<string> {
  try {
    const mammoth = await import('mammoth')
    const arrayBuffer = await file.arrayBuffer()
    // mammoth erwartet 'buffer' nicht 'arrayBuffer'
    const buffer = Buffer.from(arrayBuffer)
    const result = await mammoth.default.extractRawText({ buffer })
    const text = result.value || ''
    console.log(`[DOCX EXTRACT] Text extrahiert: ${text.length} Zeichen`)
    if (text.length > 0) {
      console.log(`[DOCX EXTRACT] Text-Vorschau: ${text.substring(0, 300)}...`)
    }
    return text
  } catch (error) {
    console.error(`[DOCX EXTRACT] Fehler:`, error)
    throw new Error(
      `Fehler beim Extrahieren von DOCX: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
    )
  }
}

/**
 * Extrahiert Text aus Excel-Dateien (XLSX) mit xlsx
 */
async function extractXLSXContent(file: File): Promise<string> {
  try {
    const XLSX = await import('xlsx')
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.default.read(arrayBuffer, { type: 'array' })
    
    // Extrahiere Text aus allen Sheets
    const textParts: string[] = []
    workbook.SheetNames.forEach((sheetName) => {
      const worksheet = workbook.Sheets[sheetName]
      const sheetData = XLSX.default.utils.sheet_to_txt(worksheet)
      if (sheetData) {
        textParts.push(`Sheet: ${sheetName}\n${sheetData}`)
      }
    })
    
    const text = textParts.join('\n\n---\n\n')
    console.log(`[XLSX EXTRACT] Text extrahiert: ${text.length} Zeichen`)
    if (text.length > 0) {
      console.log(`[XLSX EXTRACT] Text-Vorschau: ${text.substring(0, 300)}...`)
    }
    return text
  } catch (error) {
    console.error(`[XLSX EXTRACT] Fehler:`, error)
    throw new Error(
      `Fehler beim Extrahieren von XLSX: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
    )
  }
}

/**
 * Extrahiert Text aus RTF-Dateien
 */
async function extractRTFContent(file: File): Promise<string> {
  try {
    const text = await file.text()
    // Einfache RTF-Extraktion: Entferne RTF-Steuerzeichen
    const plainText = text
      .replace(/\\[a-z]+\d*\s?/gi, '') // Entferne RTF-Steuerzeichen
      .replace(/\{[^}]*\}/g, '') // Entferne RTF-Gruppen
      .replace(/\s+/g, ' ') // Normalisiere Whitespace
      .trim()
    
    console.log(`[RTF EXTRACT] Text extrahiert: ${plainText.length} Zeichen`)
    if (plainText.length > 0) {
      console.log(`[RTF EXTRACT] Text-Vorschau: ${plainText.substring(0, 300)}...`)
    }
    return plainText
  } catch (error) {
    console.error(`[RTF EXTRACT] Fehler:`, error)
    throw new Error(
      `Fehler beim Extrahieren von RTF: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
    )
  }
}

/**
 * Extrahiert Text aus einer PDF-Datei
 */
async function extractPDFContent(file: File): Promise<string> {
  try {
    // Dynamischer Import für pdf2json (ESM-Modul)
    const PDFParserModule = await import('pdf2json')
    // pdf2json exportiert PDFParser als default export
    const PDFParser = (PDFParserModule as any).default || PDFParserModule.PDFParser
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Erstelle eine Instanz von PDFParser
    const pdfParser = new PDFParser(null, true) // null = kein Context, true = needRawText
    
    // Promise-basierte Verarbeitung mit Events
    return new Promise((resolve, reject) => {
      pdfParser.on('pdfParser_dataError', (errData: any) => {
        reject(new Error(`PDF Parse Error: ${errData.parserError?.message || 'Unknown error'}`))
      })
      
      pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
        try {
          // Extrahiere den Text aus dem geparsten PDF
          const text = pdfParser.getRawTextContent()
          console.log(`[PDF EXTRACT] Text extrahiert: ${text?.length || 0} Zeichen`)
          if (text && text.length > 0) {
            console.log(`[PDF EXTRACT] Text-Vorschau: ${text.substring(0, 300)}...`)
          } else {
            console.warn(`[PDF EXTRACT] Warnung: Kein Text extrahiert aus PDF`)
          }
          resolve(text || '')
        } catch (error) {
          console.error(`[PDF EXTRACT] Fehler beim Extrahieren:`, error)
          reject(new Error(`Fehler beim Extrahieren des Textes: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`))
        }
      })
      
      // Parse den Buffer
      pdfParser.parseBuffer(buffer)
    })
  } catch (error) {
    throw new Error(
      `Fehler beim Extrahieren von PDF: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
    )
  }
}

/**
 * Truncatiert Content auf maximale Länge
 */
function truncateContent(content: string): string {
  if (content.length <= MAX_CONTENT_LENGTH) {
    return content
  }
  return (
    content.substring(0, MAX_CONTENT_LENGTH) + '\n\n[... Text gekürzt ...]'
  )
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'Keine Datei übergeben' },
        { status: 400 }
      )
    }

    // Größenprüfung
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `Datei zu groß (max. ${MAX_FILE_SIZE / 1024 / 1024}MB)`,
        },
        { status: 400 }
      )
    }

    const fileName = file.name.toLowerCase()
    let content = ''

    // Bestimme Dateityp und extrahiere Content
    console.log(`[FILE EXTRACT] Starte Extraktion für: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`)
    
    if (fileName.endsWith('.pdf')) {
      content = await extractPDFContent(file)
    } else if (fileName.endsWith('.docx')) {
      content = await extractDOCXContent(file)
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.xlsb') || fileName.endsWith('.xlsm') || fileName.endsWith('.xltx')) {
      content = await extractXLSXContent(file)
    } else if (fileName.endsWith('.rtf')) {
      content = await extractRTFContent(file)
    } else {
      // Für andere Formate: Versuche als Text zu lesen (HTML, XML, CSV, etc.)
      try {
        content = await file.text()
        console.log(`[FILE EXTRACT] Text direkt gelesen: ${content.length} Zeichen`)
      } catch (error) {
        console.error(`[FILE EXTRACT] Fehler bei Extraktion von ${file.name}:`, error)
        return NextResponse.json(
          {
            error: `Dateityp "${fileName.split('.').pop()?.toUpperCase()}" wird nicht unterstützt oder konnte nicht extrahiert werden.`,
          },
          { status: 400 }
        )
      }
    }
    
    console.log(`[FILE EXTRACT] Extraktion erfolgreich: ${file.name}`)
    console.log(`[FILE EXTRACT] Extrahierter Text-Länge: ${content.length} Zeichen`)
    console.log(`[FILE EXTRACT] Text-Vorschau (erste 200 Zeichen): ${content.substring(0, 200)}...`)

    // Truncatiere Content falls nötig
    const truncatedContent = truncateContent(content)
    if (content.length > MAX_CONTENT_LENGTH) {
      console.log(`[FILE EXTRACT] Text wurde gekürzt von ${content.length} auf ${truncatedContent.length} Zeichen`)
    }

    return NextResponse.json({
      content: truncatedContent,
      metadata: {
        fileName: file.name,
        fileType: file.type || 'unknown',
        fileSize: file.size,
        originalLength: content.length,
        truncated: content.length > MAX_CONTENT_LENGTH,
      },
    })
  } catch (error) {
    console.error('[FILE EXTRACT] Fehler:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Fehler beim Extrahieren des Dateiinhalts',
      },
      { status: 500 }
    )
  }
}

