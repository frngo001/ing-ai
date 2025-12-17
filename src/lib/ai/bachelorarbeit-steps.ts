// Schritt-Definitionen für Bachelorarbeit Agent (Phase 2)

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

