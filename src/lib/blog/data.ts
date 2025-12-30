export interface BlogAuthor {
  name: string
  title: string
  education: string
  linkedin: string
  image: string
}

export interface BlogPost {
  id: string
  title: string
  date: string // ISO date string (YYYY-MM-DD) or Date object
  author: BlogAuthor
  excerpt: string
  content: string
}

/**
 * Formatiert ein Datum basierend auf der angegebenen Sprache
 */
export function formatBlogDate(date: string | Date, locale: string = 'de'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  // Sprach-Mapping für Intl.DateTimeFormat
  const localeMap: Record<string, string> = {
    'en': 'en-US',
    'es': 'es-ES',
    'fr': 'fr-FR',
    'de': 'de-DE',
  }
  
  const intlLocale = localeMap[locale] || localeMap['de']
  
  return new Intl.DateTimeFormat(intlLocale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(dateObj)
}

export const blogPosts: BlogPost[] = [
  {
    id: "ki-gestuetztes-wissenschaftliches-schreiben",
    title: "KI-gestütztes wissenschaftliches Schreiben: Eine umfassende Anleitung",
    date: "2024-12-15",
    author: {
      name: "Dr. Sarah Müller",
      title: "Senior Research Scientist",
      education: "Promoviert in Informatik, Abschluss in Künstlicher Intelligenz",
      linkedin: "https://linkedin.com/in/sarah-mueller",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face"
    },
    excerpt: "Entdecken Sie, wie KI-Tools das wissenschaftliche Schreiben revolutionieren und Ihnen helfen, bessere Arbeiten in kürzerer Zeit zu erstellen.",
    content: `
      <h2 id="einfuehrung">Einführung</h2>
      <p>Das wissenschaftliche Schreiben hat sich in den letzten Jahren erheblich weiterentwickelt. Mit der Einführung von KI-gestützten Tools können Forscher und Studierende heute effizienter arbeiten und gleichzeitig die Qualität ihrer Arbeiten verbessern.</p>
      
      <h2 id="was-ist-ki-gestuetztes-schreiben">Was ist KI-gestütztes Schreiben?</h2>
      <p>KI-gestütztes Schreiben bezieht sich auf die Verwendung von künstlicher Intelligenz, um Autoren beim Erstellen, Bearbeiten und Verbessern von Texten zu unterstützen. Diese Tools nutzen fortschrittliche Sprachmodelle, um kontextbezogene Vorschläge zu machen, Grammatik zu korrigieren und sogar den Schreibstil zu optimieren.</p>
      
      <h3 id="vorteile-von-ki-tools">Vorteile von KI-Tools</h3>
      <p>Die Verwendung von KI-Tools im wissenschaftlichen Schreiben bietet zahlreiche Vorteile:</p>
      <ul>
        <li><strong>Zeitersparnis:</strong> Automatisierung repetitiver Aufgaben wie Formatierung und Zitationen</li>
        <li><strong>Qualitätsverbesserung:</strong> Konsistente Grammatik und Rechtschreibung</li>
        <li><strong>Kontextverständnis:</strong> Intelligente Vorschläge basierend auf dem gesamten Dokument</li>
        <li><strong>Mehrsprachigkeit:</strong> Unterstützung für verschiedene Sprachen und Fachterminologie</li>
      </ul>
      
      <h2 id="praktische-anwendung">Praktische Anwendung</h2>
      <p>In der Praxis können KI-Tools in verschiedenen Phasen des Schreibprozesses eingesetzt werden:</p>
      
      <h3 id="recherche-phase">Recherche-Phase</h3>
      <p>Während der Recherche helfen KI-Tools dabei, relevante Quellen zu finden, Zusammenfassungen zu erstellen und wichtige Informationen zu extrahieren. Tools wie Jenni AI können direkt mit PDFs arbeiten und Fragen zu Ihren Forschungsquellen beantworten.</p>
      
      <h3 id="schreib-phase">Schreib-Phase</h3>
      <p>Während des Schreibens bieten KI-Tools intelligente Autocomplete-Funktionen, die den Kontext Ihres gesamten Dokuments verstehen. Dies führt zu präziseren Vorschlägen, die zu Ihrem Schreibstil und Fachgebiet passen.</p>
      
      <h3 id="bearbeitungs-phase">Bearbeitungs-Phase</h3>
      <p>In der Bearbeitungsphase können KI-Tools bei der Grammatikprüfung, Stiloptimierung und Plagiatsprüfung helfen. Sie können auch Vorschläge zur Verbesserung der Klarheit und Kohärenz machen.</p>
      
      <h2 id="zitationen-und-quellen">Zitationen und Quellen</h2>
      <p>Einer der wichtigsten Aspekte des wissenschaftlichen Schreibens ist die korrekte Zitierung von Quellen. KI-Tools können dabei helfen, Zitationen automatisch zu formatieren und verschiedene Zitationsstile zu unterstützen.</p>
      
      <h3 id="unterstuetzte-zitationsstile">Unterstützte Zitationsstile</h3>
      <p>Moderne KI-Tools unterstützen eine Vielzahl von Zitationsstilen, darunter:</p>
      <ul>
        <li>APA (American Psychological Association)</li>
        <li>MLA (Modern Language Association)</li>
        <li>Chicago/Turabian</li>
        <li>IEEE (Institute of Electrical and Electronics Engineers)</li>
        <li>Vancouver</li>
        <li>Und viele weitere...</li>
      </ul>
      
      <h2 id="best-practices">Best Practices</h2>
      <p>Um das Beste aus KI-gestützten Schreibtools herauszuholen, sollten Sie folgende Best Practices befolgen:</p>
      
      <h3 id="ki-als-assistent">KI als Assistent nutzen</h3>
      <p>Denken Sie an KI-Tools als Assistenten, nicht als Ersatz für Ihre eigene Arbeit. Die KI sollte Ihre Kreativität und Ihr Fachwissen ergänzen, nicht ersetzen.</p>
      
      <h3 id="qualitaetskontrolle">Qualitätskontrolle</h3>
      <p>Überprüfen Sie immer die Vorschläge der KI kritisch. Stellen Sie sicher, dass die Inhalte korrekt sind und zu Ihrem Kontext passen.</p>
      
      <h3 id="datenschutz">Datenschutz beachten</h3>
      <p>Achten Sie darauf, dass die von Ihnen verwendeten Tools Ihre Daten sicher behandeln, besonders bei sensiblen Forschungsdaten.</p>
      
      <h2 id="zukunft-des-ki-schreibens">Zukunft des KI-gestützten Schreibens</h2>
      <p>Die Zukunft des KI-gestützten Schreibens sieht vielversprechend aus. Wir können erwarten, dass die Tools noch intelligenter werden, besser kontextbezogene Vorschläge machen und nahtloser in den Schreibprozess integriert werden.</p>
      
      <h3 id="entwicklungen">Kommende Entwicklungen</h3>
      <p>Zu den erwarteten Entwicklungen gehören:</p>
      <ul>
        <li>Noch besseres Kontextverständnis über mehrere Dokumente hinweg</li>
        <li>Verbesserte Unterstützung für spezialisierte Fachgebiete</li>
        <li>Echtzeit-Kollaboration mit KI-Unterstützung</li>
        <li>Erweiterte Visualisierungs- und Analysefunktionen</li>
      </ul>
      
      <h2 id="fazit">Fazit</h2>
      <p>KI-gestütztes wissenschaftliches Schreiben ist keine Zukunftsvision mehr – es ist bereits Realität. Tools wie Jenni AI helfen Forschern und Studierenden dabei, bessere Arbeiten effizienter zu erstellen. Durch die richtige Nutzung dieser Tools können Sie Ihre Produktivität steigern und gleichzeitig die Qualität Ihrer wissenschaftlichen Arbeiten verbessern.</p>
    `
  },
  {
    id: "zitationsstile-verstehen",
    title: "Zitationsstile verstehen: Ein Leitfaden für wissenschaftliches Schreiben",
    date: "2024-12-10",
    author: {
      name: "Prof. Dr. Michael Weber",
      title: "Professor für Wissenschaftskommunikation",
      education: "Promoviert in Linguistik, Habilitation in Wissenschaftskommunikation",
      linkedin: "https://linkedin.com/in/michael-weber",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
    },
    excerpt: "Lernen Sie die wichtigsten Zitationsstile kennen und wählen Sie den richtigen für Ihre wissenschaftliche Arbeit.",
    content: `
      <h2 id="einfuehrung">Einführung</h2>
      <p>Die korrekte Zitierung von Quellen ist ein fundamentaler Aspekt des wissenschaftlichen Schreibens. Verschiedene Disziplinen verwenden unterschiedliche Zitationsstile, und die Wahl des richtigen Stils kann den Unterschied zwischen einer akzeptierten und einer abgelehnten Arbeit ausmachen.</p>
      
      <h2 id="warum-zitationen-wichtig-sind">Warum Zitationen wichtig sind</h2>
      <p>Zitationen dienen mehreren wichtigen Zwecken in der wissenschaftlichen Kommunikation:</p>
      <ul>
        <li>Anerkennung der Arbeit anderer Forscher</li>
        <li>Nachweis der Recherche und des Verständnisses des Fachgebiets</li>
        <li>Ermöglichung der Nachprüfbarkeit</li>
        <li>Vermeidung von Plagiaten</li>
      </ul>
      
      <h2 id="hauptzitationsstile">Hauptzitationsstile</h2>
      <p>Es gibt zahlreiche Zitationsstile, aber einige sind besonders weit verbreitet:</p>
      
      <h3 id="apa-style">APA Style</h3>
      <p>Der APA-Stil wird hauptsächlich in den Sozialwissenschaften verwendet. Er betont das Datum der Veröffentlichung und verwendet ein Autor-Jahr-System.</p>
      
      <h3 id="mla-style">MLA Style</h3>
      <p>Der MLA-Stil ist in den Geisteswissenschaften weit verbreitet. Er verwendet ein einfaches Autor-Seitenzahl-System.</p>
      
      <h3 id="chicago-style">Chicago Style</h3>
      <p>Der Chicago-Stil bietet zwei Varianten: Notes-Bibliography und Author-Date. Er wird häufig in den Geisteswissenschaften und in der Geschichtswissenschaft verwendet.</p>
    `
  },
  {
    id: "ultimativer-guide-bachelorarbeit",
    title: "Der ultimative Guide für die Bachelorarbeit",
    date: "2024-12-08",
    author: {
      name: "Dr. Anna Schmidt",
      title: "Akademische Beraterin",
      education: "Promoviert in Pädagogik, Spezialisierung auf akademisches Schreiben",
      linkedin: "https://linkedin.com/in/anna-schmidt",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face"
    },
    excerpt: "Schritt für Schritt zur perfekten Abschlussarbeit mit Struktur und Plan.",
    content: `
      <h2 id="einfuehrung">Einführung</h2>
      <p>Die Bachelorarbeit ist für viele Studierende die erste umfangreiche wissenschaftliche Arbeit. Mit der richtigen Planung und Struktur kann dieser Meilenstein erfolgreich gemeistert werden.</p>
      
      <h2 id="planung-und-struktur">Planung und Struktur</h2>
      <p>Eine gute Planung ist der Grundstein für eine erfolgreiche Bachelorarbeit. Beginnen Sie frühzeitig mit der Themenfindung und erstellen Sie einen realistischen Zeitplan.</p>
      
      <h3 id="themenfindung">Themenfindung</h3>
      <p>Wählen Sie ein Thema, das Sie wirklich interessiert und das zu Ihrem Studienfach passt. Ein gutes Thema ist spezifisch genug, um in der vorgegebenen Zeit bearbeitet werden zu können, aber breit genug, um relevante Literatur zu finden.</p>
      
      <h3 id="zeitplanung">Zeitplanung</h3>
      <p>Erstellen Sie einen detaillierten Zeitplan mit Meilensteinen. Planen Sie ausreichend Zeit für Recherche, Schreiben, Überarbeitung und Formatierung ein.</p>
      
      <h2 id="struktur-der-arbeit">Struktur der Arbeit</h2>
      <p>Eine klare Struktur hilft sowohl Ihnen beim Schreiben als auch den Lesern beim Verstehen Ihrer Arbeit.</p>
      
      <h3 id="deckblatt-und-inhaltsverzeichnis">Deckblatt und Inhaltsverzeichnis</h3>
      <p>Das Deckblatt sollte alle wichtigen Informationen enthalten: Titel, Ihren Namen, den Namen des Betreuers, das Datum und die Hochschule.</p>
      
      <h3 id="einleitung">Einleitung</h3>
      <p>Die Einleitung sollte das Thema vorstellen, die Forschungsfrage formulieren und die Relevanz der Arbeit darlegen.</p>
      
      <h3 id="hauptteil">Hauptteil</h3>
      <p>Der Hauptteil enthält Ihre Argumentation, Analyse und Diskussion. Strukturieren Sie ihn logisch und nachvollziehbar.</p>
      
      <h3 id="fazit">Fazit</h3>
      <p>Im Fazit fassen Sie Ihre wichtigsten Erkenntnisse zusammen und geben einen Ausblick auf mögliche weitere Forschung.</p>
      
      <h2 id="tipps-zum-schreiben">Tipps zum Schreiben</h2>
      <p>Schreiben Sie regelmäßig, auch wenn es nur kleine Abschnitte sind. Nutzen Sie Tools wie Jenni AI, um Ihre Produktivität zu steigern und die Qualität zu verbessern.</p>
    `
  },
  {
    id: "ki-im-studium",
    title: "KI im Studium",
    date: "2024-12-05",
    author: {
      name: "Dr. Thomas Klein",
      title: "Bildungstechnologe",
      education: "Promoviert in Informatik, Spezialisierung auf KI in der Bildung",
      linkedin: "https://linkedin.com/in/thomas-klein",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
    },
    excerpt: "Wie du Künstliche Intelligenz ethisch und effektiv nutzt.",
    content: `
      <h2 id="einfuehrung">Einführung</h2>
      <p>Künstliche Intelligenz wird zunehmend zu einem wichtigen Werkzeug im Studium. Doch wie kann man KI ethisch und effektiv nutzen, ohne die akademische Integrität zu gefährden?</p>
      
      <h2 id="ethische-nutzung-von-ki">Ethische Nutzung von KI</h2>
      <p>Die ethische Nutzung von KI im akademischen Kontext erfordert Transparenz und Verantwortung. KI sollte als Hilfsmittel dienen, nicht als Ersatz für eigenständiges Denken.</p>
      
      <h3 id="transparenz">Transparenz</h3>
      <p>Wenn Sie KI-Tools verwenden, sollten Sie dies transparent machen. Informieren Sie Ihre Betreuer über die Nutzung von KI-Assistenten.</p>
      
      <h3 id="eigenstaendigkeit">Eigenständigkeit</h3>
      <p>KI sollte Ihre Arbeit unterstützen, nicht ersetzen. Verwenden Sie KI für Recherche, Strukturierung und Verbesserung, aber nicht für das vollständige Verfassen von Texten.</p>
      
      <h2 id="praktische-anwendungen">Praktische Anwendungen</h2>
      <p>KI kann in verschiedenen Bereichen des Studiums hilfreich sein:</p>
      
      <h3 id="recherche">Recherche</h3>
      <p>KI-Tools können bei der Literaturrecherche helfen, relevante Quellen finden und Zusammenfassungen erstellen.</p>
      
      <h3 id="strukturierung">Strukturierung</h3>
      <p>Nutzen Sie KI, um Ihre Gedanken zu strukturieren und Gliederungen zu erstellen.</p>
      
      <h3 id="verbesserung">Verbesserung</h3>
      <p>KI kann bei der Grammatikprüfung, Stilverbesserung und Klarheit helfen.</p>
      
      <h2 id="grenzen-der-ki">Grenzen der KI</h2>
      <p>Es ist wichtig, die Grenzen von KI zu verstehen. KI kann keine kritische Analyse ersetzen und sollte nicht für die Entwicklung eigener Argumente verwendet werden.</p>
    `
  },
  {
    id: "zitieren-leicht-gemacht",
    title: "Zitieren leicht gemacht",
    date: "2024-12-03",
    author: {
      name: "Prof. Dr. Michael Weber",
      title: "Professor für Wissenschaftskommunikation",
      education: "Promoviert in Linguistik, Habilitation in Wissenschaftskommunikation",
      linkedin: "https://linkedin.com/in/michael-weber",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
    },
    excerpt: "APA, MLA, Harvard – Die wichtigsten Zitationsstile im Überblick.",
    content: `
      <h2 id="einfuehrung">Einführung</h2>
      <p>Die korrekte Zitierung ist essentiell für jede wissenschaftliche Arbeit. Dieser Guide gibt Ihnen einen Überblick über die wichtigsten Zitationsstile und wie Sie sie anwenden.</p>
      
      <h2 id="apa-american-psychological-association">APA (American Psychological Association)</h2>
      <p>Der APA-Stil wird hauptsächlich in den Sozialwissenschaften, Psychologie und Erziehungswissenschaften verwendet.</p>
      
      <h3 id="apa-beispiele">APA-Beispiele</h3>
      <p>Im Text: (Müller, 2024) oder Müller (2024) argumentiert...</p>
      <p>Im Literaturverzeichnis: Müller, S. (2024). Titel des Buches. Verlag.</p>
      
      <h2 id="mla-modern-language-association">MLA (Modern Language Association)</h2>
      <p>Der MLA-Stil ist in den Geisteswissenschaften, besonders in Literaturwissenschaften, weit verbreitet.</p>
      
      <h3 id="mla-beispiele">MLA-Beispiele</h3>
      <p>Im Text: (Müller 45) oder Müller argumentiert, dass "..." (45).</p>
      <p>Im Literaturverzeichnis: Müller, Sarah. Titel des Buches. Verlag, 2024.</p>
      
      <h2 id="harvard-style">Harvard Style</h2>
      <p>Der Harvard-Stil ist besonders in Großbritannien und Australien verbreitet und wird in vielen Disziplinen verwendet.</p>
      
      <h3 id="harvard-beispiele">Harvard-Beispiele</h3>
      <p>Im Text: (Müller 2024) oder Müller (2024) stellt fest...</p>
      <p>Im Literaturverzeichnis: Müller, S 2024, Titel des Buches, Verlag, Ort.</p>
      
      <h2 id="automatisierung-mit-ki">Automatisierung mit KI</h2>
      <p>Moderne KI-Tools wie Jenni AI können Ihnen dabei helfen, Zitationen automatisch zu formatieren und Fehler zu vermeiden.</p>
    `
  },
  {
    id: "schreibblockaden-ueberwinden",
    title: "Schreibblockaden überwinden",
    date: "2024-12-01",
    author: {
      name: "Dr. Lisa Wagner",
      title: "Schreibcoach und Psychologin",
      education: "Promoviert in Psychologie, Spezialisierung auf akademisches Schreiben",
      linkedin: "https://linkedin.com/in/lisa-wagner",
      image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face"
    },
    excerpt: "Praktische Tipps und Techniken, um den Flow wiederzufinden.",
    content: `
      <h2 id="einfuehrung">Einführung</h2>
      <p>Schreibblockaden sind ein häufiges Problem beim wissenschaftlichen Schreiben. Fast jeder Studierende und Forscher kennt das Gefühl, vor einem leeren Blatt zu sitzen und nicht zu wissen, wie man anfangen soll.</p>
      
      <h2 id="ursachen-von-schreibblockaden">Ursachen von Schreibblockaden</h2>
      <p>Schreibblockaden können verschiedene Ursachen haben:</p>
      <ul>
        <li>Perfektionismus und zu hohe Erwartungen</li>
        <li>Angst vor Kritik oder Ablehnung</li>
        <li>Mangelnde Struktur oder Planung</li>
        <li>Überforderung durch die Komplexität des Themas</li>
        <li>Prokrastination und Aufschieben</li>
      </ul>
      
      <h2 id="strategien-zum-ueberwinden">Strategien zum Überwinden</h2>
      <p>Es gibt verschiedene bewährte Strategien, um Schreibblockaden zu überwinden:</p>
      
      <h3 id="freewriting">Freewriting</h3>
      <p>Schreiben Sie einfach drauflos, ohne sich Gedanken über Grammatik oder Struktur zu machen. Das Ziel ist es, den Schreibfluss in Gang zu bringen.</p>
      
      <h3 id="kleine-schritte">Kleine Schritte</h3>
      <p>Teilen Sie große Aufgaben in kleine, überschaubare Schritte auf. Anstatt "Bachelorarbeit schreiben" denken Sie "Einleitung für Abschnitt 2 schreiben".</p>
      
      <h3 id="zeitlimits">Zeitlimits setzen</h3>
      <p>Setzen Sie sich realistische Zeitlimits. Die Pomodoro-Technik (25 Minuten Schreiben, 5 Minuten Pause) kann sehr effektiv sein.</p>
      
      <h3 id="ki-als-unterstuetzung">KI als Unterstützung</h3>
      <p>Nutzen Sie KI-Tools wie Jenni AI, um den Einstieg zu finden. KI kann Ihnen helfen, erste Ideen zu entwickeln und Strukturen zu erstellen.</p>
      
      <h2 id="praktische-uebungen">Praktische Übungen</h2>
      <p>Regelmäßige Schreibübungen können helfen, Schreibblockaden zu vermeiden. Schreiben Sie täglich, auch wenn es nur ein paar Sätze sind.</p>
    `
  },
  {
    id: "plagiatspruefung",
    title: "Plagiatsprüfung",
    date: "2024-11-28",
    author: {
      name: "Dr. Julia Becker",
      title: "Akademische Integritätsbeauftragte",
      education: "Promoviert in Rechtswissenschaften, Spezialisierung auf Urheberrecht",
      linkedin: "https://linkedin.com/in/julia-becker",
      image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=face"
    },
    excerpt: "Warum sie wichtig ist und wie sie funktioniert.",
    content: `
      <h2 id="einfuehrung">Einführung</h2>
      <p>Plagiatsprüfung ist ein wichtiger Aspekt des wissenschaftlichen Schreibens. Sie schützt nicht nur vor unbeabsichtigtem Plagiat, sondern hilft auch, die Qualität Ihrer Arbeit zu verbessern.</p>
      
      <h2 id="was-ist-ein-plagiat">Was ist ein Plagiat?</h2>
      <p>Ein Plagiat liegt vor, wenn fremde Gedanken, Texte oder Ideen ohne entsprechende Quellenangabe übernommen werden. Dies kann absichtlich oder unbeabsichtigt geschehen.</p>
      
      <h2 id="warum-plagiatspruefung-wichtig-ist">Warum Plagiatsprüfung wichtig ist</h2>
      <p>Plagiatsprüfung ist aus mehreren Gründen wichtig:</p>
      <ul>
        <li>Schutz vor unbeabsichtigtem Plagiat</li>
        <li>Wahrung der akademischen Integrität</li>
        <li>Verbesserung der Qualität durch korrekte Zitationen</li>
        <li>Vermeidung von Konsequenzen wie Nichtbestehen oder Exmatrikulation</li>
      </ul>
      
      <h2 id="wie-plagiatspruefung-funktioniert">Wie Plagiatsprüfung funktioniert</h2>
      <p>Moderne Plagiatsprüfungs-Tools vergleichen Ihren Text mit einer großen Datenbank von Quellen, um Übereinstimmungen zu finden.</p>
      
      <h3 id="automatische-pruefung">Automatische Prüfung</h3>
      <p>KI-gestützte Tools können Ihren Text automatisch auf Plagiate prüfen und Ihnen zeigen, welche Passagen möglicherweise problematisch sind.</p>
      
      <h3 id="manuelle-ueberpruefung">Manuelle Überprüfung</h3>
      <p>Zusätzlich zur automatischen Prüfung sollten Sie Ihre Arbeit auch manuell überprüfen, um sicherzustellen, dass alle Quellen korrekt zitiert sind.</p>
      
      <h2 id="best-practices">Best Practices</h2>
      <p>Um Plagiate zu vermeiden:</p>
      <ul>
        <li>Führen Sie während der Recherche sorgfältig Quellenverzeichnisse</li>
        <li>Zitieren Sie alle fremden Gedanken und Ideen</li>
        <li>Verwenden Sie Paraphrasierung korrekt</li>
        <li>Prüfen Sie Ihre Arbeit vor der Abgabe</li>
      </ul>
    `
  },
  {
    id: "forschungsmethoden",
    title: "Forschungsmethoden",
    date: "2024-11-25",
    author: {
      name: "Prof. Dr. Robert Fischer",
      title: "Professor für Methodologie",
      education: "Promoviert in Soziologie, Habilitation in Forschungsmethoden",
      linkedin: "https://linkedin.com/in/robert-fischer",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face"
    },
    excerpt: "Qualitativ vs. Quantitativ: Was passt zu deinem Projekt?",
    content: `
      <h2 id="einfuehrung">Einführung</h2>
      <p>Die Wahl der richtigen Forschungsmethode ist entscheidend für den Erfolg Ihrer wissenschaftlichen Arbeit. Dieser Artikel gibt Ihnen einen Überblick über qualitative und quantitative Methoden.</p>
      
      <h2 id="quantitative-forschung">Quantitative Forschung</h2>
      <p>Quantitative Forschung basiert auf numerischen Daten und statistischen Analysen. Sie eignet sich besonders für die Untersuchung von Zusammenhängen und Kausalitäten.</p>
      
      <h3 id="merkmale-quantitativ">Merkmale quantitativer Forschung</h3>
      <ul>
        <li>Große Stichproben</li>
        <li>Standardisierte Datenerhebung</li>
        <li>Statistische Auswertung</li>
        <li>Objektive Messungen</li>
      </ul>
      
      <h3 id="methoden-quantitativ">Methoden</h3>
      <p>Zu den quantitativen Methoden gehören Umfragen, Experimente, Beobachtungen mit strukturierten Protokollen und Sekundärdatenanalyse.</p>
      
      <h2 id="qualitative-forschung">Qualitative Forschung</h2>
      <p>Qualitative Forschung fokussiert sich auf das Verstehen von Phänomenen aus der Perspektive der Teilnehmer. Sie eignet sich besonders für die Erforschung komplexer sozialer Prozesse.</p>
      
      <h3 id="merkmale-qualitativ">Merkmale qualitativer Forschung</h3>
      <ul>
        <li>Kleine, gezielte Stichproben</li>
        <li>Offene Datenerhebung</li>
        <li>Interpretative Auswertung</li>
        <li>Subjektive Perspektiven</li>
      </ul>
      
      <h3 id="methoden-qualitativ">Methoden</h3>
      <p>Zu den qualitativen Methoden gehören Interviews, Fokusgruppen, teilnehmende Beobachtung und Diskursanalyse.</p>
      
      <h2 id="mixed-methods">Mixed Methods</h2>
      <p>Viele moderne Forschungsprojekte kombinieren qualitative und quantitative Methoden, um ein umfassenderes Verständnis zu gewinnen.</p>
      
      <h2 id="wahl-der-methode">Wahl der Methode</h2>
      <p>Die Wahl der Methode hängt von Ihrer Forschungsfrage, Ihrem Thema und Ihren Ressourcen ab. Konsultieren Sie Ihren Betreuer, um die beste Methode für Ihr Projekt zu finden.</p>
    `
  },
  {
    id: "literaturverwaltung",
    title: "Literaturverwaltung",
    date: "2024-11-22",
    author: {
      name: "Dr. Markus Hoffmann",
      title: "Bibliothekswissenschaftler",
      education: "Promoviert in Bibliothekswissenschaft, Spezialisierung auf digitale Ressourcen",
      linkedin: "https://linkedin.com/in/markus-hoffmann",
      image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop&crop=face"
    },
    excerpt: "Die besten Tools um deine Quellen zu organisieren.",
    content: `
      <h2 id="einfuehrung">Einführung</h2>
      <p>Eine gute Literaturverwaltung ist essentiell für jede wissenschaftliche Arbeit. Mit den richtigen Tools können Sie Zeit sparen und Fehler vermeiden.</p>
      
      <h2 id="warum-literaturverwaltung-wichtig-ist">Warum Literaturverwaltung wichtig ist</h2>
      <p>Eine systematische Literaturverwaltung hilft Ihnen:</p>
      <ul>
        <li>Überblick über Ihre Quellen zu behalten</li>
        <li>Zitationen korrekt zu formatieren</li>
        <li>Zeit bei der Erstellung von Literaturverzeichnissen zu sparen</li>
        <li>Doppelte Arbeit zu vermeiden</li>
      </ul>
      
      <h2 id="populaere-tools">Populäre Tools</h2>
      <p>Es gibt verschiedene Tools für die Literaturverwaltung, jedes mit seinen eigenen Stärken:</p>
      
      <h3 id="zotero">Zotero</h3>
      <p>Zotero ist ein kostenloses, open-source Tool, das besonders bei Geisteswissenschaftlern beliebt ist. Es bietet Browser-Integration und Cloud-Synchronisation.</p>
      
      <h3 id="mendeley">Mendeley</h3>
      <p>Mendeley kombiniert Literaturverwaltung mit sozialen Netzwerk-Funktionen. Es ist besonders nützlich für Kollaborationen.</p>
      
      <h3 id="citavi">Citavi</h3>
      <p>Citavi ist ein umfassendes Tool, das besonders in Deutschland verbreitet ist. Es bietet erweiterte Funktionen für Wissensorganisation.</p>
      
      <h3 id="jenni-ai-bibliothek">Jenni AI Bibliothek</h3>
      <p>Die integrierte Bibliothek in Jenni AI ermöglicht es Ihnen, PDFs zu verwalten, zu annotieren und direkt in Ihren Dokumenten zu zitieren.</p>
      
      <h2 id="best-practices">Best Practices</h2>
      <p>Für eine effektive Literaturverwaltung:</p>
      <ul>
        <li>Beginnen Sie frühzeitig mit der Sammlung von Quellen</li>
        <li>Verwenden Sie konsistente Tags und Kategorien</li>
        <li>Erstellen Sie Notizen zu wichtigen Quellen</li>
        <li>Führen Sie regelmäßige Backups durch</li>
      </ul>
    `
  },
  {
    id: "community-stories",
    title: "Community Stories",
    date: "2024-11-20",
    author: {
      name: "Jenni AI Team",
      title: "Community Manager",
      education: "Vielfältige akademische Hintergründe",
      linkedin: "https://linkedin.com/company/jenni-ai",
      image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=100&h=100&fit=crop&crop=face"
    },
    excerpt: "Erfahrungsberichte von Studenten und Forschern.",
    content: `
      <h2 id="einfuehrung">Einführung</h2>
      <p>In dieser Serie teilen Studierende und Forscher ihre Erfahrungen mit wissenschaftlichem Schreiben und wie Tools wie Jenni AI ihnen geholfen haben.</p>
      
      <h2 id="erfolgsgeschichten">Erfolgsgeschichten</h2>
      <p>Unsere Community besteht aus Millionen von Nutzern, die täglich bessere wissenschaftliche Arbeiten erstellen. Hier sind einige ihrer Geschichten:</p>
      
      <h3 id="maria-studentin">Maria - Masterstudentin</h3>
      <p>"Jenni AI hat mir geholfen, meine Masterarbeit in der Hälfte der Zeit zu schreiben. Die KI-Vorschläge waren immer relevant und halfen mir, meinen Gedankengang zu strukturieren."</p>
      
      <h3 id="dr-peter-forscher">Dr. Peter - Forscher</h3>
      <p>"Als Forscher muss ich regelmäßig Artikel für Fachzeitschriften schreiben. Jenni AI hilft mir dabei, konsistenten Stil zu wahren und meine Ideen klar zu kommunizieren."</p>
      
      <h3 id="sophie-doktorandin">Sophie - Doktorandin</h3>
      <p>"Die Zitationsfunktion von Jenni AI hat mir unzählige Stunden gespart. Ich kann mich jetzt auf den Inhalt konzentrieren, anstatt mich mit Formatierung herumzuschlagen."</p>
      
      <h2 id="tipps-von-der-community">Tipps von der Community</h2>
      <p>Unsere Nutzer teilen regelmäßig Tipps und Tricks:</p>
      <ul>
        <li>Nutzen Sie die Autocomplete-Funktion für erste Ideen</li>
        <li>Organisieren Sie Ihre Quellen frühzeitig in der Bibliothek</li>
        <li>Nutzen Sie die Plagiatsprüfung vor der Abgabe</li>
        <li>Experimentieren Sie mit verschiedenen Zitationsstilen</li>
      </ul>
      
      <h2 id="mitmachen">Mitmachen</h2>
      <p>Haben Sie auch eine Geschichte zu teilen? Kontaktieren Sie uns und werden Sie Teil unserer Community!</p>
    `
  }
]

export function getBlogPost(id: string): BlogPost | undefined {
  return blogPosts.find(post => post.id === id)
}

export function getAllBlogPosts(): BlogPost[] {
  return blogPosts
}

