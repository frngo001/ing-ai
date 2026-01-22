/**
 * Citation Styles data for programmatic SEO
 * /zitationsstile/[stil] pages
 */

export interface ZitationsStil {
  id: string
  name: string
  fullName: string
  description: string
  usedIn: string[]
  keywords: string[]
  examples: {
    book: { inText: string; reference: string }
    journal: { inText: string; reference: string }
    website: { inText: string; reference: string }
  }
  rules: string
  advantages: string[]
  disadvantages: string[]
  relatedStyles: string[]
}

export const zitationsstile: ZitationsStil[] = [
  {
    id: 'apa',
    name: 'APA',
    fullName: 'APA (American Psychological Association)',
    description: 'Der APA-Stil ist der Standard-Zitierstil in den Sozialwissenschaften, Psychologie und Erziehungswissenschaften. Er verwendet ein Autor-Jahr-System.',
    usedIn: ['Psychologie', 'Pädagogik', 'Soziologie', 'Wirtschaftswissenschaften', 'Pflegewissenschaften'],
    keywords: ['APA Zitieren', 'APA Style', 'APA 7th Edition', 'Autor Jahr System', 'Psychologie Zitieren'],
    examples: {
      book: {
        inText: '(Müller, 2024) oder Müller (2024) argumentiert...',
        reference: 'Müller, S. (2024). <em>Einführung in die Psychologie</em> (2. Aufl.). Springer.',
      },
      journal: {
        inText: '(Schmidt & Wagner, 2023)',
        reference: 'Schmidt, M., & Wagner, L. (2023). Digitale Lernmethoden. <em>Zeitschrift für Pädagogik</em>, <em>45</em>(2), 123-145. https://doi.org/10.1234/zfp.2023.45.2',
      },
      website: {
        inText: '(Klein, 2024)',
        reference: 'Klein, T. (2024, 15. März). <em>KI im Studium</em>. Universität Berlin. https://example.com/ki-studium',
      },
    },
    rules: `
      <h3>Vergleich der wichtigsten Zitierstile</h3>
      <table>
        <thead>
          <tr>
            <th>Merkmal</th>
            <th>APA</th>
            <th>MLA</th>
            <th>Chicago</th>
            <th>Harvard</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Hauptfächer</td>
            <td>Psychologie, Sozialwissenschaften</td>
            <td>Literatur, Sprachen</td>
            <td>Geschichte, Geisteswissenschaften</td>
            <td>Wirtschaft, Naturwissenschaften (UK)</td>
          </tr>
          <tr>
            <td>System</td>
            <td>Autor-Jahr</td>
            <td>Autor-Seite</td>
            <td>Fußnoten ODER Autor-Jahr</td>
            <td>Autor-Jahr</td>
          </tr>
          <tr>
            <td>Im-Text</td>
            <td><code>(Müller, 2024, S. 15)</code></td>
            <td><code>(Müller 15)</code></td>
            <td>Fußnote¹</td>
            <td><code>(Müller 2024, S. 15)</code></td>
          </tr>
          <tr>
            <td>Jahr im Text</td>
            <td>Ja</td>
            <td>Nein</td>
            <td>In Fußnote / Optional</td>
            <td>Ja</td>
          </tr>
          <tr>
            <td>Vornamen</td>
            <td>Nur Initialen</td>
            <td>Ausgeschrieben</td>
            <td>Ausgeschrieben</td>
            <td>Variiert</td>
          </tr>
          <tr>
            <td>Flexibilität</td>
            <td>Streng definiert</td>
            <td>Klar geregelt</td>
            <td>Sehr flexibel</td>
            <td>Viele Varianten</td>
          </tr>
          <tr>
            <td>Fußnoten</td>
            <td>Nur für Zusatzinfo</td>
            <td>Selten verwendet</td>
            <td>Hauptmethode (Notes)</td>
            <td>Nur für Zusatzinfo</td>
          </tr>
        </tbody>
      </table>

      <h3>Grundregeln APA 7th Edition</h3>
      <ul>
        <li><strong>Im Text:</strong> (Nachname, Jahr) oder Nachname (Jahr)</li>
        <li><strong>Direkte Zitate:</strong> (Nachname, Jahr, S. Seitenzahl)</li>
        <li><strong>Mehrere Autoren:</strong>
          <ul>
            <li>2 Autoren: (Schmidt & Müller, 2024)</li>
            <li>3+ Autoren: (Schmidt et al., 2024)</li>
          </ul>
        </li>
        <li><strong>Literaturverzeichnis:</strong> Alphabetisch nach Nachname, hängender Einzug</li>
        <li><strong>Titel:</strong> Nur erster Buchstabe groß (außer Eigennamen)</li>
      </ul>

      <h3>Besonderheiten</h3>
      <ul>
        <li>DOI immer angeben, wenn vorhanden</li>
        <li>Abrufdatum nur bei Websites ohne Datum</li>
        <li>Kursiv: Buch-/Zeitschriftentitel, Bandnummer</li>
        <li>Bei 20+ Autoren: Ersten 19 nennen, dann "...", letzten Autor</li>
      </ul>

      <h3>Häufige Fehler vermeiden</h3>
      <ul>
        <li>❌ "et al." bei nur 2 Autoren</li>
        <li>❌ "S." bei englischen Quellen (dort "p.")</li>
        <li>❌ Abrufdatum bei allen Websites</li>
        <li>❌ Verlag bei Zeitschriftenartikeln</li>
      </ul>
    `,
    advantages: [
      'Weit verbreitet und anerkannt',
      'Klare, einheitliche Regeln',
      'Datum prominent platziert',
      'Gut für Literaturübersichten',
      'Software-Unterstützung (Zotero, Mendeley, Ing AI)',
    ],
    disadvantages: [
      'Komplizierte Regeln bei vielen Autoren',
      'Weniger Details im Fließtext',
      'Häufige Updates der Richtlinien',
    ],
    relatedStyles: ['harvard', 'chicago'],
  },
  {
    id: 'mla',
    name: 'MLA',
    fullName: 'MLA (Modern Language Association)',
    description: 'Der MLA-Stil wird hauptsächlich in den Geisteswissenschaften verwendet, besonders in Literatur-, Sprach- und Kulturwissenschaften.',
    usedIn: ['Literaturwissenschaft', 'Sprachwissenschaft', 'Kulturwissenschaften', 'Philosophie', 'Kunstgeschichte'],
    keywords: ['MLA Zitieren', 'MLA Style', 'MLA 9th Edition', 'Geisteswissenschaften Zitieren'],
    examples: {
      book: {
        inText: '(Müller 45) oder "..." (Müller 45)',
        reference: 'Müller, Sarah. <em>Einführung in die Germanistik</em>. Campus Verlag, 2024.',
      },
      journal: {
        inText: '(Schmidt 123)',
        reference: 'Schmidt, Michael. "Postmoderne Literatur." <em>Literaturwissenschaft Heute</em>, vol. 12, no. 3, 2023, pp. 120-135.',
      },
      website: {
        inText: '(Wagner)',
        reference: 'Wagner, Lisa. "Digitale Literatur." <em>Literaturportal</em>, 15 März 2024, www.example.com/digitale-literatur.',
      },
    },
    rules: `
      <h3>Grundregeln MLA 9th Edition</h3>
      <ul>
        <li><strong>Im Text:</strong> (Nachname Seitenzahl) ohne Komma</li>
        <li><strong>Mehrere Autoren:</strong> (Schmidt und Wagner 45)</li>
        <li><strong>Kein Autor:</strong> Gekürzte Titelversion verwenden</li>
        <li><strong>Literaturverzeichnis:</strong> "Works Cited", alphabetisch</li>
      </ul>

      <h3>Formatierung</h3>
      <ul>
        <li>Nachname, Vorname. <em>Titel</em>. Verlag, Jahr.</li>
        <li>Titel kursiv bei eigenständigen Werken</li>
        <li>Titel in Anführungszeichen bei Artikeln/Kapiteln</li>
        <li>Container-Konzept: Artikel "in" Zeitschrift</li>
      </ul>

      <h3>Core Elements (MLA 9)</h3>
      <ol>
        <li>Author</li>
        <li>Title of source</li>
        <li>Title of container</li>
        <li>Contributors</li>
        <li>Version</li>
        <li>Number</li>
        <li>Publisher</li>
        <li>Publication date</li>
        <li>Location</li>
      </ol>
    `,
    advantages: [
      'Einfach und übersichtlich',
      'Fokus auf Seitenzahlen (wichtig für Textanalyse)',
      'Flexible Container-Struktur',
      'Gut für literarische Analysen',
    ],
    disadvantages: [
      'Datum weniger prominent',
      'Kompliziert bei Online-Quellen',
      'Weniger verbreitet außerhalb der Geisteswissenschaften',
    ],
    relatedStyles: ['chicago'],
  },
  {
    id: 'chicago',
    name: 'Chicago',
    fullName: 'Chicago Manual of Style',
    description: 'Der Chicago-Stil bietet zwei Varianten: Notes-Bibliography (Fußnoten) und Author-Date (wie APA). Sehr flexibel und detailliert.',
    usedIn: ['Geschichte', 'Kunstgeschichte', 'Musikwissenschaft', 'Theologie', 'Geisteswissenschaften'],
    keywords: ['Chicago Style', 'Chicago Zitieren', 'Fußnoten', 'Notes Bibliography', 'Author Date'],
    examples: {
      book: {
        inText: 'Fußnote: ¹ Sarah Müller, <em>Geschichte der Moderne</em> (Berlin: Akademie Verlag, 2024), 45.',
        reference: 'Müller, Sarah. <em>Geschichte der Moderne</em>. Berlin: Akademie Verlag, 2024.',
      },
      journal: {
        inText: 'Fußnote: ² Michael Schmidt, "Historische Methoden," <em>Geschichtswissenschaft</em> 12, no. 3 (2023): 123.',
        reference: 'Schmidt, Michael. "Historische Methoden." <em>Geschichtswissenschaft</em> 12, no. 3 (2023): 120-135.',
      },
      website: {
        inText: 'Fußnote: ³ Thomas Wagner, "Digitale Archive," Universität Berlin, 15. März 2024, https://example.com.',
        reference: 'Wagner, Thomas. "Digitale Archive." Universität Berlin. 15. März 2024. https://example.com.',
      },
    },
    rules: `
      <h3>Chicago Notes-Bibliography (Fußnoten)</h3>
      <ul>
        <li><strong>Im Text:</strong> Hochgestellte Nummer als Fußnotenzeichen</li>
        <li><strong>Fußnote (erste Erwähnung):</strong> Vollständige Angabe</li>
        <li><strong>Fußnote (wiederholte Erwähnung):</strong> Nachname, Kurztitel, Seitenzahl</li>
        <li><strong>Bibliografie:</strong> Am Ende, alphabetisch, alle verwendeten Quellen</li>
      </ul>

      <h3>Chicago Author-Date (wie APA)</h3>
      <ul>
        <li><strong>Im Text:</strong> (Müller 2024, 45)</li>
        <li><strong>Referenz:</strong> Müller, Sarah. 2024. <em>Titel</em>. Verlag.</li>
      </ul>

      <h3>Fußnoten-Beispiele</h3>
      <p><strong>Erste Erwähnung:</strong><br>
      ¹ Sarah Müller, <em>Geschichte der Moderne</em> (Berlin: Akademie Verlag, 2024), 45-47.</p>

      <p><strong>Wiederholte Erwähnung:</strong><br>
      ⁵ Müller, <em>Geschichte</em>, 52.</p>

      <p><strong>Ebenda (gleiche Quelle direkt vorher):</strong><br>
      ⁶ Ebd., 53.</p>

      <h3>Besonderheiten</h3>
      <ul>
        <li>Sehr detaillierte Regeln (über 1000 Seiten Handbuch)</li>
        <li>Zwei Systeme: Notes-Bibliography oder Author-Date</li>
        <li>Flexibel anpassbar</li>
        <li>Gut für historische Quellen</li>
      </ul>
    `,
    advantages: [
      'Zwei Varianten für verschiedene Fachbereiche',
      'Sehr detaillierte Richtlinien',
      'Fußnoten halten Text sauber',
      'Gut für umfangreiche Quellennachweise',
      'Flexibel und anpassbar',
    ],
    disadvantages: [
      'Komplex und umfangreich',
      'Fußnoten-System zeitaufwendig',
      'Zwei Varianten können verwirren',
      'Weniger Software-Unterstützung',
    ],
    relatedStyles: ['mla', 'apa'],
  },
  {
    id: 'harvard',
    name: 'Harvard',
    fullName: 'Harvard Referencing System',
    description: 'Das Harvard-System ist ein Autor-Jahr-Stil, ähnlich APA, aber mit eigenen Formatierungsregeln. Besonders in UK und Australien verbreitet.',
    usedIn: ['Wirtschaftswissenschaften', 'Naturwissenschaften', 'Sozialwissenschaften', 'UK/Australien generell'],
    keywords: ['Harvard Zitieren', 'Harvard Style', 'Harvard Referencing', 'Autor Jahr'],
    examples: {
      book: {
        inText: '(Müller 2024) oder Müller (2024) stellt fest...',
        reference: 'Müller, S 2024, <em>Betriebswirtschaftslehre</em>, 5. Aufl., Gabler Verlag, München.',
      },
      journal: {
        inText: '(Schmidt 2023)',
        reference: 'Schmidt, M 2023, \'Moderne Unternehmensführung\', <em>Management Quarterly</em>, Jg. 12, Nr. 3, S. 45-67.',
      },
      website: {
        inText: '(Wagner 2024)',
        reference: 'Wagner, T 2024, <em>Digitales Marketing</em>, gesehen 15. März 2024, <https://example.com/marketing>.',
      },
    },
    rules: `
      <h3>Grundregeln Harvard</h3>
      <ul>
        <li><strong>Im Text:</strong> (Nachname Jahr) oder Nachname (Jahr)</li>
        <li><strong>Direkte Zitate:</strong> (Nachname Jahr, S. Seitenzahl)</li>
        <li><strong>Mehrere Autoren:</strong> (Schmidt & Wagner 2024) oder (Schmidt et al. 2024)</li>
        <li><strong>Referenzliste:</strong> Alphabetisch nach Nachname</li>
      </ul>

      <h3>Formatierung Referenzliste</h3>
      <p><strong>Schema:</strong> Nachname, Initiale Jahr, <em>Titel</em>, Auflage, Verlag, Ort.</p>

      <h3>Unterschiede zu APA</h3>
      <ul>
        <li>Keine Klammern um das Jahr in der Referenz</li>
        <li>Komma nach dem Jahr</li>
        <li>"S." statt "p." für Seitenzahlen (im deutschen Raum)</li>
        <li>Einfache Anführungszeichen für Artikel-Titel</li>
        <li>Abrufdatum bei Online-Quellen üblich</li>
      </ul>

      <h3>Varianten</h3>
      <p>Harvard ist kein offizieller Standard - verschiedene Universitäten haben eigene Varianten. Immer Richtlinien der Hochschule prüfen!</p>
    `,
    advantages: [
      'Einfach und intuitiv',
      'Ähnlich zu APA (leicht zu lernen)',
      'Weit verbreitet in UK/Australien',
      'Flexible Anpassungen möglich',
    ],
    disadvantages: [
      'Keine einheitliche offizielle Version',
      'Viele Varianten an verschiedenen Unis',
      'Kann mit APA verwechselt werden',
    ],
    relatedStyles: ['apa', 'chicago'],
  },
  {
    id: 'ieee',
    name: 'IEEE',
    fullName: 'IEEE (Institute of Electrical and Electronics Engineers)',
    description: 'Der IEEE-Stil verwendet nummerierte Referenzen und wird in technischen und ingenieurwissenschaftlichen Fachbereichen eingesetzt.',
    usedIn: ['Informatik', 'Elektrotechnik', 'Ingenieurwissenschaften', 'Technische Fächer', 'Computer Science'],
    keywords: ['IEEE Zitieren', 'IEEE Style', 'Nummerierte Zitate', 'Informatik Zitieren', 'Engineering'],
    examples: {
      book: {
        inText: '[1] oder wie in [1] beschrieben...',
        reference: '[1] S. Müller, <em>Grundlagen der Informatik</em>, 3. Aufl. Berlin: Springer, 2024.',
      },
      journal: {
        inText: '[2]',
        reference: '[2] M. Schmidt and L. Wagner, "Machine Learning Algorithms," <em>IEEE Trans. Pattern Analysis</em>, vol. 45, no. 3, pp. 234-256, Mar. 2023.',
      },
      website: {
        inText: '[3]',
        reference: '[3] T. Klein. "Neural Networks Tutorial." Accessed: Mar. 15, 2024. [Online]. Available: https://example.com/tutorial',
      },
    },
    rules: `
      <h3>Grundregeln IEEE</h3>
      <ul>
        <li><strong>Im Text:</strong> [Nummer] in eckigen Klammern</li>
        <li><strong>Nummerierung:</strong> Nach Reihenfolge der Erwähnung (nicht alphabetisch!)</li>
        <li><strong>Wiederholte Zitate:</strong> Gleiche Nummer wie bei erster Erwähnung</li>
        <li><strong>Mehrere Quellen:</strong> [1], [2], [3] oder [1]-[3]</li>
      </ul>

      <h3>Formatierung</h3>
      <p><strong>Autoren:</strong> Initialen vor Nachname: "S. Müller" oder "M. L. Wagner"</p>
      <p><strong>Titel:</strong> Buch/Zeitschrift kursiv, Artikel in Anführungszeichen</p>
      <p><strong>Zeitschriften:</strong> Abkürzen (IEEE Trans. = IEEE Transactions)</p>

      <h3>Beispiel Referenzliste</h3>
      <pre>
[1] S. Müller, <em>Einführung in Python</em>, 2. Aufl. München: Hanser, 2024.
[2] M. Schmidt, "Deep Learning," <em>IEEE Trans. Neural Networks</em>, vol. 34,
    no. 2, pp. 123-145, Feb. 2023.
[3] T. Wagner. (2024, Mar.). AI in Education [Online].
    Available: https://example.com
      </pre>

      <h3>Besonderheiten</h3>
      <ul>
        <li>Monat abkürzen: Jan., Feb., Mar., Apr., etc.</li>
        <li>Seitenzahlen mit "pp." (pages)</li>
        <li>DOI in eckigen Klammern: [Online]. Available: https://doi.org/...</li>
        <li>Sehr präzise Formatierung erforderlich</li>
      </ul>
    `,
    advantages: [
      'Kompakt und platzsparend',
      'Zahlen im Text weniger ablenkend als Namen',
      'Standard in technischen Fächern',
      'Gut für viele Referenzen',
      'Klare, präzise Regeln',
    ],
    disadvantages: [
      'Zahlen verraten nichts über Quelle',
      'Muss zurückblättern zum Nachschlagen',
      'Komplizierte Abkürzungsregeln',
      'Nur in technischen Fächern üblich',
    ],
    relatedStyles: ['vancouver'],
  },
  {
    id: 'vancouver',
    name: 'Vancouver',
    fullName: 'Vancouver System (ICMJE)',
    description: 'Der Vancouver-Stil ist der Standard in Medizin und Naturwissenschaften. Verwendet nummerierte Referenzen ähnlich IEEE.',
    usedIn: ['Medizin', 'Biologie', 'Naturwissenschaften', 'Gesundheitswissenschaften', 'Life Sciences'],
    keywords: ['Vancouver Zitieren', 'Vancouver Style', 'Medizin Zitieren', 'ICMJE', 'Biomedizin'],
    examples: {
      book: {
        inText: '(1) oder wie in Referenz 1 beschrieben...',
        reference: '1. Müller S, Wagner L. Grundlagen der Medizin. 4. Aufl. Stuttgart: Thieme; 2024.',
      },
      journal: {
        inText: '(2)',
        reference: '2. Schmidt M, Klein T. Neue Therapieansätze. J Med Res. 2023;45(3):123-35.',
      },
      website: {
        inText: '(3)',
        reference: '3. Wagner T. Medizinische Studien [Internet]. Berlin: Charité; 2024 [zitiert 15. März 2024]. Verfügbar unter: https://example.com',
      },
    },
    rules: `
      <h3>Grundregeln Vancouver (ICMJE)</h3>
      <ul>
        <li><strong>Im Text:</strong> (Nummer) in runden Klammern oder hochgestellt¹</li>
        <li><strong>Nummerierung:</strong> Nach Reihenfolge der Erwähnung</li>
        <li><strong>Referenzliste:</strong> Nummeriert, nicht alphabetisch</li>
        <li><strong>Autoren:</strong> Bis zu 6 Autoren nennen, danach "et al."</li>
      </ul>

      <h3>Formatierung Zeitschriftenartikel</h3>
      <p><strong>Schema:</strong> Autoren. Titel. Zeitschrift. Jahr;Band(Ausgabe):Seiten.</p>
      <p><strong>Beispiel:</strong> Schmidt M, Wagner L, Klein T. Neue Therapien. N Engl J Med. 2023;389(12):1234-45.</p>

      <h3>Abkürzungen</h3>
      <ul>
        <li>Zeitschriften nach Index Medicus abkürzen</li>
        <li>N Engl J Med = New England Journal of Medicine</li>
        <li>JAMA = Journal of the American Medical Association</li>
        <li>Lancet = The Lancet (keine Abkürzung)</li>
      </ul>

      <h3>Besonderheiten Medizin</h3>
      <ul>
        <li>PubMed/MEDLINE als Quelle für korrekte Abkürzungen</li>
        <li>DOI oder PMID (PubMed ID) wenn verfügbar</li>
        <li>Sehr präzise bei medizinischen Fachbegriffen</li>
        <li>Strukturierte Abstracts</li>
      </ul>
    `,
    advantages: [
      'Standard in Medizin weltweit',
      'Kompakt und übersichtlich',
      'Einheitlich durch ICMJE',
      'Gut für systematische Reviews',
      'PubMed-Integration',
    ],
    disadvantages: [
      'Zahlen verraten nichts über Inhalt',
      'Zeitschriften-Abkürzungen kompliziert',
      'Nur in Life Sciences üblich',
      'Weniger Software-Support als APA',
    ],
    relatedStyles: ['ieee'],
  },
]

export function getZitationsStil(id: string): ZitationsStil | undefined {
  return zitationsstile.find((stil) => stil.id === id)
}

export function getAllZitationsStile(): ZitationsStil[] {
  return zitationsstile
}
