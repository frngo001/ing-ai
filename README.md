<div align="center">
  <a href="https://ingai-editor.vercel.app/">
    <img src="public/logos/logosApp/ing_AI.png" alt="Ing AI Logo" width="100" height="auto">
  </a>
  <br />
  <br />
    <a href="https://ingai-editor.vercel.app/">
      <img src="https://img.shields.io/badge/Ing_AI-Academic_Writer-000000?style=for-the-badge&logo=openai&logoColor=white" alt="Ing AI Banner">
    </a>
  <br />

  <h1 align="center">Ing AI</h1>

  <p align="center">
    <strong>Die next-gen Plattform für akademisches Schreiben.</strong>
    <br />
    <span style="color: #666;">Open Source ⸱ AI-Native ⸱ Collaborative</span>
  </p>

  <p align="center">
    <a href="https://ingai-editor.vercel.app/"><strong>Live App</strong></a> •
    <a href="#features">Features</a> •
    <a href="#tech-stack">Stack</a> •
    <a href="#getting-started">Setup</a>
  </p>

  <div align="center">
    <img src="https://img.shields.io/badge/Status-Beta-3b82f6?style=flat-square" alt="Status" />
    <img src="https://img.shields.io/badge/Next.js-16.1-black?style=flat-square&logo=next.js" alt="Next.js" />
    <img src="https://img.shields.io/badge/Supabase-Ready-3ecf8e?style=flat-square&logo=supabase" alt="Supabase" />
    <img src="https://img.shields.io/badge/Deepseek-V3-6366f1?style=flat-square" alt="AI Model" />
  </div>
</div>

<br />

<div align="center">
  <div style="display: flex; justify-content: center; gap: 10px; margin-bottom: 20px;">
    <a href="https://ingai-editor.vercel.app/" target="_blank">
      <img src="public/dashboaed-dark_1.png" alt="Library" width="100%" style="border-radius: 8px; border: 1px solid #333;">
    </a>
    <a href="https://ingai-editor.vercel.app/" target="_blank">
      <img src="public/dashboard-dark-2.png" alt="Editor" width="100%" style="border-radius: 8px; border: 1px solid #333;">
    </a>
    <a href="https://ingai-editor.vercel.app/" target="_blank">
      <img src="public/dashboard-dark-3.png" alt="Research" width="100%" style="border-radius: 8px; border: 1px solid #333;">
    </a>
  </div>
</div>

<br />

---

## 🔮 Vision

**Ing AI** revolutioniert den akademischen Schreibprozess. Inspiriert von Jenni.ai, bietet es eine Umgebung, die Studierende und Forschende von der ersten Recherche bis zum fertigen Export begleitet. Wir kombinieren die Power von **LLMs (Deepseek)**, eine massive Datenbank an wissenschaftlichen Quellen (>250M Papers) und einen hochmodernen Editor.

---

## ⚡ Features

### Advanced AI & Agents

<div align="center">
  <img src="public/chat_dark.gif" alt="AI Agent Workflow" width="100%" style="border-radius: 8px; border: 1px solid #333; margin-bottom: 24px;">
</div>

**Context-Aware Autocomplete**  
Die AI versteht den Kontext deiner Arbeit und schreibt Sätze logisch weiter – als würde sie deine Gedanken lesen.

**Specialized Agents**  
*   **Bachelor- & Master-Agent:** Ein geführter Workflow für deine Thesis (Themenfindung → Gliederung → Schreibphase).
*   **AskJenni:** Chatte direkt mit deiner Bibliothek. *"Fasse die Methodik von Quelle X zusammen"* oder *"Finde Gegenargumente"*.

**Smart Commands**  
Text markieren und transformieren: *Umschreiben*, *Kürzen*, *Vereinfachen* oder *Akademisch formulieren*.

---

### Scientific Engine

<div align="center" style="margin: 20px 0;">

