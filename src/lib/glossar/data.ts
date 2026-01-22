/**
 * Glossary data for programmatic SEO
 * /glossar/[begriff] pages
 */

export interface GlossarEntry {
  id: string
  term: string
  shortDefinition: string
  longDefinition: string
  examples: string[]
  relatedTerms: string[]
  category: 'zitation' | 'methodik' | 'struktur' | 'plagiat' | 'formatierung'
  keywords: string[]
}

export const glossarEntries: GlossarEntry[] = [
  {
    id: 'plagiat',
    term: 'Plagiat',
    shortDefinition: 'Die unrechtmäßige Übernahme fremder Gedanken, Texte oder Ideen ohne entsprechende Quellenangabe.',
    longDefinition: `
      <p>Ein Plagiat liegt vor, wenn fremde Gedanken, Texte, Ideen oder Forschungsergebnisse als eigene ausgegeben werden, ohne die Quelle zu nennen. Dies kann absichtlich oder unbeabsichtigt geschehen.</p>

      <h3>Arten von Plagiaten</h3>
      <ul>
        <li><strong>Vollplagiat:</strong> Komplette Übernahme einer fremden Arbeit</li>
        <li><strong>Teilplagiat:</strong> Übernahme von Textpassagen ohne Quellenangabe</li>
        <li><strong>Übersetzungsplagiat:</strong> Übersetzte Texte ohne Quellenangabe</li>
        <li><strong>Paraphrasenplagiat:</strong> Umformulierung ohne Quellenangabe</li>
        <li><strong>Selbstplagiat:</strong> Wiederverwendung eigener früherer Arbeiten ohne Kennzeichnung</li>
      </ul>

      <h3>Konsequenzen</h3>
      <p>Plagiate können schwerwiegende Folgen haben:</p>
      <ul>
        <li>Nichtbestehen der Arbeit</li>
        <li>Exmatrikulation</li>
        <li>Aberkennung von akademischen Titeln</li>
        <li>Rechtliche Konsequenzen (Urheberrechtsverletzung)</li>
      </ul>

      <h3>Vermeidung</h3>
      <p>So vermeidest du Plagiate:</p>
      <ul>
        <li>Führe sorgfältig Quellenverzeichnisse während der Recherche</li>
        <li>Zitiere alle fremden Gedanken und Ideen korrekt</li>
        <li>Verwende Paraphrasierung mit Quellenangabe</li>
        <li>Nutze Plagiatsprüfungs-Tools vor der Abgabe</li>
        <li>Verwende Tools wie Ing AI zur automatischen Zitierverwaltung</li>
      </ul>
    `,
    examples: [
      'Direktes Übernehmen eines Absatzes aus einem Fachbuch ohne Anführungszeichen und Quellenangabe',
      'Paraphrasierung einer wissenschaftlichen Studie ohne Verweis auf die Originalquelle',
      'Verwendung von Abbildungen oder Grafiken ohne Bildnachweis',
    ],
    relatedTerms: ['zitat', 'quellenangabe', 'paraphrase', 'literaturverzeichnis'],
    category: 'plagiat',
    keywords: ['Plagiat', 'Plagiatsprüfung', 'Plagiat vermeiden', 'Selbstplagiat', 'Urheberrecht'],
  },
  {
    id: 'zitat',
    term: 'Zitat',
    shortDefinition: 'Die wörtliche oder sinngemäße Übernahme fremder Gedanken mit korrekter Quellenangabe.',
    longDefinition: `
      <p>Ein Zitat ist die gekennzeichnete Übernahme von Aussagen, Gedanken oder Textpassagen aus fremden Quellen. Zitate sind ein zentrales Element wissenschaftlichen Arbeitens.</p>

      <h3>Arten von Zitaten</h3>

      <h4>Direktes Zitat (wörtlich)</h4>
      <p>Die exakte Übernahme eines Textes in Anführungszeichen:</p>
      <p><em>Beispiel:</em> Müller (2024) betont: "Wissenschaftliches Schreiben erfordert Präzision und Klarheit" (S. 45).</p>

      <h4>Indirektes Zitat (sinngemäß)</h4>
      <p>Die Wiedergabe des Gedankens in eigenen Worten:</p>
      <p><em>Beispiel:</em> Laut Müller (2024, S. 45) sind Genauigkeit und Verständlichkeit wichtige Aspekte beim Verfassen wissenschaftlicher Texte.</p>

      <h4>Sekundärzitat</h4>
      <p>Zitat aus einer Quelle, die selbst aus einer anderen Quelle zitiert (sollte vermieden werden):</p>
      <p><em>Beispiel:</em> Schmidt (zitiert nach Müller, 2024, S. 45) argumentiert...</p>

      <h3>Zitierregeln</h3>
      <ul>
        <li>Direkte Zitate immer in Anführungszeichen</li>
        <li>Bei Auslassungen [...] verwenden</li>
        <li>Bei Änderungen [Anm. d. Verf.] kennzeichnen</li>
        <li>Seitenzahl bei direkten Zitaten immer angeben</li>
        <li>Auch indirekte Zitate müssen gekennzeichnet werden</li>
      </ul>

      <h3>Zitierstile</h3>
      <p>Die gebräuchlichsten Zitierstile sind:</p>
      <ul>
        <li>APA (American Psychological Association)</li>
        <li>MLA (Modern Language Association)</li>
        <li>Chicago/Turabian</li>
        <li>IEEE</li>
        <li>Harvard</li>
        <li>Vancouver</li>
      </ul>
    `,
    examples: [
      'Direktes Zitat: "Der Klimawandel ist die größte Herausforderung unserer Zeit" (Müller, 2024, S. 12).',
      'Indirektes Zitat: Laut Müller (2024) stellt der Klimawandel eine erhebliche Herausforderung dar.',
      'Blockzitat (längere Zitate > 40 Wörter) werden eingerückt ohne Anführungszeichen dargestellt.',
    ],
    relatedTerms: ['plagiat', 'quellenangabe', 'literaturverzeichnis', 'paraphrase'],
    category: 'zitation',
    keywords: ['Zitat', 'Zitieren', 'Direktes Zitat', 'Indirektes Zitat', 'Zitierstile'],
  },
  {
    id: 'literaturverzeichnis',
    term: 'Literaturverzeichnis',
    shortDefinition: 'Alphabetisch geordnetes Verzeichnis aller in einer wissenschaftlichen Arbeit verwendeten Quellen.',
    longDefinition: `
      <p>Das Literaturverzeichnis enthält alle Quellen, die in der wissenschaftlichen Arbeit zitiert oder paraphrasiert wurden. Es ermöglicht die Nachprüfbarkeit und zeigt die wissenschaftliche Fundierung der Arbeit.</p>

      <h3>Aufbau</h3>
      <p>Das Literaturverzeichnis befindet sich am Ende der Arbeit und ist alphabetisch nach Nachnamen der Autoren geordnet.</p>

      <h3>Formatierung nach Quellentyp</h3>

      <h4>Buch (APA-Stil)</h4>
      <p>Nachname, Initialen. (Jahr). <em>Titel des Buches</em>. Verlag.</p>
      <p><strong>Beispiel:</strong> Müller, S. (2024). <em>Wissenschaftliches Schreiben</em>. Springer Verlag.</p>

      <h4>Zeitschriftenartikel</h4>
      <p>Nachname, Initialen. (Jahr). Titel des Artikels. <em>Zeitschrift</em>, <em>Band</em>(Ausgabe), Seiten.</p>
      <p><strong>Beispiel:</strong> Schmidt, M. (2023). Digitale Forschungsmethoden. <em>Zeitschrift für Pädagogik</em>, <em>45</em>(2), 123-145.</p>

      <h4>Webseite</h4>
      <p>Nachname, Initialen. (Jahr). Titel der Webseite. URL</p>
      <p><strong>Beispiel:</strong> Wagner, L. (2024). KI im Studium. https://example.com/ki-studium</p>

      <h3>Wichtige Regeln</h3>
      <ul>
        <li>Nur tatsächlich verwendete Quellen aufnehmen</li>
        <li>Einheitlicher Zitierstil durchgehend verwenden</li>
        <li>Alphabetische Sortierung nach Nachname</li>
        <li>Hängender Einzug (ab zweiter Zeile einrücken)</li>
        <li>Keine Nummerierung der Einträge</li>
      </ul>

      <h3>Automatisierung mit Ing AI</h3>
      <p>Ing AI erstellt dein Literaturverzeichnis automatisch:</p>
      <ul>
        <li>Quellen während des Schreibens hinzufügen</li>
        <li>Automatische Formatierung nach gewähltem Zitierstil</li>
        <li>Export in alle gängigen Formate</li>
        <li>Fehlerfreie Sortierung und Formatierung</li>
      </ul>
    `,
    examples: [
      'Monografie: Müller, A. (2024). Einführung in die Soziologie. Campus Verlag.',
      'Sammelband: Schmidt, B. (Hrsg.). (2023). Handbuch der Psychologie. Hogrefe.',
      'Online-Quelle: Wagner, C. (2024, 15. März). KI-Tools im Studium. Abgerufen von https://example.com',
    ],
    relatedTerms: ['zitat', 'quellenangabe', 'bibliografie'],
    category: 'zitation',
    keywords: ['Literaturverzeichnis', 'Quellenverzeichnis', 'Bibliografie', 'APA', 'Quellen'],
  },
  {
    id: 'abstract',
    term: 'Abstract',
    shortDefinition: 'Kurze, prägnante Zusammenfassung einer wissenschaftlichen Arbeit (max. 250 Wörter).',
    longDefinition: `
      <p>Ein Abstract ist eine Kurzzusammenfassung der wichtigsten Inhalte einer wissenschaftlichen Arbeit. Es ermöglicht Lesern, schnell zu erfassen, worum es in der Arbeit geht.</p>

      <h3>Umfang</h3>
      <p>Typischerweise 150-250 Wörter, je nach Vorgabe der Hochschule oder Zeitschrift.</p>

      <h3>Bestandteile</h3>
      <ol>
        <li><strong>Hintergrund/Kontext:</strong> Warum ist das Thema relevant?</li>
        <li><strong>Forschungsfrage/Zielsetzung:</strong> Was wurde untersucht?</li>
        <li><strong>Methodik:</strong> Wie wurde vorgegangen?</li>
        <li><strong>Ergebnisse:</strong> Was wurde herausgefunden?</li>
        <li><strong>Schlussfolgerung:</strong> Was bedeuten die Ergebnisse?</li>
      </ol>

      <h3>Merkmale eines guten Abstracts</h3>
      <ul>
        <li>Prägnant und auf das Wesentliche konzentriert</li>
        <li>In sich geschlossen und verständlich ohne die gesamte Arbeit zu lesen</li>
        <li>Keine Zitate oder Literaturverweise</li>
        <li>Keine Abkürzungen (außer sehr geläufige)</li>
        <li>Präsens für allgemeine Aussagen, Präteritum für durchgeführte Studien</li>
      </ul>

      <h3>Beispiel-Struktur</h3>
      <p><em>Hintergrund:</em> In den letzten Jahren hat die Digitalisierung der Hochschullehre stark zugenommen.
      <em>Forschungsfrage:</em> Diese Arbeit untersucht, wie digitale Lernplattformen die Lernerfolge von Studierenden beeinflussen.
      <em>Methodik:</em> Mittels einer quantitativen Befragung von 500 Studierenden wurde...
      <em>Ergebnisse:</em> Die Ergebnisse zeigen, dass...
      <em>Schlussfolgerung:</em> Dies deutet darauf hin, dass...</p>

      <h3>Wann wird ein Abstract benötigt?</h3>
      <ul>
        <li>Bei Bachelorarbeiten (oft optional)</li>
        <li>Bei Masterarbeiten (meist verpflichtend)</li>
        <li>Bei Dissertationen (immer)</li>
        <li>Bei wissenschaftlichen Publikationen (immer)</li>
      </ul>
    `,
    examples: [
      'Diese Studie untersucht den Einfluss von KI-Tools auf die Schreibkompetenz von Studierenden. Mittels einer Längsschnittstudie mit 300 Teilnehmern...',
    ],
    relatedTerms: ['zusammenfassung', 'einleitung', 'fazit'],
    category: 'struktur',
    keywords: ['Abstract', 'Zusammenfassung', 'Executive Summary', 'Kurzzusammenfassung'],
  },
  {
    id: 'hypothese',
    term: 'Hypothese',
    shortDefinition: 'Eine überprüfbare Annahme über einen Zusammenhang zwischen Variablen.',
    longDefinition: `
      <p>Eine Hypothese ist eine vorläufige, begründete Annahme über einen Zusammenhang, die empirisch überprüft werden kann. Sie ist zentral für empirische Forschung.</p>

      <h3>Merkmale einer guten Hypothese</h3>
      <ul>
        <li><strong>Überprüfbar:</strong> Muss empirisch getestet werden können</li>
        <li><strong>Präzise:</strong> Klar formuliert ohne Mehrdeutigkeiten</li>
        <li><strong>Widerlegbar:</strong> Es muss möglich sein, sie zu falsifizieren</li>
        <li><strong>Theoriegeleitet:</strong> Basiert auf bestehender Forschung</li>
      </ul>

      <h3>Arten von Hypothesen</h3>

      <h4>Gerichtete Hypothese</h4>
      <p>Gibt die Richtung des Zusammenhangs an:</p>
      <p><em>Beispiel:</em> "Je mehr Zeit Studierende mit Lern-Apps verbringen, desto höher ist ihre Prüfungsleistung."</p>

      <h4>Ungerichtete Hypothese</h4>
      <p>Postuliert nur einen Zusammenhang, aber keine Richtung:</p>
      <p><em>Beispiel:</em> "Es gibt einen Zusammenhang zwischen der Nutzung von Lern-Apps und der Prüfungsleistung."</p>

      <h4>Nullhypothese</h4>
      <p>Behauptet, dass kein Zusammenhang besteht:</p>
      <p><em>Beispiel:</em> "Es gibt keinen Zusammenhang zwischen der Nutzung von Lern-Apps und der Prüfungsleistung."</p>

      <h3>Formulierung</h3>
      <p>Hypothesen werden typischerweise formuliert mit:</p>
      <ul>
        <li>"Je... desto..." (für gerichtete Hypothesen)</li>
        <li>"Es gibt einen Zusammenhang zwischen... und..."</li>
        <li>"[Variable A] hat einen Einfluss auf [Variable B]"</li>
      </ul>

      <h3>Von der Forschungsfrage zur Hypothese</h3>
      <p><strong>Forschungsfrage:</strong> Wie beeinflusst die Nutzung von KI-Tools die Schreibkompetenz?</p>
      <p><strong>Hypothese:</strong> Die regelmäßige Nutzung von KI-Schreibtools führt zu einer Verbesserung der Schreibkompetenz bei Studierenden.</p>
    `,
    examples: [
      'H1: Je höher die Motivation von Studierenden, desto besser ihre Prüfungsergebnisse.',
      'H0: Es gibt keinen Unterschied in der Lernleistung zwischen Online- und Präsenzunterricht.',
    ],
    relatedTerms: ['forschungsfrage', 'variable', 'empirie'],
    category: 'methodik',
    keywords: ['Hypothese', 'Forschungshypothese', 'Nullhypothese', 'Hypothesentest'],
  },
  {
    id: 'methodik',
    term: 'Methodik',
    shortDefinition: 'Das systematische Vorgehen zur Datenerhebung und -auswertung in einer wissenschaftlichen Arbeit.',
    longDefinition: `
      <p>Die Methodik beschreibt das konkrete Vorgehen bei der Durchführung einer empirischen Studie. Sie umfasst Forschungsdesign, Datenerhebung und Datenauswertung.</p>

      <h3>Bestandteile des Methodik-Kapitels</h3>

      <h4>1. Forschungsdesign</h4>
      <ul>
        <li>Qualitativ, quantitativ oder Mixed Methods?</li>
        <li>Experimentell, quasi-experimentell oder nicht-experimentell?</li>
        <li>Querschnitt oder Längsschnitt?</li>
      </ul>

      <h4>2. Stichprobe</h4>
      <ul>
        <li>Beschreibung der Zielgruppe</li>
        <li>Stichprobengröße (n)</li>
        <li>Auswahlverfahren (Zufallsstichprobe, Convenience Sample, etc.)</li>
        <li>Ein- und Ausschlusskriterien</li>
      </ul>

      <h4>3. Datenerhebung</h4>
      <ul>
        <li>Verwendete Instrumente (Fragebogen, Interview-Leitfaden, etc.)</li>
        <li>Durchführung der Erhebung</li>
        <li>Zeitraum der Datenerhebung</li>
      </ul>

      <h4>4. Datenauswertung</h4>
      <ul>
        <li>Verwendete Software (SPSS, R, MaxQDA, etc.)</li>
        <li>Analysemethoden (statistische Tests, qualitative Inhaltsanalyse, etc.)</li>
        <li>Gütekriterien (Validität, Reliabilität, Objektivität)</li>
      </ul>

      <h3>Qualitative vs. Quantitative Methodik</h3>

      <h4>Quantitative Methodik</h4>
      <ul>
        <li>Große Stichproben</li>
        <li>Standardisierte Erhebung (Fragebögen)</li>
        <li>Statistische Auswertung</li>
        <li>Ziel: Verallgemeinerbare Aussagen</li>
      </ul>

      <h4>Qualitative Methodik</h4>
      <ul>
        <li>Kleine, gezielte Stichproben</li>
        <li>Offene Erhebung (Interviews, Beobachtungen)</li>
        <li>Interpretative Auswertung</li>
        <li>Ziel: Tiefes Verständnis</li>
      </ul>

      <h3>Wichtige Gütekriterien</h3>
      <ul>
        <li><strong>Validität:</strong> Misst die Studie, was sie messen soll?</li>
        <li><strong>Reliabilität:</strong> Sind die Ergebnisse wiederholbar?</li>
        <li><strong>Objektivität:</strong> Sind die Ergebnisse unabhängig vom Forscher?</li>
      </ul>
    `,
    examples: [
      'Quantitative Befragung von 500 Studierenden mittels Online-Fragebogen (5-stufige Likert-Skala)',
      'Qualitative Interviews mit 15 Experten, ausgewertet mittels qualitativer Inhaltsanalyse nach Mayring',
    ],
    relatedTerms: ['hypothese', 'empirie', 'forschungsdesign'],
    category: 'methodik',
    keywords: ['Methodik', 'Forschungsmethoden', 'Empirie', 'Datenerhebung', 'Datenauswertung'],
  },
]

export function getGlossarEntry(id: string): GlossarEntry | undefined {
  return glossarEntries.find((entry) => entry.id === id)
}

export function getAllGlossarEntries(): GlossarEntry[] {
  return glossarEntries
}

export function getGlossarEntriesByCategory(category: GlossarEntry['category']): GlossarEntry[] {
  return glossarEntries.filter((entry) => entry.category === category)
}
