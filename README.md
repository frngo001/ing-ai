# Jenni AI Clone

A comprehensive AI-powered writing assistant built with Next.js 16, AI SDK 6, Deepseek, and Supabase.

## Features

### AI Writing Assistance
- ✅ **AI Autocomplete** - Real-time intelligent writing suggestions
- ✅ **AI Commands** - Rewrite, paraphrase, simplify, and expand text
- ✅ **Tone Adjustment** - Academic, professional, persuasive, friendly, casual
- ✅ **Outline Generator** - Create structured document outlines

### Research & Citations
- ✅ **AskJenni AI Assistant** - Chat-based research help
- ✅ **Citation Generator** - Support for APA, MLA, Chicago, IEEE, Harvard, Vancouver
- 📚 **PDF Upload & Management** - Upload and organize research papers
- 📚 **Web Search** - DuckDuckGo integration for research

### Editor Features
- ✅ **Rich Text Editor** - Powered by Tiptap with formatting toolbar
- ✅ **Word/Character Counter** - Track document statistics
- ✅ **Resizable Panels** - Customizable workspace layout
- 💾 **Auto-save** - Never lose your work

### Design
- ✅ **Supabase-Inspired Theme** - Jungle Green (#34B27B) primary color
- ✅ **Dark Mode Support** - Beautiful light and dark themes
- ✅ **shadcn/ui Components** - 27+ premium UI components
- ✅ **Responsive Design** - Works on all devices

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: TailwindCSS 4, shadcn/ui
- **AI**: AI SDK 6, Deepseek
- **Database**: Supabase (PostgreSQL)
- **Editor**: Tiptap
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or pnpm
- Supabase account
- Deepseek API key

### Installation

1. Clone the repository
```bash
git clone <your-repo-url>
cd jenni-ai-clone
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables

Create a `.env.local` file (see `ENV_TEMPLATE.md` for reference):
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
DEEPSEEK_API_KEY=your_deepseek_api_key
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
```

4. Set up Supabase database

Run the SQL in `supabase/schema.sql` in your Supabase SQL editor to create all necessary tables and policies.

5. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your application.

## Project Structure

```
jenni-ai-clone/
├── src/
│   ├── app/                    # Next.js app router pages
│   │   ├── api/               # API routes
│   │   │   └── ai/           # AI endpoints
│   │   ├── dashboard/        # Dashboard page
│   │   ├── editor/           # Editor page
│   │   └── page.tsx          # Landing page
│   ├── components/            # React components
│   │   ├── ui/               # shadcn/ui components
│   │   ├── editor/           # Editor components
│   │   └── ai-assistant/     # AI assistant components
│   ├── lib/                   # Utility libraries
│   │   ├── ai/               # AI configuration & prompts
│   │   ├── supabase/         # Supabase clients
│   │   └── citations/        # Citation generation
│   └── hooks/                 # Custom React hooks
├── supabase/
│   └── schema.sql            # Database schema
└── public/                    # Static files
```

## Key Features Implementation

### AI Autocomplete
The AI autocomplete feature uses streaming responses from Deepseek to provide real-time writing suggestions based on document context.

### Citation Generator
Unterstützt 6 vordefinierte Stile (APA, MLA, Chicago, IEEE, Harvard, Vancouver) und kann via **Bibify** (>9000 CSL-Stile) weitere Zitierstile sowie Buch- und Webseiten-Metadaten beziehen.

### Rich Text Editor
Built with Tiptap, includes:
- Text formatting (bold, italic, headings)
- Lists (bullet, ordered)
- Blockquotes
- Undo/Redo
- Character and word counting

### Database Schema
Comprehensive Supabase schema with:
- User profiles and preferences
- Documents with version history
- Research sources and PDFs
- Citations
- Row-level security (RLS) policies

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Environment Variables

See `ENV_TEMPLATE.md` for all required environment variables.

## Contributing

This is a clone project built for educational purposes.

## License

MIT

## Acknowledgments

- Inspired by Jenni AI
- Design inspired by Supabase
- Built with shadcn/ui components
- Powered by Deepseek AI