| Metric | Source Coverage |
| :--- | :--- |
| **Databases** | Zugriff auf **>20** Datenbanken (CrossRef, OpenAlex, PubMed, arXiv) |
| **Index** | Suche in über **250 Millionen** wissenschaftlichen Artikeln |
| **Styles** | Unterstützung von **>9000** Zitierstilen (APA, Harvard, IEEE) via CSL |

</div>

**Citation Management**  
Automatische Bibliographie-Erstellung in Echtzeit. Füge eine Quelle hinzu, und das Verzeichnis aktualisiert sich sofort.

**Research Library**  
Zentrale Verwaltung von PDFs, Notizen und Metadaten. BibTeX Import & Export für volle Kompatibilität.

---

### Pro Editor

Wir setzen auf [Plate.js](https://platejs.org/docs) für eine unschlagbare Editing-Experience.

**Format Flexibility**  
Importiere und exportiere in allen relevanten Formaten:
*   **Input:** Markdown, HTML, BibTeX
*   **Output:** DOCX (Word), HTML, Markdown, LaTeX, PDF

**TextLive Math**  
Schreibe Formeln natürlich im Fluss. Tippe `/mat` oder Syntax wie `\sum`:
*   *Inline:* $E=mc^2$
*   *Block:* Volle LaTeX Equation-Umgebung

---

### Realtime Collaboration

**Sync Engine**  
Konfliktfreies, gleichzeitiges Bearbeiten im Google Docs-Stil (powered by Yjs).

**Presence & Review**  
Live Cursors zeigen Team-Aktivität. Nutze Kommentare und den Vorschlagsmodus (Track Changes) für professionelles Feedback.

---

## 🛠 Tech Stack

Dieser Stack definiert den Standard für moderne AI-Webapps im Jahr 2025.

| Scope | Technology | Usage |
|-------|------------|-------|
| **Framework** | ![Next.js](https://img.shields.io/badge/Next.js_16-black?logo=next.js) | App Router, Server Actions |
| **Styling** | ![Tailwind](https://img.shields.io/badge/Tailwind_4-38bdf8?logo=tailwindcss) | + Shadcn/ui & Framer Motion |
| **Editor** | ![Plate](https://img.shields.io/badge/Plate.js-slate) | [See Docs](https://platejs.org/docs) |
| **Database** | ![Supabase](https://img.shields.io/badge/Supabase-3ecf8e?logo=supabase) | Postgres, Auth, Realtime, Vector |
| **AI Layer** | ![Deepseek](https://img.shields.io/badge/Deepseek-6366f1) | High-Performance LLM Integration |

---

## 🏁 Getting Started

### Prerequisites
*   Node.js 18+ (pnpm empfohlen)
*   Supabase Account
*   Deepseek API Key

### Installation

1.  **Clone Repository**
    ```bash
    git clone https://github.com/dein-username/ing-ai.git
    cd ing-ai
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    ```bash
    cp ENV_TEMPLATE.md .env.local
    # Trage deine API Keys in .env.local ein
    ```

4.  **Database Migration**
    Führe das SQL-Skript init `supabase/schema.sql` im Supabase Dashboard aus.

5.  **Run Dev Server**
    ```bash
    npm run dev
    ```
    Visit: `http://localhost:3000`

---

## 📍 Roadmap

*   [x] **Core Editor**: Markdown, LaTeX, Realtime Sync (Yjs)
*   [x] **AI Engine**: Deepseek Autocomplete & Chat Agents
*   [x] **Citations**: >9000 Styles, >20 Databases, BibTeX Support
*   [x] **Exports**: DOCX, HTML, Markdown
*   [ ] **Mobile**: Native Mobile App
*   [ ] **Plagiarism**: Integration externer Plagiat-Scanner APIs
*   [ ] **Offline**: Local-First Sync Architecture

---

<div align="center">
  <small>Built with ❤️ by Francloic & Community.</small>
</div>
