# Source Fetching System

Umfassendes System zur automatischen Quellensuche über 14+ wissenschaftliche Datenbanken - **komplett ohne API-Keys**.

## 🎯 Funktionen

- **14 wissenschaftliche APIs** parallel durchsuchen
- **250M+ Papers** von CrossRef, OpenAlex, Semantic Scholar, PubMed, arXiv und mehr
- **Keine API-Keys erforderlich** - alle APIs funktionieren out-of-the-box
- **Intelligente Priorisierung** basierend auf Suchtyp (DOI, Titel, Autor, Keyword)
- **Automatische Normalisierung** und Deduplizierung
- **Rate Limiting** und Fehlerbehandlung eingebaut

## 📚 Unterstützte APIs

| API | Datensätze | Spezial Gebiet |
|-----|-----------|----------------|
| **CrossRef** | 130M+ | DOIs, allgemein |
| **OpenAlex** | 250M+ | Komplett offen (CC0) |
| **Semantic Scholar** | 200M+ | AI-gestützte Suche |
| **PubMed** | 35M+ | Biomedizin |
| **arXiv** | 2.4M+ | Preprints (Physik, Math, CS) |
| **CORE** | 270M+ | Open Access |
| **Europe PMC** | - | Life Sciences |
| **BASE** | 340M+ | Akademische Suche |
| **DOAJ** | 20,000+ Journals | Open Access Journals |
| **PLOS** | - | Open Access Papers |
| **bioRxiv** | - | Life Sciences Preprints |
| **DataCite** | - | Forschung sdaten |
| **Zenodo** | - | Research Repository |
| **OpenCitations** | - | Zitationsdaten |

## 🚀 Verwendung

### In der UI

1. Öffne **Citation Manager**
2. Klicke auf **"Search Sources"**
3. Wähle Suchtyp: Keyword, Title, Author oder DOI
4. Gib Suchbegriff ein und klicke **"Search"**
5. Importiere gefundene Quellen mit **"Import"**

### Via API

```typescript
// POST /api/sources/search
const response = await fetch('/api/sources/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        query: 'climate change',
        type: 'keyword', // 'keyword' | 'title' | 'author' | 'doi'
        limit: 20
    })
})

const data = await response.json()
// Returns: { sources: [...], totalResults, searchTime, apis: [...] }
```

### Programmatisch

```typescript
import { SourceFetcher } from '@/lib/sources/source-fetcher'

const fetcher = new SourceFetcher({
    maxParallelRequests: 5,
    useCache: true,
})

const results = await fetcher.search({
    query: '10.1038/nature12373',
    type: 'doi',
    limit: 1,
})

console.log(results.sources) // Normalisierte Quellen
```

## 🔧 Architektur

### Core Components

```
src/lib/sources/
├── types.ts                 # TypeScript Definitionen
├── api-client.ts            # Basis API Client
├── normalizer.ts            # Response Normalisierung
├── source-fetcher.ts        # Hauptorchestrator
└── apis/
    ├── crossref-client.ts
    ├── pubmed-client.ts
    ├── arxiv-client.ts
    ├── semantic-scholar-client.ts
    ├── openalex-client.ts
    ├── core-client.ts
    ├── europepmc-client.ts
    ├── doaj-client.ts
    ├── biorxiv-client.ts
    ├── datacite-client.ts
    ├── zenodo-client.ts
    ├── base-client.ts
    ├── plos-client.ts
    └── opencitations-client.ts
```

### Features

#### Rate Limiting
Jeder API-Client hat eingebautes Rate Limiting:
- Automatische Verzögerung zwischen Anfragen
- Exponentielles Backoff bei Fehlern
- Queue-Management für parallele Anfragen

#### Normalisierung
Alle API-Responses werden auf ein einheitliches Format normalisiert:
- Autorennamen  parsen (verschiedene Formate)
- DOI-Extraktion
- Typ-Mapping (journal, book, preprint, etc.)
- Completeness-Scoring (0-1)

#### Deduplizierung
Automatische Entfernung von Duplikaten basierend auf:
- DOI (Primary)
- Normalisiertem Titel (Fallback)
- Bevorzugung von Quellen mit höherer Completeness

#### Intelligente Priorisierung

Suchtyp | Primäre APIs
-------- | ------------
DOI | CrossRef, DataCite, OpenAlex, Semantic Scholar
Title | Semantic Scholar, OpenAlex, CrossRef, BASE, CORE
Author | Semantic Scholar, OpenAlex, PubMed, CrossRef
Keyword | Semantic Scholar, OpenAlex, BASE, CORE, CrossRef

## 📊 Performance

- **Durchschnittliche Antwortzeit**: < 2s für erste Ergebnisse
- **Parallele API-Calls**: 5 gleichzeitig (konfigurierbar)
- **Deduplizierung**: Basierend auf DOI und Titel
- **Caching**: Optional (24h TTL)

## 🔒 Rate Limits

Alle APIs funktionieren ohne Keys, haben aber unterschiedliche Limits:

| API | Rate Limit | Notes |
|-----|-----------|-------|
| CrossRef | 50/s (polite) | 1/s anonym |
| OpenAlex | 10/s, 100k/day | Sehr großzügig |
| Semantic Scholar | 1/s | 10/s mit API Key |
| PubMed | 3/s | 10/s mit API Key |
| arXiv | 1/3s | Sehr konservativ |
| CORE | 0.5/s | 10/s mit Registrierung |
| Europa PMC | 5/s | Standard |
| Andere | 1-2/s | Standard |

Das System respektiert automatisch alle Rate Limits.

## 🎨 UI Components

### SourceSearchDialog
- Suchfeld mit Typ-Auswahl
- Live-Suchergebnisse
- Metadaten-Anzeige (Journal, Year, OA-Status, Completeness)
- Import-Button für Citation Manager
- Links zu Original-Paper und PDFs

## 🧪 Beispiele

### DOI Lookup
```typescript
const results = await fetcher.search({
    query: '10.1038/nature12373',
    type: 'doi'
})
```

### Titel-Suche
```typescript
const results = await fetcher.search({
    query: 'Deep Learning for Image Recognition',
    type: 'title',
    limit: 10
})
```

### Autoren-Suche
```typescript
const results = await fetcher.search({
    query: 'Einstein',
    type: 'author',
    limit: 20
})
```

## 🔮 Zukünftige Erweiterungen

- [ ] Browser-seitiges Caching (IndexedDB)
- [ ] Favoriten-APIs pro Fachgebiet
- [ ] Batch-Import via DOI-Liste
- [ ] Export zu Endnote, Zotero, Mendeley
- [ ] Full-Text Suche (wo verfügbar)
- [ ] Citation Network Visualization

## 📝 Lizenz

Source Fetching System ist Teil von Jenni AI Clone und verwendet ausschließlich öffentliche, kostenlose wissenschaftliche APIs.
