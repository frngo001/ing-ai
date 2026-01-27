export interface UseCaseData {
    slug: string
    title: string
    metaTitle: string
    metaDescription: string
    heroTitle: string
    heroDescription: string
    benefits: {
        title: string
        description: string
    }[]
    faq: {
        question: string
        answer: string
    }[]
}

export const useCases: UseCaseData[] = [
    {
        slug: 'bachelorarbeit-schreiben-lassen-ki',
        title: 'Bachelorarbeit mit KI schreiben',
        metaTitle: 'Bachelorarbeit mit KI schreiben - Der legale Guide & Tools',
        metaDescription: 'Darf man die Bachelorarbeit mit KI schreiben? Ja, als Assistent! Nutze Ing AI für Gliederung, Formulierungshilfe und Literaturrecherche. Jetzt kostenlos testen.',
        heroTitle: 'Dein KI-Copilot für die perfekte Bachelorarbeit',
        heroDescription: 'Schreibblockaden waren gestern. Ing AI hilft dir, deine Bachelorarbeit schneller, besser und mit korrekten Quellen zu schreiben. Kein Ghostwriting, sondern smarte Assistenz.',
        benefits: [
            {
                title: 'Nie wieder leere Seiten',
                description: 'Unsere KI schlägt dir wissenschaftliche Sätze vor, wenn du nicht weiterweißt.',
            },
            {
                title: 'Automatische Quellen',
                description: 'Finde passende Literatur und füge Zitationen (APA, Harvard, etc.) automatisch ein.',
            },
            {
                title: 'Perfekter roter Faden',
                description: 'Erstelle Gliederungen und Strukturen, die deinen Betreuer überzeugen.',
            },
        ],
        faq: [
            {
                question: 'Ist die Nutzung von KI für Bachelorarbeiten erlaubt?',
                answer: 'Ja, solange du die KI als Werkzeug (wie eine Rechtschreibprüfung) nutzt und nicht den gesamten Text generieren lässt. Ing AI ist darauf ausgelegt, dich zu unterstützen, nicht zu ersetzen.',
            },
            {
                question: 'Erkennt Turnitin KI-Texte?',
                answer: 'KI-Detektoren schlagen oft Alarm bei rein generierten Texten. Da du mit Ing AI aber Satz für Satz schreibst und deine eigene Note einbringst, entstehen organische, einzigartige Texte.',
            },
        ],
    },
    {
        slug: 'hausarbeit-schreiben-ki',
        title: 'Hausarbeit KI Hilfe',
        metaTitle: 'Hausarbeit mit KI schreiben - In 2 Tagen zur Bestnote?',
        metaDescription: 'Hausarbeit steht an? Ing AI ist dein Turbo. Recherche, Gliederung und Schreibhilfe in einem Tool. Stressfrei schreiben mit künstlicher Intelligenz.',
        heroTitle: 'Hausarbeiten in Rekordzeit schreiben',
        heroDescription: 'Der Abgabetermin rückt näher? Mit Ing AI recherchierst, strukturierst und schreibst du deine Hausarbeit effizienter als je zuvor.',
        benefits: [
            {
                title: 'Turbo-Recherche',
                description: 'Finde relevante Papers und Studien direkt im Editor.',
            },
            {
                title: 'Smarte Umschreibungen',
                description: 'Formuliere Sätze wissenschaftlich um, ohne den Inhalt zu verfälschen.',
            },
            {
                title: 'Plagiats-Check inklusive',
                description: 'Geh auf Nummer sicher, bevor du abgibst.',
            },
        ],
        faq: [
            {
                question: 'Kann die KI meine komplette Hausarbeit schreiben?',
                answer: 'Technisch möglich, aber akademisch nicht ratsam. Nutze Ing AI lieber, um deine Gedanken schneller zu Papier zu bringen und Argumente zu schärfen.',
            },
        ],
    },
    {
        slug: 'essay-writer-ai',
        title: 'AI Essay Writer',
        metaTitle: 'Bester AI Essay Writer (Deutsch & Englisch) - Ing AI',
        metaDescription: 'Egal ob Argumentative Essay oder wissenschaftlicher Aufsatz - Ing AI hilft dir, überzeugende Essays mit korrekten Quellen zu verfassen.',
        heroTitle: 'Der ultimative AI Essay Writer',
        heroDescription: 'Erstelle Essays, die überzeugen. Klare Argumentationsstrukturen, treffende Formulierungen und belegte Fakten.',
        benefits: [
            {
                title: 'Argumente schärfen',
                description: 'Lass dir Pro- und Contra-Argumente für dein Thema vorschlagen.',
            },
            {
                title: 'Stilsicher in jeder Sprache',
                description: 'Schreibe Essays auf Deutsch, Englisch, Spanisch und mehr.',
            },
        ],
        faq: [
            {
                question: 'Ist der Essay Writer kostenlos?',
                answer: 'Du kannst Ing AI kostenlos testen und bis zu 200 Wörter täglich generieren.',
            },
        ],
    },
]
