import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  LevelFormat,
  AlignmentType,
  type ILevelsOptions,
} from 'docx';
import type { Value, TElement } from 'platejs';
import { createSourcesXML } from './docx-converters/sources-xml';
import type { TCitationElement } from '@/components/editor/plugins/citation-kit';
import { useCitationStore } from '@/lib/stores/citation-store';
import {
  DEFAULT_SECTION,
  HEADING_STYLES,
  NORMAL_STYLE,
  CODE_STYLE,
  BLOCKQUOTE_STYLE,
  BIBLIOGRAPHY_STYLE,
} from './docx-converters/styles';
import {
  convertElement,
  type ConverterContext,
} from './docx-converters/element-converter';
import {
  buildCitationOrderMap,
  type CitationContext,
} from './docx-converters/citation-converter';
import {
  createBibliographySection,
  formatBibliographyEntry,
} from './docx-converters/bibliography';

/**
 * Exportiert Editor-Inhalt zu DOCX
 */
export async function exportToDocx(
  editorValue: Value,
  title: string = 'Dokument',
  citationStore?: ReturnType<typeof useCitationStore.getState>
): Promise<Blob> {
  // Hole Citation-Store-Daten (falls nicht übergeben)
  const store = citationStore || useCitationStore.getState();
  const {
    citationStyle,
    citationFormat,
    citationNumberFormat,
  } = store;

  // Sammle alle Zitate aus dem Dokument
  const allCitations: TCitationElement[] = [];
  const citationNodes: Array<{ type: string; sourceId?: string }> = [];

  function collectCitations(nodes: Value) {
    for (const node of nodes) {
      if ('type' in node) {
        const element = node as TElement;
        if (element.type === 'citation') {
          const citation = element as TCitationElement;
          citationNodes.push({
            type: 'citation',
            sourceId: citation.sourceId,
          });
          // Sammle eindeutige Zitate
          if (
            citation.sourceId &&
            !allCitations.find((c) => c.sourceId === citation.sourceId)
          ) {
            allCitations.push(citation);
          }
        }
        // Rekursiv durch Kinder gehen
        if (element.children) {
          collectCitations(element.children as Value);
        }
      }
    }
  }

  collectCitations(editorValue);

  // Erstelle Citation-Order-Map
  const citationOrder = buildCitationOrderMap(citationNodes);

  // Erstelle Converter-Context
  const context: ConverterContext = {
    citationStyle: citationStyle || 'apa',
    citationFormat: citationFormat || 'author-date',
    citationNumberFormat: citationNumberFormat || 'bracket',
    citationOrder,
  };

  // Prüfe, ob bereits ein Quellenverzeichnis im Editor-Inhalt vorhanden ist
  let hasBibliographyInContent = false;
  for (const node of editorValue) {
    if ('type' in node) {
      const element = node as TElement;
      // Prüfe auf Bibliographie-Marker (wird von EditorBibliography gesetzt)
      if ((element as any).bibliography === true || 
          (element as any).bibliographyHeading === true) {
        hasBibliographyInContent = true;
        break;
      }
      // Prüfe auch auf Überschrift "Quellenverzeichnis"
      if ((element.type === 'h1' || element.type === 'h2' || element.type === 'h3' || 
           element.type === 'h4' || element.type === 'h5' || element.type === 'h6') &&
          element.children && 
          element.children.some((child: any) => 
            typeof child === 'object' && 
            'text' in child && 
            typeof child.text === 'string' && 
            child.text.toLowerCase().includes('quellenverzeichnis')
          )) {
        hasBibliographyInContent = true;
        break;
      }
    }
  }

  // Konvertiere alle Elemente
  const children: (Paragraph | import('docx').Table)[] = [];

  for (let i = 0; i < editorValue.length; i++) {
    const node = editorValue[i];
    if ('type' in node) {
      const element = node as TElement;
      
      // Prüfe, ob dieser Paragraph nach einem Equation-Element kommt und möglicherweise die Formel enthält
      if (element.type === 'p' && i > 0 && editorValue[i - 1] && 'type' in editorValue[i - 1]) {
        const prevElement = editorValue[i - 1] as TElement;
        if (prevElement.type === 'equation') {
          const equationText = (prevElement as any).texExpression || '';
          const paragraphText = (element.children || []).map((c: any) => {
            if ('text' in c) return c.text;
            return '';
          }).join('').trim();
          
          // Wenn der Paragraph nur die Formel enthält (oder leer ist), überspringe ihn
          if (paragraphText === equationText || paragraphText === '' || paragraphText === equationText.replace(/\s+/g, ' ').trim()) {
            continue; // Überspringe diesen Paragraph
          }
        }
      }
      
      
      const converted = convertElement(element, context);

      if (Array.isArray(converted)) {
        children.push(...converted);
      } else {
        children.push(converted);
      }
    }
  }

  // Erstelle Bibliographie nur, wenn sie nicht bereits im Editor-Inhalt vorhanden ist
  if (!hasBibliographyInContent) {
    const bibliographyParagraphs = createBibliographySection(
      allCitations,
      (citationStyle as any) || 'apa'
    );

    // Füge Bibliographie hinzu (falls Zitate vorhanden)
    if (bibliographyParagraphs.length > 0) {
      // Leerzeile vor Bibliographie
      children.push(
        new Paragraph({
          children: [new TextRun({ text: '' })],
          spacing: {
            before: 240,
          },
        })
      );
      children.push(...bibliographyParagraphs);
    }
  }

  // Erstelle Numbering-Definitionen für nummerierte Listen
  const numberedLevels: readonly ILevelsOptions[] = [
    {
      level: 0,
      format: LevelFormat.DECIMAL,
      text: '%1.',
      alignment: AlignmentType.LEFT,
      style: {
        paragraph: {
          indent: { left: 720, hanging: 260 },
        },
      },
    },
    {
      level: 1,
      format: LevelFormat.DECIMAL,
      text: '%1.%2.',
      alignment: AlignmentType.LEFT,
      style: {
        paragraph: {
          indent: { left: 1440, hanging: 260 },
        },
      },
    },
    {
      level: 2,
      format: LevelFormat.DECIMAL,
      text: '%1.%2.%3.',
      alignment: AlignmentType.LEFT,
      style: {
        paragraph: {
          indent: { left: 2160, hanging: 260 },
        },
      },
    },
    {
      level: 3,
      format: LevelFormat.DECIMAL,
      text: '%1.%2.%3.%4.',
      alignment: AlignmentType.LEFT,
      style: {
        paragraph: {
          indent: { left: 2880, hanging: 260 },
        },
      },
    },
    {
      level: 4,
      format: LevelFormat.DECIMAL,
      text: '%1.%2.%3.%4.%5.',
      alignment: AlignmentType.LEFT,
      style: {
        paragraph: {
          indent: { left: 3600, hanging: 260 },
        },
      },
    },
  ] as const;

  // Erstelle Numbering-Definitionen für Bullet-Listen
  const bulletLevels: readonly ILevelsOptions[] = [
    {
      level: 0,
      format: LevelFormat.BULLET,
      text: '•',
      alignment: AlignmentType.LEFT,
      style: {
        paragraph: {
          indent: { left: 720, hanging: 260 },
        },
      },
    },
    {
      level: 1,
      format: LevelFormat.BULLET,
      text: '○',
      alignment: AlignmentType.LEFT,
      style: {
        paragraph: {
          indent: { left: 1440, hanging: 260 },
        },
      },
    },
    {
      level: 2,
      format: LevelFormat.BULLET,
      text: '■',
      alignment: AlignmentType.LEFT,
      style: {
        paragraph: {
          indent: { left: 2160, hanging: 260 },
        },
      },
    },
    {
      level: 3,
      format: LevelFormat.BULLET,
      text: '▪',
      alignment: AlignmentType.LEFT,
      style: {
        paragraph: {
          indent: { left: 2880, hanging: 260 },
        },
      },
    },
    {
      level: 4,
      format: LevelFormat.BULLET,
      text: '▫',
      alignment: AlignmentType.LEFT,
      style: {
        paragraph: {
          indent: { left: 3600, hanging: 260 },
        },
      },
    },
  ] as const;

  // Erstelle DOCX-Dokument
  const doc = new Document({
    sections: [
      {
        properties: DEFAULT_SECTION,
        children,
      },
    ],
    styles: {
      paragraphStyles: [
        NORMAL_STYLE,
        ...Object.values(HEADING_STYLES),
        CODE_STYLE,
        BLOCKQUOTE_STYLE,
        BIBLIOGRAPHY_STYLE,
      ],
    },
    numbering: {
      config: [
        {
          reference: 'default-numbering',
          levels: numberedLevels,
        },
        {
          reference: 'default-bullet',
          levels: bulletLevels,
        },
      ],
    },
  });

  // Generiere DOCX als Buffer für sichere Modifikation
  const buffer = await Packer.toBuffer(doc);
  // Konvertiere Buffer zu ArrayBuffer für Blob (sicherstellen dass es ein ArrayBuffer ist, kein SharedArrayBuffer)
  const arrayBuffer = new Uint8Array(buffer).buffer;
  
  // Füge Sources-Liste hinzu, wenn Zitate vorhanden sind
  // Dies ist notwendig, damit Word die Metadaten korrekt erkennt
  if (allCitations.length > 0) {
    try {
      const JSZip = (await import('jszip')).default;
      const zip = await JSZip.loadAsync(buffer);
      
      // Erstelle Sources XML mit allen korrekten Metadaten
      const sourcesXML = createSourcesXML(allCitations);
      
      // Stelle sicher, dass das customXml Verzeichnis existiert
      const wordFolder = zip.folder('word');
      const customXmlFolder = wordFolder?.folder('customXml');
      if (wordFolder && !customXmlFolder) {
        wordFolder.folder('customXml');
      }
      
      // Füge Sources XML hinzu
      zip.file('word/customXml/item1.xml', sourcesXML);
      
      // 1. Erstelle Custom XML Relationships (word/customXml/_rels/item1.xml.rels)
      // Diese Datei verknüpft das Custom XML mit dem Bibliography Schema
      const customXmlRelsFolder = customXmlFolder?.folder('_rels') || wordFolder?.folder('customXml')?.folder('_rels');
      if (!customXmlRelsFolder) {
        wordFolder?.folder('customXml')?.folder('_rels');
      }
      
      const customXmlRelsXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/customXmlProps" Target="itemProps1.xml"/>
</Relationships>`;
      zip.file('word/customXml/_rels/item1.xml.rels', customXmlRelsXML);
      
      // 2. Erstelle Custom XML Properties (word/customXml/itemProps1.xml)
      // Diese Datei definiert die Eigenschaften des Custom XML Parts
      const itemPropsXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<ds:datastoreItem ds:itemID="{B5DBD9F8-5B24-4F86-AF69-89A0B5B5C7E1}" xmlns:ds="http://schemas.openxmlformats.org/officeDocument/2006/customXml">
  <ds:schemaRefs>
    <ds:schemaRef ds:uri="http://schemas.openxmlformats.org/officeDocument/2006/bibliography"/>
  </ds:schemaRefs>
</ds:datastoreItem>`;
      zip.file('word/customXml/itemProps1.xml', itemPropsXML);
      
      // 3. Aktualisiere Content Types ([Content_Types].xml)
      const contentTypesFile = zip.file('[Content_Types].xml');
      if (contentTypesFile) {
        let contentTypesXML = await contentTypesFile.async('string');
        
        // Prüfe, ob Custom XML Parts bereits registriert sind
        if (!contentTypesXML.includes('customXml/item1.xml')) {
          // Füge Custom XML Part hinzu
          contentTypesXML = contentTypesXML.replace(
            '</Types>',
            `  <Override PartName="/word/customXml/item1.xml" ContentType="application/xml"/>
  <Override PartName="/word/customXml/itemProps1.xml" ContentType="application/vnd.openxmlformats-officedocument.customXmlProperties+xml"/>
</Types>`
          );
          zip.file('[Content_Types].xml', contentTypesXML);
        }
      }
      
      // 4. Lese bestehende Relationships-Datei und füge Custom XML Relationship hinzu
      const relsFile = zip.file('word/_rels/document.xml.rels');
      if (relsFile) {
        let relationshipsXML = await relsFile.async('string');
        
        // Prüfe, ob Custom XML Relationship bereits existiert
        if (!relationshipsXML.includes('customXml/item1.xml')) {
          // Finde die höchste rId
          const rIdMatches = relationshipsXML.match(/Id="rId(\d+)"/g);
          const maxRId = rIdMatches
            ? Math.max(...rIdMatches.map(m => parseInt(m.match(/\d+/)![0])))
            : 0;
          const newRId = `rId${maxRId + 1}`;
          
          // Füge Custom XML Relationship hinzu
          relationshipsXML = relationshipsXML.replace(
            '</Relationships>',
            `  <Relationship Id="${newRId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/customXml" Target="customXml/item1.xml"/>\n</Relationships>`
          );
          zip.file('word/_rels/document.xml.rels', relationshipsXML);
        }
      }
      
      // Generiere modifiziertes Blob
      const modifiedBlob = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });
      return modifiedBlob;
    } catch (error) {
      console.warn('Fehler beim Hinzufügen der Sources-Liste:', error);
      // Fallback: Originales Blob zurückgeben
      return new Blob([arrayBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
    }
  }
  
  // Generiere Blob
  return new Blob([arrayBuffer], { 
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
  });
}

/**
 * Exportiert Editor-Inhalt zu DOCX und startet Download
 */
export async function exportToDocxAndDownload(
  editorValue: Value,
  filename: string = 'dokument',
  citationStore?: ReturnType<typeof useCitationStore.getState>
): Promise<void> {
  const { saveAs } = await import('file-saver');
  const blob = await exportToDocx(editorValue, filename, citationStore);
  const sanitizedFilename = filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  saveAs(blob, `${sanitizedFilename}.docx`);
}

