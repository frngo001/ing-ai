export interface CompetitorData {
    slug: string
    name: string
    metaTitle: string
    metaDescription: string
    pros: string[]
    cons: string[]
    features: {
        citation: boolean
        aiWriting: boolean
        plagiarism: boolean
        multilingual: boolean
        pdfChat: boolean
    }
    verdict: string
}

export const competitors: CompetitorData[] = [
    {
        slug: 'quillbot',
        name: 'QuillBot',
        metaTitle: 'Ing AI vs QuillBot - Der bessere KI-Schreibassistent für Akademiker',
        metaDescription: 'Warum Ing AI die bessere QuillBot Alternative für wissenschaftliches Arbeiten ist. Vergleich von Zitationen, Ghostwriter-Funktionen und Plagiatsprüfung.',
        pros: ['Gute Paraphrasierung', 'Einfache Bedienung', 'Kostenlose Basisversion'],
        cons: ['Keine echten akademischen Zitationen', 'Begrenzte Wortanzahl', 'Fokus auf Umschreiben statt Schreiben'],
        features: {
            citation: false,
            aiWriting: true,
            plagiarism: true,
            multilingual: true,
            pdfChat: false,
        },
        verdict: 'QuillBot ist toll zum Umschreiben, aber Ing AI ist der Spezialist für echte akademische Arbeiten mit korrekten Quellenangaben.',
    },
    {
        slug: 'paperpal',
        name: 'Paperpal',
        metaTitle: 'Ing AI vs Paperpal - Vergleich der akademischen KI-Tools',
        metaDescription: 'Ing AI oder Paperpal? Wir vergleichen Features, Preise und Eignung für Bachelor- und Masterarbeiten. Finde heraus, welches Tool besser zu dir passt.',
        pros: ['Starker Fokus auf wissenschaftliche Sprache', 'Gute Grammatikprüfung', 'Journal-Submission-Checks'],
        cons: ['Teuer', 'Weniger generative Schreibfunktionen', 'Kompliziertere Oberfläche'],
        features: {
            citation: true,
            aiWriting: false,
            plagiarism: true,
            multilingual: true,
            pdfChat: false,
        },
        verdict: 'Paperpal ist stark bei der Korrektur fertiger englischer Paper. Ing AI hilft dir jedoch beim aktiven Schreibprozess von Anfang an.',
    },
    {
        slug: 'jenni-ai',
        name: 'Jenni AI',
        metaTitle: 'Ing AI - Die beste deutsche Alternative zu Jenni AI',
        metaDescription: 'Suchst du eine deutsche Alternative zu Jenni AI? Ing AI bietet dieselben leistungsstarken Features, optimiert für den deutschsprachigen akademischen Raum.',
        pros: ['Guter Autocomplete', 'Zitierfunktion', 'PDF Chat'],
        cons: ['Fokus primär auf Englisch', 'Teures Abo-Modell', 'US-Datenschutz'],
        features: {
            citation: true,
            aiWriting: true,
            plagiarism: true,
            multilingual: true,
            pdfChat: true,
        },
        verdict: 'Ing AI bietet die gleiche Power wie Jenni AI, aber mit besserer Unterstützung für deutsche Texte und europäischen Datenschutzstandards.',
    },
]
