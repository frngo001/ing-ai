# Bachelorarbeit Agent - Implementierungsplan

## Architektur-Übersicht

### Komponenten

1. **Agent State Management** (Zustand)
   - Aktueller Schritt
   - Fortschritt
   - Gespeicherte Daten pro Schritt
   - User-Präferenzen

2. **Agent API Route** (`/api/ai/agent/bachelorarbeit`)
   - Hauptendpoint für Agent-Interaktionen
   - Verwendet AI SDK mit Tools
   - State-Management Integration

3. **Agent Tools** (Funktionen die der Agent aufrufen kann)
   - `getCurrentStep` - Aktuellen Schritt abrufen
   - `updateStep` - Schritt aktualisieren
   - `saveStepData` - Daten für einen Schritt speichern
   - `getStepData` - Daten für einen Schritt abrufen
   - `generateTemplate` - Template für einen Schritt generieren
   - `validateStep` - Schritt-Output validieren
   - `moveToNextStep` - Zum nächsten Schritt wechseln

4. **UI Komponenten**
   - Agent-Modus Toggle im Chat
   - Fortschrittsanzeige
   - Schritt-Card/Display
   - Checkliste pro Schritt
   - Agent-spezifische UI-Elemente

5. **Storage**
   - LocalStorage/Supabase für Agent-State
   - Persistierung des Fortschritts

## Technische Umsetzung

### 1. Agent State Management

**Datei**: `src/lib/stores/bachelorarbeit-agent-store.ts`

```typescript
// Zustand Store für Agent State
- currentStep: number (1-21)
- stepData: Record<number, any>
- progress: number (0-100)
- startedAt: Date
- lastUpdated: Date
```

### 2. Agent API Route

**Datei**: `src/app/api/ai/agent/bachelorarbeit/route.ts`

- Verwendet `streamText` oder `generateAgent` (falls verfügbar)
- Definiert Tools für jeden Schritt
- System Prompt mit Agent-Instruktionen
- State-Management Integration

### 3. Agent Tools

Jedes Tool ist eine Funktion, die der Agent aufrufen kann:

```typescript
const tools = {
  getCurrentStep: tool({
    description: 'Aktuellen Schritt abrufen',
    parameters: z.object({}),
    execute: async () => { ... }
  }),
  
  updateStep: tool({
    description: 'Schritt aktualisieren und speichern',
    parameters: z.object({
      step: z.number(),
      data: z.any()
    }),
    execute: async ({ step, data }) => { ... }
  }),
  
  // ... weitere Tools
}
```

### 4. UI Integration

**Datei**: `src/components/ask-ai-pane.tsx` (erweitern)

- Toggle für "Agent Modus"
- Wenn aktiviert: Zeige Fortschrittsanzeige
- Zeige aktuellen Schritt
- Zeige Checkliste
- Agent-spezifische Prompts

### 5. Schritt-Definitionen

**Datei**: `src/lib/ai/bachelorarbeit-steps.ts`

- Strukturierte Definitionen aller 21 Schritte
- Templates pro Schritt
- Validierungsregeln
- Checklisten

## Implementierungsreihenfolge

### Phase 1: Grundlagen (MVP)
1. ✅ Schritt-Definitionen erstellen
2. ✅ Agent Store erstellen
3. ✅ Basis API Route mit einem Tool
4. ✅ UI Toggle für Agent-Modus

### Phase 2: Core-Funktionalität
5. ✅ Alle Tools implementieren
6. ✅ State-Persistierung
7. ✅ Fortschrittsanzeige
8. ✅ Schritt-Navigation

### Phase 3: Erweiterte Features
9. ✅ Templates pro Schritt
10. ✅ Validierung
11. ✅ Checklisten
12. ✅ Erinnerungen/Deadlines

### Phase 4: Integration
13. ✅ Integration mit Editor
14. ✅ Integration mit Citations
15. ✅ Export-Funktionalität

## Detaillierte Implementierung

### Schritt 1: Store erstellen

```typescript
// src/lib/stores/bachelorarbeit-agent-store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type StepData = {
  [key: number]: any
}

interface BachelorarbeitAgentState {
  isActive: boolean
  currentStep: number
  stepData: StepData
  progress: number
  startedAt: Date | null
  lastUpdated: Date | null
  
  // Actions
  startAgent: () => void
  stopAgent: () => void
  setCurrentStep: (step: number) => void
  updateStepData: (step: number, data: any) => void
  getStepData: (step: number) => any
  calculateProgress: () => number
  reset: () => void
}
```

### Schritt 2: API Route

```typescript
// src/app/api/ai/agent/bachelorarbeit/route.ts
import { streamText, tool } from 'ai'
import { z } from 'zod'
import { deepseek } from '@/lib/ai/deepseek'
import { BACHELORARBEIT_AGENT_PROMPT } from './prompts'
import { BACHELORARBEIT_STEPS } from '@/lib/ai/bachelorarbeit-steps'

export async function POST(req: Request) {
  const { messages, agentState } = await req.json()
  
  const tools = {
    getCurrentStep: tool({ ... }),
    updateStep: tool({ ... }),
    // ... weitere Tools
  }
  
  const result = streamText({
    model: deepseek(DEEPSEEK_CHAT_MODEL),
    system: BACHELORARBEIT_AGENT_PROMPT,
    messages,
    tools,
    toolChoice: 'auto',
  })
  
  return result.toTextStreamResponse()
}
```

### Schritt 3: UI Integration

Erweitere `ask-ai-pane.tsx`:
- Checkbox/Toggle für "Agent Modus"
- Wenn aktiv: Zeige Fortschrittsanzeige
- Zeige aktuellen Schritt
- Zeige Checkliste

### Schritt 4: Schritt-Definitionen

```typescript
// src/lib/ai/bachelorarbeit-steps.ts
export const BACHELORARBEIT_STEPS = [
  {
    id: 1,
    title: 'Themenfindung',
    description: 'Ein passendes Thema für die Bachelorarbeit finden',
    checklist: [
      'Interessen identifiziert',
      'Fachbereich geklärt',
      '3-5 Themenvorschläge erstellt'
    ],
    template: '...',
    validation: (data: any) => boolean
  },
  // ... weitere Schritte
]
```

## Nächste Schritte

1. **Store implementieren** - Zustand-Management für Agent
2. **API Route erstellen** - Backend für Agent-Interaktionen
3. **Tools definieren** - Funktionen die der Agent nutzen kann
4. **UI erweitern** - Frontend-Integration
5. **Schritt-Definitionen** - Strukturierte Daten für alle Schritte
6. **Testing** - Schritt-für-Schritt testen

## Technische Entscheidungen

### AI SDK Agent vs. Custom Implementation

Da das AI SDK möglicherweise keine direkte `generateAgent` Funktion hat, verwenden wir:
- `streamText` mit `tools` - Agent kann Tools aufrufen
- System Prompt definiert Agent-Verhalten
- State-Management extern (Zustand Store)

### State Management

- **Zustand** für Client-Side State
- **Supabase** für persistente Speicherung (optional)
- **LocalStorage** als Fallback

### Tools vs. Direct Actions

- Tools für komplexe Operationen (State-Updates, Validierung)
- Direct Actions für einfache Operationen (Text-Generierung)

## Erweiterte Features (später)

1. **Multi-Agent System**: Verschiedene Agenten für verschiedene Phasen
2. **Collaboration**: Mehrere User können zusammenarbeiten
3. **Analytics**: Fortschritts-Tracking und Statistiken
4. **Templates Library**: Vorgefertigte Templates pro Fachbereich
5. **Integration**: Betreuer-Feedback, Deadline-Management

