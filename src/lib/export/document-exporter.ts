import { asBlob } from 'html-docx-js-typescript'
import { saveAs } from 'file-saver'
import type { Value } from 'platejs'
import { exportToDocxAndDownload } from './docx-exporter'

export type ExportFormat = 'html' | 'docx' | 'latex' | 'txt'

/**
 * Exportiert ein Dokument im angegebenen Format
 * @param content - HTML-String oder Editor-Value (für DOCX)
 * @param title - Dokumenttitel
 * @param format - Export-Format
 * @param editorValue - Optional: Editor-Value für DOCX-Export (wenn nicht übergeben, wird content als HTML behandelt)
 */
export async function exportDocument(
    content: string | Value,
    title: string,
    format: ExportFormat,
    editorValue?: Value
) {
    const filename = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`

    switch (format) {
        case 'html':
            exportHtml(typeof content === 'string' ? content : '', filename)
            break
        case 'docx':
            // Für DOCX: verwende editorValue falls vorhanden, sonst versuche content als Value
            if (editorValue) {
                await exportToDocxAndDownload(editorValue, filename)
            } else if (typeof content !== 'string') {
                await exportToDocxAndDownload(content, filename)
            } else {
                // Fallback: alter HTML-basierter Export
                await exportDocx(content, filename)
            }
            break
        case 'latex':
            exportLatex(typeof content === 'string' ? content : '', filename)
            break
        case 'txt':
            exportTxt(typeof content === 'string' ? content : '', filename)
            break
    }
}

function exportHtml(content: string, filename: string) {
    const fullHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${filename}</title>
      <style>
        body { font-family: sans-serif; max-width: 800px; margin: 2rem auto; line-height: 1.6; }
        h1, h2, h3 { color: #333; }
        p { margin-bottom: 1rem; }
      </style>
    </head>
    <body>
      ${content}
    </body>
    </html>
  `
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' })
    saveAs(blob, `${filename}.html`)
}

async function exportDocx(content: string, filename: string) {
    // Wrap content in a basic html structure for better conversion
    const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"></head>
      <body>${content}</body>
    </html>
  `

    // @ts-ignore - types might be slightly off for this library
    const blob = await asBlob(htmlContent)
    saveAs(blob as Blob, `${filename}.docx`)
}

function exportTxt(content: string, filename: string) {
    // Simple HTML to Text conversion (stripping tags)
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = content
    const text = tempDiv.textContent || tempDiv.innerText || ''

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    saveAs(blob, `${filename}.txt`)
}

function exportLatex(content: string, filename: string) {
    // Basic HTML to LaTeX converter
    // This is a simplified version and might need a more robust library for complex cases
    let latex = content
        .replace(/<h1>(.*?)<\/h1>/g, '\\section{$1}\n')
        .replace(/<h2>(.*?)<\/h2>/g, '\\subsection{$1}\n')
        .replace(/<h3>(.*?)<\/h3>/g, '\\subsubsection{$1}\n')
        .replace(/<p>(.*?)<\/p>/g, '$1\n\n')
        .replace(/<strong>(.*?)<\/strong>/g, '\\textbf{$1}')
        .replace(/<b>(.*?)<\/b>/g, '\\textbf{$1}')
        .replace(/<em>(.*?)<\/em>/g, '\\textit{$1}')
        .replace(/<i>(.*?)<\/i>/g, '\\textit{$1}')
        .replace(/<ul>/g, '\\begin{itemize}\n')
        .replace(/<\/ul>/g, '\\end{itemize}\n')
        .replace(/<ol>/g, '\\begin{enumerate}\n')
        .replace(/<\/ol>/g, '\\end{enumerate}\n')
        .replace(/<li>(.*?)<\/li>/g, '\\item $1\n')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '\\&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        // Remove other HTML tags
        .replace(/<[^>]*>/g, '')

    const fullLatex = `
\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage{geometry}
\\geometry{a4paper, margin=1in}

\\title{${filename}}
\\author{}
\\date{\\today}

\\begin{document}

\\maketitle

${latex}

\\end{document}
  `

    const blob = new Blob([fullLatex], { type: 'application/x-latex;charset=utf-8' })
    saveAs(blob, `${filename}.tex`)
}
