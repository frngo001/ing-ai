// Schritt-Definitionen für Bachelorarbeit Agent (Phase 2-5)

export type StepDefinition = {
  id: number
  title: string
  description: string
  phase: string
  checklist: string[]
  template?: string
  validation?: (data: any) => { valid: boolean; errors?: string[] }
}

export const BACHELORARBEIT_STEPS: StepDefinition[] = [
  {
    id: 4,
    title: 'Literaturrecherche',
    description: 'Umfassende Literaturrecherche durchführen und relevante Quellen sammeln',
    phase: 'Recherche und Konzeption',
    checklist: [
      'Suchbegriffe definiert',
      'Datenbanken durchsucht (Google Scholar, PubMed, etc.)',
      '30-50 relevante Quellen gesammelt',
      'Quellen kategorisiert und priorisiert',
      'Literaturliste erstellt',
    ],
    template: `# Literaturrecherche

## Suchbegriffe
- [Suchbegriff 1]
- [Suchbegriff 2]
- [Suchbegriff 3]

## Durchsuchte Datenbanken
- [Datenbank 1]
- [Datenbank 2]

## Gefundene Quellen (Top 30-50)
1. [Quelle 1]
2. [Quelle 2]
...

## Kategorisierung
- Primärquellen: [Anzahl]
- Sekundärquellen: [Anzahl]
- Theoretische Grundlagen: [Anzahl]
- Empirische Studien: [Anzahl]`,
    validation: (data) => {
      const errors: string[] = []
      if (!data.searchTerms || data.searchTerms.length < 3) {
        errors.push('Mindestens 3 Suchbegriffe erforderlich')
      }
      if (!data.sources || data.sources.length < 30) {
        errors.push('Mindestens 30 Quellen erforderlich')
      }
      return {
        valid: errors.length === 0,
        errors,
      }
    },
  },
  {
    id: 5,
    title: 'Forschungsstand analysieren',
    description: 'Den aktuellen Stand der Forschung verstehen und theoretischen Rahmen definieren',
    phase: 'Recherche und Konzeption',
    checklist: [
      'Literatur gelesen und zusammengefasst',
      'Hauptthesen und Argumente identifiziert',
      'Forschungslücken identifiziert',
      'Theoretischer Rahmen definiert',
      'Forschungsfrage präzisiert',
    ],
    template: `# Forschungsstand Analyse

## Hauptthesen und Argumente

### These 1: [Titel]
- [Beschreibung]
- [Relevante Quellen]

### These 2: [Titel]
- [Beschreibung]
- [Relevante Quellen]

## Forschungslücken
1. [Lücke 1]
2. [Lücke 2]

## Theoretischer Rahmen
[Beschreibung des theoretischen Rahmens]

## Präzisierte Forschungsfrage
[Forschungsfrage]`,
    validation: (data) => {
      const errors: string[] = []
      if (!data.mainTheses || data.mainTheses.length < 3) {
        errors.push('Mindestens 3 Hauptthesen erforderlich')
      }
      if (!data.researchGaps || data.researchGaps.length < 1) {
        errors.push('Mindestens 1 Forschungslücke erforderlich')
      }
      if (!data.researchQuestion) {
        errors.push('Forschungsfrage erforderlich')
      }
      return {
        valid: errors.length === 0,
        errors,
      }
    },
  },
  {
    id: 6,
    title: 'Methodik entwickeln',
    description: 'Wissenschaftliche Methodik festlegen und begründen',
    phase: 'Recherche und Konzeption',
    checklist: [
      'Forschungsdesign gewählt (qualitativ/quantitativ/mixed)',
      'Datenerhebungsmethoden festgelegt',
      'Analysemethoden bestimmt',
      'Ethische Aspekte geklärt',
      'Methodik begründet',
    ],
    template: `# Methodik

## Forschungsdesign
[Qualitativ/Quantitativ/Mixed Methods]

## Datenerhebungsmethoden
- [Methode 1]: [Begründung]
- [Methode 2]: [Begründung]

## Analysemethoden
- [Methode 1]: [Beschreibung]
- [Methode 2]: [Beschreibung]

## Ethische Aspekte
[Beschreibung ethischer Überlegungen]

## Begründung der Methodenwahl
[Warum wurden diese Methoden gewählt?]`,
    validation: (data) => {
      const errors: string[] = []
      if (!data.researchDesign) {
        errors.push('Forschungsdesign erforderlich')
      }
      if (!data.dataCollectionMethods || data.dataCollectionMethods.length < 1) {
        errors.push('Mindestens 1 Datenerhebungsmethode erforderlich')
      }
      if (!data.analysisMethods || data.analysisMethods.length < 1) {
        errors.push('Mindestens 1 Analysemethode erforderlich')
      }
      return {
        valid: errors.length === 0,
        errors,
      }
    },
  },
  {
    id: 7,
    title: 'Datenerhebung',
    description: 'Daten für die Forschung sammeln und dokumentieren',
    phase: 'Durchführung',
    checklist: [
      'Erhebungsinstrumente entwickelt (Fragebogen, Interview-Leitfaden, etc.)',
      'Teilnehmer/Probanden rekrutiert',
      'Daten gesammelt',
      'Daten dokumentiert',
    ],
    template: `# Datenerhebung

## Erhebungsinstrumente
- [Instrument 1]: [Beschreibung]
- [Instrument 2]: [Beschreibung]

## Teilnehmer/Probanden
- Anzahl: [Anzahl]
- Rekrutierung: [Beschreibung]
- Demografische Daten: [Beschreibung]

## Durchführung
- Zeitraum: [Von - Bis]
- Ort: [Beschreibung]
- Ablauf: [Beschreibung]

## Dokumentation
- [Dokumentationsmethode]
- [Gespeicherte Daten]`,
    validation: (data) => {
      const errors: string[] = []
      if (!data.instruments || data.instruments.length < 1) {
        errors.push('Mindestens 1 Erhebungsinstrument erforderlich')
      }
      if (!data.participants || data.participants < 1) {
        errors.push('Mindestens 1 Teilnehmer erforderlich')
      }
      return {
        valid: errors.length === 0,
        errors,
      }
    },
  },
  {
    id: 8,
    title: 'Datenanalyse',
    description: 'Daten wissenschaftlich auswerten und Ergebnisse visualisieren',
    phase: 'Durchführung',
    checklist: [
      'Daten aufbereitet',
      'Statistische/qualitative Analyse durchgeführt',
      'Ergebnisse visualisiert',
      'Interpretation vorbereitet',
    ],
    template: `# Datenanalyse

## Datenaufbereitung
- [Schritt 1]
- [Schritt 2]

## Analysemethoden
- [Methode 1]: [Beschreibung]
- [Methode 2]: [Beschreibung]

## Ergebnisse
### [Ergebnis 1]
[Beschreibung]

### [Ergebnis 2]
[Beschreibung]

## Visualisierungen
- [Visualisierung 1]
- [Visualisierung 2]

## Interpretation
[Vorläufige Interpretation der Ergebnisse]`,
    validation: (data) => {
      const errors: string[] = []
      if (!data.analysisMethods || data.analysisMethods.length < 1) {
        errors.push('Mindestens 1 Analysemethode erforderlich')
      }
      if (!data.results || data.results.length < 1) {
        errors.push('Mindestens 1 Ergebnis erforderlich')
      }
      return {
        valid: errors.length === 0,
        errors,
      }
    },
  },
  // Phase 3: Strukturierung
  {
    id: 9,
    title: 'Gliederung finalisieren',
    description: 'Finale Kapitelstruktur und Unterkapitel festlegen',
    phase: 'Strukturierung',
    checklist: [
      'Kapitelstruktur definiert',
      'Unterkapitel geplant',
      'Logischer Aufbau geprüft',
      'Abstimmung mit Forschungsfrage',
      'Gliederung vom Studenten bestätigt',
    ],
    template: `# Gliederung

## Kapitelstruktur

### Einleitung
- Problemstellung
- Forschungsfrage
- Relevanz
- Aufbau der Arbeit

### Theoretischer Teil
- [Unterkapitel 1]
- [Unterkapitel 2]
- [Unterkapitel 3]

### Methodik
- Forschungsdesign
- Datenerhebung
- Analysemethoden

### Ergebnisse
- [Ergebnis-Unterkapitel 1]
- [Ergebnis-Unterkapitel 2]

### Diskussion
- Interpretation
- Limitationen
- Implikationen

### Fazit
- Zusammenfassung
- Beantwortung der Forschungsfrage
- Ausblick`,
    validation: (data) => {
      const errors: string[] = []
      if (!data.chapters || data.chapters.length < 5) {
        errors.push('Mindestens 5 Hauptkapitel erforderlich')
      }
      if (!data.confirmed) {
        errors.push('Gliederung muss vom Studenten bestätigt werden')
      }
      return {
        valid: errors.length === 0,
        errors,
      }
    },
  },
  // Phase 4: Schreiben
  {
    id: 10,
    title: 'Einleitung schreiben',
    description: 'Einleitung mit Problemstellung, Forschungsfrage und Aufbau verfassen',
    phase: 'Schreiben',
    checklist: [
      'Problemstellung formuliert',
      'Forschungsfrage präsentiert',
      'Relevanz des Themas dargelegt',
      'Aufbau der Arbeit beschrieben',
      'Zitate eingefügt',
      'Feedback eingeholt',
    ],
    template: `# Einleitung

## Problemstellung
[Beschreibung des Problems und seiner Relevanz]

## Forschungsfrage
[Zentrale Forschungsfrage der Arbeit]

## Relevanz
[Warum ist dieses Thema wichtig?]

## Aufbau der Arbeit
[Übersicht über die Kapitelstruktur]`,
    validation: (data) => {
      const errors: string[] = []
      if (!data.problemStatement) {
        errors.push('Problemstellung erforderlich')
      }
      if (!data.researchQuestion) {
        errors.push('Forschungsfrage erforderlich')
      }
      if (!data.hasCitations) {
        errors.push('Zitate erforderlich')
      }
      return {
        valid: errors.length === 0,
        errors,
      }
    },
  },
  {
    id: 11,
    title: 'Theoretischer Teil schreiben',
    description: 'Theoretischen Rahmen, Literaturaufarbeitung und Forschungsstand verfassen',
    phase: 'Schreiben',
    checklist: [
      'Theoretischer Rahmen dargestellt',
      'Relevante Literatur aufgearbeitet',
      'Forschungsstand zusammengefasst',
      'Definitionen geklärt',
      'Zitate für jeden Absatz eingefügt',
      'Feedback eingeholt',
    ],
    template: `# Theoretischer Rahmen

## Grundlegende Konzepte
[Definitionen und Grundlagen]

## Stand der Forschung
[Aktueller Forschungsstand]

## Theoretische Grundlagen
[Relevante Theorien und Modelle]

## Forschungslücke
[Identifizierte Lücken in der bestehenden Forschung]`,
    validation: (data) => {
      const errors: string[] = []
      if (!data.theoreticalFramework) {
        errors.push('Theoretischer Rahmen erforderlich')
      }
      if (!data.literatureReview) {
        errors.push('Literaturaufarbeitung erforderlich')
      }
      if (!data.hasCitations) {
        errors.push('Zitate erforderlich')
      }
      return {
        valid: errors.length === 0,
        errors,
      }
    },
  },
  {
    id: 12,
    title: 'Methodik schreiben',
    description: 'Methodisches Vorgehen detailliert beschreiben und begründen',
    phase: 'Schreiben',
    checklist: [
      'Forschungsdesign beschrieben',
      'Methodenwahl begründet',
      'Datenerhebung erläutert',
      'Analyseverfahren dargestellt',
      'Gütekriterien adressiert',
      'Zitate eingefügt',
      'Feedback eingeholt',
    ],
    template: `# Methodik

## Forschungsdesign
[Qualitativ/Quantitativ/Mixed Methods]

## Datenerhebung
[Beschreibung der Erhebungsmethoden]

## Stichprobe
[Beschreibung der Teilnehmer/Daten]

## Analyseverfahren
[Verwendete Analysemethoden]

## Gütekriterien
[Validität, Reliabilität, etc.]`,
    validation: (data) => {
      const errors: string[] = []
      if (!data.researchDesign) {
        errors.push('Forschungsdesign erforderlich')
      }
      if (!data.dataCollection) {
        errors.push('Datenerhebung erforderlich')
      }
      if (!data.analysisMethods) {
        errors.push('Analyseverfahren erforderlich')
      }
      return {
        valid: errors.length === 0,
        errors,
      }
    },
  },
  {
    id: 13,
    title: 'Ergebnisse schreiben',
    description: 'Forschungsergebnisse deskriptiv darstellen und visualisieren',
    phase: 'Schreiben',
    checklist: [
      'Ergebnisse strukturiert dargestellt',
      'Visualisierungen erstellt (Tabellen, Grafiken)',
      'Deskriptive Statistiken präsentiert',
      'Ergebnisse objektiv beschrieben',
      'Keine Interpretation in diesem Kapitel',
      'Feedback eingeholt',
    ],
    template: `# Ergebnisse

## Übersicht
[Zusammenfassung der wichtigsten Ergebnisse]

## Detaillierte Ergebnisse

### [Ergebnis 1]
[Beschreibung]

### [Ergebnis 2]
[Beschreibung]

## Visualisierungen
[Tabellen und Grafiken]`,
    validation: (data) => {
      const errors: string[] = []
      if (!data.results || data.results.length < 1) {
        errors.push('Mindestens 1 Ergebnis erforderlich')
      }
      if (!data.visualizations) {
        errors.push('Visualisierungen empfohlen')
      }
      return {
        valid: errors.length === 0,
        errors,
      }
    },
  },
  {
    id: 14,
    title: 'Diskussion schreiben',
    description: 'Ergebnisse interpretieren, mit Literatur vergleichen und Limitationen diskutieren',
    phase: 'Schreiben',
    checklist: [
      'Ergebnisse interpretiert',
      'Bezug zur Forschungsfrage hergestellt',
      'Vergleich mit bestehender Literatur',
      'Limitationen benannt',
      'Implikationen abgeleitet',
      'Zitate eingefügt',
      'Feedback eingeholt',
    ],
    template: `# Diskussion

## Interpretation der Ergebnisse
[Bedeutung der Ergebnisse]

## Einordnung in den Forschungsstand
[Vergleich mit bestehender Literatur]

## Limitationen
[Einschränkungen der Studie]

## Implikationen
### Theoretische Implikationen
[Beitrag zur Theorie]

### Praktische Implikationen
[Anwendungsempfehlungen]`,
    validation: (data) => {
      const errors: string[] = []
      if (!data.interpretation) {
        errors.push('Interpretation erforderlich')
      }
      if (!data.limitations) {
        errors.push('Limitationen erforderlich')
      }
      if (!data.hasCitations) {
        errors.push('Zitate erforderlich')
      }
      return {
        valid: errors.length === 0,
        errors,
      }
    },
  },
  {
    id: 15,
    title: 'Fazit schreiben',
    description: 'Arbeit zusammenfassen, Forschungsfrage beantworten und Ausblick geben',
    phase: 'Schreiben',
    checklist: [
      'Zentrale Erkenntnisse zusammengefasst',
      'Forschungsfrage beantwortet',
      'Beitrag der Arbeit hervorgehoben',
      'Ausblick auf zukünftige Forschung',
      'Feedback eingeholt',
    ],
    template: `# Fazit

## Zusammenfassung
[Zentrale Erkenntnisse der Arbeit]

## Beantwortung der Forschungsfrage
[Direkte Antwort auf die Forschungsfrage]

## Beitrag der Arbeit
[Wissenschaftlicher und praktischer Beitrag]

## Ausblick
[Empfehlungen für zukünftige Forschung]`,
    validation: (data) => {
      const errors: string[] = []
      if (!data.summary) {
        errors.push('Zusammenfassung erforderlich')
      }
      if (!data.answerToResearchQuestion) {
        errors.push('Beantwortung der Forschungsfrage erforderlich')
      }
      return {
        valid: errors.length === 0,
        errors,
      }
    },
  },
  // Phase 5: Finalisierung
  {
    id: 16,
    title: 'Überarbeitung',
    description: 'Text auf roten Faden, Argumentationslogik und Verständlichkeit prüfen',
    phase: 'Finalisierung',
    checklist: [
      'Roter Faden geprüft',
      'Argumentationslogik überprüft',
      'Verständlichkeit verbessert',
      'Übergänge zwischen Kapiteln geprüft',
      'Konsistenz der Terminologie',
      'Feedback eingeholt',
    ],
    template: `# Überarbeitungs-Checkliste

## Struktur
- [ ] Roter Faden erkennbar
- [ ] Logischer Aufbau
- [ ] Sinnvolle Übergänge

## Argumentation
- [ ] Schlüssige Argumentation
- [ ] Keine Widersprüche
- [ ] Behauptungen belegt

## Verständlichkeit
- [ ] Klare Sprache
- [ ] Fachbegriffe erklärt
- [ ] Konsistente Terminologie`,
    validation: (data) => {
      const errors: string[] = []
      if (!data.structureReviewed) {
        errors.push('Struktur-Review erforderlich')
      }
      if (!data.argumentationReviewed) {
        errors.push('Argumentations-Review erforderlich')
      }
      return {
        valid: errors.length === 0,
        errors,
      }
    },
  },
  {
    id: 17,
    title: 'Korrektur',
    description: 'Rechtschreibung, Grammatik und Zeichensetzung prüfen und korrigieren',
    phase: 'Finalisierung',
    checklist: [
      'Rechtschreibung geprüft',
      'Grammatik korrigiert',
      'Zeichensetzung überprüft',
      'Stilistische Verbesserungen',
      'Einheitliche Formatierung',
    ],
    template: `# Korrektur-Checkliste

## Orthographie
- [ ] Rechtschreibung geprüft
- [ ] Tippfehler korrigiert
- [ ] Eigennamen überprüft

## Grammatik
- [ ] Satzbau geprüft
- [ ] Kongruenz überprüft
- [ ] Tempus konsistent

## Zeichensetzung
- [ ] Kommasetzung
- [ ] Anführungszeichen
- [ ] Sonderzeichen`,
    validation: (data) => {
      const errors: string[] = []
      if (!data.spellingChecked) {
        errors.push('Rechtschreibprüfung erforderlich')
      }
      if (!data.grammarChecked) {
        errors.push('Grammatikprüfung erforderlich')
      }
      return {
        valid: errors.length === 0,
        errors,
      }
    },
  },
  {
    id: 18,
    title: 'Zitierweise prüfen',
    description: 'Korrekte Zitation und Literaturverzeichnis überprüfen',
    phase: 'Finalisierung',
    checklist: [
      'Zitierweise einheitlich (APA, Harvard, etc.)',
      'Alle Quellen im Text zitiert',
      'Literaturverzeichnis vollständig',
      'Formatierung der Quellenangaben',
      'Keine Plagiate',
    ],
    template: `# Zitierweise-Checkliste

## Im-Text-Zitate
- [ ] Einheitlicher Zitierstil
- [ ] Direkte Zitate gekennzeichnet
- [ ] Indirekte Zitate korrekt

## Literaturverzeichnis
- [ ] Alle Quellen aufgeführt
- [ ] Alphabetisch sortiert
- [ ] Formatierung einheitlich
- [ ] DOIs/URLs vorhanden`,
    validation: (data) => {
      const errors: string[] = []
      if (!data.citationStyleConsistent) {
        errors.push('Einheitliche Zitierweise erforderlich')
      }
      if (!data.bibliographyComplete) {
        errors.push('Vollständiges Literaturverzeichnis erforderlich')
      }
      return {
        valid: errors.length === 0,
        errors,
      }
    },
  },
  {
    id: 19,
    title: 'Formatierung',
    description: 'Formale Anforderungen wie Seitenränder, Schrift und Layout prüfen',
    phase: 'Finalisierung',
    checklist: [
      'Seitenränder korrekt',
      'Schriftart und -größe einheitlich',
      'Zeilenabstand korrekt',
      'Seitenzahlen vorhanden',
      'Kopf-/Fußzeilen formatiert',
      'Abbildungen und Tabellen beschriftet',
    ],
    template: `# Formatierungs-Checkliste

## Seitenlayout
- [ ] Seitenränder: [links/rechts/oben/unten]
- [ ] Seitenzahlen positioniert
- [ ] Kopf-/Fußzeilen

## Textformatierung
- [ ] Schriftart: [z.B. Times New Roman]
- [ ] Schriftgröße: [z.B. 12pt]
- [ ] Zeilenabstand: [z.B. 1,5]

## Verzeichnisse
- [ ] Inhaltsverzeichnis
- [ ] Abbildungsverzeichnis
- [ ] Tabellenverzeichnis
- [ ] Abkürzungsverzeichnis`,
    validation: (data) => {
      const errors: string[] = []
      if (!data.layoutChecked) {
        errors.push('Layout-Prüfung erforderlich')
      }
      if (!data.tableOfContents) {
        errors.push('Inhaltsverzeichnis erforderlich')
      }
      return {
        valid: errors.length === 0,
        errors,
      }
    },
  },
  {
    id: 20,
    title: 'Finale Prüfung',
    description: 'Letzte Kontrolle vor der Abgabe mit umfassender Checkliste',
    phase: 'Finalisierung',
    checklist: [
      'Alle Kapitel vollständig',
      'Abstract/Zusammenfassung geschrieben',
      'Titelblatt korrekt',
      'Eidesstattliche Erklärung vorhanden',
      'Alle Anhänge beigefügt',
      'PDF-Export geprüft',
    ],
    template: `# Finale Prüfungs-Checkliste

## Pflichtbestandteile
- [ ] Titelblatt
- [ ] Abstract/Zusammenfassung
- [ ] Inhaltsverzeichnis
- [ ] Haupttext komplett
- [ ] Literaturverzeichnis
- [ ] Eidesstattliche Erklärung

## Optionale Bestandteile
- [ ] Danksagung
- [ ] Anhänge
- [ ] Glossar

## Export
- [ ] PDF erstellt
- [ ] Formatierung im PDF korrekt
- [ ] Hyperlinks funktionieren`,
    validation: (data) => {
      const errors: string[] = []
      if (!data.allChaptersComplete) {
        errors.push('Alle Kapitel müssen vollständig sein')
      }
      if (!data.abstractWritten) {
        errors.push('Abstract erforderlich')
      }
      if (!data.declaration) {
        errors.push('Eidesstattliche Erklärung erforderlich')
      }
      return {
        valid: errors.length === 0,
        errors,
      }
    },
  },
  {
    id: 21,
    title: 'Abgabe',
    description: 'Arbeit abgeben und Prozess abschließen',
    phase: 'Finalisierung',
    checklist: [
      'Alle Anforderungen erfüllt',
      'Frist eingehalten',
      'Arbeit eingereicht',
      'Bestätigung erhalten',
    ],
    template: `# Abgabe

## Vor der Abgabe
- [ ] Letzte Durchsicht
- [ ] Backup erstellt
- [ ] Alle Dateien zusammen

## Abgabe
- [ ] Fristgerecht eingereicht
- [ ] Alle Exemplare abgegeben
- [ ] Digitale Version hochgeladen

## Nach der Abgabe
- [ ] Bestätigung erhalten
- [ ] Dokumentation archiviert

🎉 Herzlichen Glückwunsch zur fertigen Arbeit!`,
    validation: (data) => {
      const errors: string[] = []
      if (!data.submitted) {
        errors.push('Arbeit muss eingereicht werden')
      }
      return {
        valid: errors.length === 0,
        errors,
      }
    },
  },
]

export function getStepById(id: number): StepDefinition | undefined {
  return BACHELORARBEIT_STEPS.find((step) => step.id === id)
}

export function getNextStep(currentStep: number): StepDefinition | null {
  const current = getStepById(currentStep)
  if (!current) return null
  
  const currentIndex = BACHELORARBEIT_STEPS.findIndex((s) => s.id === currentStep)
  if (currentIndex === -1 || currentIndex === BACHELORARBEIT_STEPS.length - 1) {
    return null
  }
  
  return BACHELORARBEIT_STEPS[currentIndex + 1]
}

export function getPreviousStep(currentStep: number): StepDefinition | null {
  const currentIndex = BACHELORARBEIT_STEPS.findIndex((s) => s.id === currentStep)
  if (currentIndex <= 0) return null
  
  return BACHELORARBEIT_STEPS[currentIndex - 1]
}

