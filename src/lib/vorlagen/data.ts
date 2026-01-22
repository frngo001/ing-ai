/**
 * Template data for programmatic SEO
 * /vorlagen/[slug] pages
 */

export interface Template {
  id: string
  title: string
  description: string
  category: 'bachelorarbeit' | 'hausarbeit' | 'masterarbeit' | 'expose' | 'seminararbeit'
  content: string
  keywords: string[]
  relatedTemplates: string[]
}

export const templates: Template[] = [
  {
    id: 'bachelorarbeit-leitfaden',
    title: 'Bachelorarbeit: Vorlage, Gliederung & Leitfaden',
    description: 'Der ultimative Leitfaden für deine Bachelorarbeit. Enthält eine vollständige Gliederungsvorlage, Beispiele für Einleitung und Fazit sowie Formatierungstipps.',
    category: 'bachelorarbeit',
    keywords: [
      'Bachelorarbeit Vorlage',
      'Bachelorarbeit Gliederung',
      'Bachelorarbeit Struktur',
      'Bachelorarbeit Beispiel',
      'Wissenschaftliches Arbeiten',
    ],
    relatedTemplates: ['masterarbeit-leitfaden', 'expose-leitfaden'],
    content: `
      <h2 id="bachelorarbeit-uebersicht">Bachelorarbeit: Die perfekte Struktur</h2>
      <p>Eine Bachelorarbeit umfasst in der Regel 30 bis 60 Seiten. Sie dient dazu, nachzuweisen, dass du in der Lage bist, innerhalb einer vorgegebenen Frist ein Problem selbstständig nach wissenschaftlichen Methoden zu bearbeiten.</p>

      <h2 id="standardgliederung">Standard-Gliederung einer Bachelorarbeit</h2>
      <p>Die folgende Struktur hat sich in fast allen Fachbereichen bewährt:</p>
      
      <h3 id="deckblatt">1. Deckblatt</h3>
      <p>Das Deckblatt enthält alle wichtigen Informationen: Titel, Name, Matrikelnummer, Studiengang, Name des Betreuers und der Hochschule sowie das Abgabedatum.</p>

      <h3 id="abstract">2. Abstract (150-250 Wörter)</h3>
      <p>Eine Kurzzusammenfassung der gesamten Arbeit. Es sollte den Hintergrund, die Forschungsfrage, die Methodik, die wichtigsten Ergebnisse und die Schlussfolgerung enthalten.</p>

      <h3 id="inhaltsverzeichnis">3. Inhaltsverzeichnis</h3>
      <p>Ein logisch strukturiertes Verzeichnis aller Kapitel mit Seitenzahlen. Profi-Tipp: Nutze die automatische Verzeichnisfunktion in Word oder Google Docs.</p>

      <h3 id="einleitung">4. Einleitung (10-15%)</h3>
      <p>Die Einleitung führt in das Thema ein, beschreibt die Problemstellung, formuliert die Forschungsfrage und erläutert den Aufbau der Arbeit.</p>

      <h3 id="theorieteil">5. Theoretischer Teil / Grundlagen (20-30%)</h3>
      <p>Hier definierst du wichtige Begriffe, stellst relevante Theorien vor und gibst einen Überblick über den aktuellen Stand der Forschung.</p>

      <h3 id="methodik">6. Methodik (15-20%)</h3>
      <p>Beschreibe dein Vorgehen präzise: Forschungsdesign, Stichprobe, Datenerhebung und Auswertungsmethoden.</p>

      <h3 id="ergebnisse">7. Ergebnisse / Analyse (20-30%)</h3>
      <p>Präsentiere deine gewonnenen Daten objektiv mithilfe von Statistiken, Grafiken und Tabellen.</p>

      <h3 id="diskussion">8. Diskussion (10-15%)</h3>
      <p>Interpretiere deine Ergebnisse im Kontext der Theorie, diskutiere Limitationen und leite Implikationen für die Praxis ab.</p>

      <h3 id="fazit">9. Fazit / Ausblick (10-15%)</h3>
      <p>Fasse die wichtigsten Erkenntnisse zusammen, beantworte deine Forschungsfrage und gib einen Ausblick auf zukünftige Forschung.</p>

      <h3 id="anhang">10. Literaturverzeichnis & Anhang</h3>
      <p>Alle verwendeten Quellen im entsprechenden Zitierstil sowie ergänzende Materialien wie Fragebögen oder Transkripte.</p>

      <h2 id="beispiel-deckblatt">Beispiel: Deckblatt</h2>
      <pre>
Universität XYZ
Fakultät für Wirtschaftswissenschaften

Der Einfluss von Social-Media-Marketing
auf das Kaufverhalten der Generation Z
Eine empirische Untersuchung

Bachelorarbeit
vorgelegt von: Max Mustermann
Matrikelnummer: 123456
Betreuer: Prof. Dr. Maria Schmidt
Datum: 15. März 2026
      </pre>

      <h2 id="formatierung">Formatierungsvorgaben</h2>
      <ul>
        <li><strong>Schriftart:</strong> Serif (Times New Roman 12pt) oder Sans-Serif (Arial 11pt)</li>
        <li><strong>Zeilenabstand:</strong> 1,5-fach</li>
        <li><strong>Seitenränder:</strong> Links 3-4 cm (Bindung), Rechts 2-3 cm (Korrektur)</li>
        <li><strong>Blocksatz:</strong> Mit Silbentrennung für ein professionelles Layout</li>
      </ul>
    `,
  },
  {
    id: 'masterarbeit-leitfaden',
    title: 'Masterarbeit: Vorlage & Gliederung',
    description: 'Detaillierte Vorlage für deine Masterarbeit. Erfahre die Unterschiede zur Bachelorarbeit und wie du eine komplexe Forschungsstruktur aufbaust.',
    category: 'masterarbeit',
    keywords: [
      'Masterarbeit Vorlage',
      'Masterarbeit Gliederung',
      'Masterarbeit Aufbau',
      'Wissenschaftliches Schreiben Master',
    ],
    relatedTemplates: ['bachelorarbeit-leitfaden', 'expose-leitfaden'],
    content: `
      <h2 id="masterarbeit-anspruch">Anspruch der Masterarbeit</h2>
      <p>Eine Masterarbeit ist mit 60 bis 100 Seiten deutlich umfangreicher als eine Bachelorarbeit. Hier wird eine tiefere theoretische Durchdringung und oft eine komplexere empirische Methodik (z. B. Mixed Methods) erwartet.</p>

      <h2 id="unterschiede">Unterschiede zur Bachelorarbeit</h2>
      <table>
        <thead>
          <tr className="border-b">
            <th className="text-left py-2">Aspekt</th>
            <th className="text-left py-2">Bachelorarbeit</th>
            <th className="text-left py-2">Masterarbeit</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b">
            <td className="py-2">Umfang</td>
            <td className="py-2">30-60 Seiten</td>
            <td className="py-2">60-100 Seiten</td>
          </tr>
          <tr className="border-b">
            <td className="py-2">Eigenleistung</td>
            <td className="py-2">Anwendung von Methoden</td>
            <td className="py-2">Eigenständige Forschung</td>
          </tr>
          <tr className="border-b">
            <td className="py-2">Quellen</td>
            <td className="py-2">30-50</td>
            <td className="py-2">60-100+</td>
          </tr>
        </tbody>
      </table>

      <h2 id="gliederung-masterarbeit">Gliederungsvorschlag für die Masterarbeit</h2>
      <ol>
        <li><strong>Einleitung:</strong> Hintergrund, Relevanz, konkreter Forschungsbeitrag</li>
        <li><strong>Theoretischer Rahmen:</strong> Integration verschiedener Perspektiven und Synthese</li>
        <li><strong>Stand der Forschung:</strong> Systematische Literaturrecherche</li>
        <li><strong>Methodik:</strong> Detailliertes Forschungsdesign, ggf. mehrstufige Erhebung</li>
        <li><strong>Ergebnisse:</strong> Umfangreiche Darstellung und Integration der Daten</li>
        <li><strong>Diskussion:</strong> Kritische Reflexion, theoretische und praktische Implikationen</li>
        <li><strong>Fazit:</strong> Beantwortung der Forschungsfrage und wissenschaftlicher Beitrag</li>
      </ol>

      <h2 id="tipps">Tipps für den Erfolg</h2>
      <ul>
        <li>Wähle ein Thema, das eine Forschungslücke adressiert</li>
        <li>Nutze von Anfang an ein Literaturverwaltungsprogramm (wie Ing AI)</li>
        <li>Plane ausreichend Zeit für die Datenanalyse und Korrekturphase ein (mind. 1 Monat)</li>
      </ul>
    `,
  },
  {
    id: 'hausarbeit-leitfaden',
    title: 'Hausarbeit: Vorlage & Beispielstruktur',
    description: 'Die perfekte Struktur für deine Hausarbeit. Mit Seitenverteilung, Gliederungsbeispielen und Tipps für Einleitung und Hauptteil.',
    category: 'hausarbeit',
    keywords: [
      'Hausarbeit Vorlage',
      'Hausarbeit Gliederung',
      'Hausarbeit Aufbau',
      'Hausarbeit Beispiel',
    ],
    relatedTemplates: ['seminararbeit-leitfaden', 'bachelorarbeit-leitfaden'],
    content: `
      <h2 id="hausarbeit-aufbau">Struktur einer Hausarbeit</h2>
      <p>Hausarbeiten umfassen meist 10 bis 25 Seiten. Der Fokus liegt oft auf einer theoretischen Auseinandersetzung mit einem spezifischen Seminarthema.</p>

      <h3 id="seitenverteilung">Beispielhafte Seitenverteilung (15 Seiten)</h3>
      <ul>
        <li><strong>Einleitung:</strong> 1,5-2 Seiten (10-15%)</li>
        <li><strong>Hauptteil:</strong> 10-12 Seiten (70-80%)</li>
        <li><strong>Fazit:</strong> 1,5-2 Seiten (10-15%)</li>
      </ul>

      <h2 id="gliederung-hausarbeit">Standard-Gliederung</h2>
      <pre>
1. Einleitung
   1.1 Hinführung zum Thema
   1.2 Fragestellung
   1.3 Aufbau der Arbeit
2. Theoretische Grundlagen
   2.1 Begriffsklärung
   2.2 Stand der Forschung
3. Analyse / Argumentation
   3.1 Erster Aspekt
   3.2 Zweiter Aspekt
4. Diskussion
5. Fazit
Literaturverzeichnis
      </pre>

      <h2 id="besonderheiten">Besonderheiten</h2>
      <p>Im Gegensatz zu Abschlussarbeiten benötigen Hausarbeiten in der Regel kein Abstract und keine Abbildungsverzeichnisse (außer bei sehr vielen Grafiken). Wichtig ist eine scharfe Eingrenzung des Themas.</p>
    `,
  },
  {
    id: 'expose-leitfaden',
    title: 'Exposé: Vorlage & Projektplan',
    description: 'Erstelle ein überzeugendes Exposé für deine Bachelor- oder Masterarbeit. Mit Gliederung, Zeitplan-Vorlage und Forschungsplan.',
    category: 'expose',
    keywords: [
      'Exposé Vorlage',
      'Exposé Gliederung',
      'Exposé Bachelorarbeit',
      'Zeitplan Bachelorarbeit',
    ],
    relatedTemplates: ['bachelorarbeit-leitfaden', 'masterarbeit-leitfaden'],
    content: `
      <h2 id="expose-zweck">Zweck des Exposés</h2>
      <p>Ein Exposé (5-10 Seiten) ist der Projektplan deiner Arbeit. Es dient der Abstimmung mit deinem Betreuer und als roter Faden für dein gesamtes Schreibprojekt.</p>

      <h2 id="gliederung-expose">Gliederung eines Exposés</h2>
      <ul>
        <li><strong>Arbeitstitel:</strong> Vorläufiger Titel der Arbeit</li>
        <li><strong>Problemstellung:</strong> Warum ist das Thema wichtig?</li>
        <li><strong>Forschungsfrage:</strong> Was genau möchtest du herausfinden?</li>
        <li><strong>Stand der Forschung:</strong> Kurzer Überblick über die Literatur</li>
        <li><strong>Methodik:</strong> Wie erhebst und wertest du deine Daten aus?</li>
        <li><strong>Vorläufige Gliederung:</strong> Grobe Kapitelstruktur</li>
        <li><strong>Zeitplan:</strong> Phasenplan mit Deadlines</li>
      </ul>

      <h2 id="zeitplan-beispiel">Beispiel: Zeitplan (3 Monate)</h2>
      <table>
        <thead>
          <tr className="border-b">
            <th className="text-left py-2">Phase</th>
            <th className="text-left py-2">Dauer</th>
            <th className="text-left py-2">Deadline</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b">
            <td className="py-2">Recherche & Theorie</td>
            <td className="py-2">5 Wochen</td>
            <td className="py-2">Woche 5</td>
          </tr>
          <tr className="border-b">
            <td className="py-2">Datenerhebung</td>
            <td className="py-2">2 Wochen</td>
            <td className="py-2">Woche 7</td>
          </tr>
          <tr className="border-b">
            <td className="py-2">Auswertung & Schreiben</td>
            <td className="py-2">4 Wochen</td>
            <td className="py-2">Woche 11</td>
          </tr>
          <tr className="border-b">
            <td className="py-2">Korrektur & Abgabe</td>
            <td className="py-2">1 Woche</td>
            <td className="py-2">Woche 12</td>
          </tr>
        </tbody>
      </table>
    `,
  },
  {
    id: 'seminararbeit-leitfaden',
    title: 'Seminararbeit: Vorlage & Anforderungen',
    description: 'Alles Wissenswerte zur Seminararbeit. Gliederung, Anforderungen und Tipps für eine erfolgreiche Leistung in deinem Seminar.',
    category: 'seminararbeit',
    keywords: [
      'Seminararbeit Vorlage',
      'Seminararbeit Gliederung',
      'Seminararbeit Aufbau',
      'Leistungsnachweis Universität',
    ],
    relatedTemplates: ['hausarbeit-leitfaden', 'bachelorarbeit-leitfaden'],
    content: `
      <h2 id="seminararbeit-info">Die Seminararbeit</h2>
      <p>Seminararbeiten (10-20 Seiten) lehnen sich stark an die Struktur von Hausarbeiten an, haben aber oft einen engeren Bezug zum spezifischen Inhalt eines Seminars.</p>

      <h3 id="anforderungen">Typische Anforderungen</h3>
      <ul>
        <li><strong>Umfang:</strong> 10-20 Seiten</li>
        <li><strong>Bearbeitungszeit:</strong> 4-8 Wochen</li>
        <li><strong>Fokus:</strong> Kritische Diskussion von Seminarliteratur und Theorien</li>
      </ul>

      <h2 id="gliederung">Gliederungsempfehlung</h2>
      <p>Die Gliederung entspricht meist der einer Hausarbeit (Einleitung, Grundlagen, Analyse, Diskussion, Fazit). Besonderes Augenmerk sollte auf die korrekte Verwendung der im Seminar eingeführten Fachbegriffe gelegt werden.</p>
    `,
  },
]

export function getTemplate(id: string): Template | undefined {
  return templates.find((template) => template.id === id)
}

export function getAllTemplates(): Template[] {
  return templates
}

export function getTemplatesByCategory(category: Template['category']): Template[] {
  return templates.filter((template) => template.category === category)
}
