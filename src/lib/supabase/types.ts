export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          default_citation_style: string
          default_document_type: string
          language: string
          theme: string
          ai_autocomplete_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          default_citation_style?: string
          default_document_type?: string
          language?: string
          theme?: string
          ai_autocomplete_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          default_citation_style?: string
          default_document_type?: string
          language?: string
          theme?: string
          ai_autocomplete_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          id: string
          user_id: string
          project_id: string | null
          title: string
          content: Json
          document_type: string
          word_count: number
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          project_id?: string | null
          title: string
          content?: Json
          document_type?: string
          word_count?: number
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          project_id?: string | null
          title?: string
          content?: Json
          document_type?: string
          word_count?: number
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      document_history: {
        Row: {
          id: string
          document_id: string
          content: Json
          created_at: string
        }
        Insert: {
          id?: string
          document_id: string
          content: Json
          created_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          content?: Json
          created_at?: string
        }
        Relationships: []
      }
      sources: {
        Row: {
          id: string
          user_id: string
          title: string
          authors: string[] | null
          publication_year: number | null
          publication_type: string | null
          url: string | null
          doi: string | null
          abstract: string | null
          metadata: Json | null
          pmid: string | null
          pmcid: string | null
          arxiv_id: string | null
          isbn: string | null
          issn: string | null
          journal: string | null
          volume: string | null
          issue: string | null
          pages: string | null
          publisher: string | null
          pdf_url: string | null
          is_open_access: boolean | null
          keywords: string[] | null
          citation_count: number | null
          impact_factor: number | null
          completeness: number | null
          source_api: string | null
          fetched_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          authors?: string[] | null
          publication_year?: number | null
          publication_type?: string | null
          url?: string | null
          doi?: string | null
          abstract?: string | null
          metadata?: Json | null
          pmid?: string | null
          pmcid?: string | null
          arxiv_id?: string | null
          isbn?: string | null
          issn?: string | null
          journal?: string | null
          volume?: string | null
          issue?: string | null
          pages?: string | null
          publisher?: string | null
          pdf_url?: string | null
          is_open_access?: boolean | null
          keywords?: string[] | null
          citation_count?: number | null
          impact_factor?: number | null
          completeness?: number | null
          source_api?: string | null
          fetched_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          authors?: string[] | null
          publication_year?: number | null
          publication_type?: string | null
          url?: string | null
          doi?: string | null
          abstract?: string | null
          metadata?: Json | null
          pmid?: string | null
          pmcid?: string | null
          arxiv_id?: string | null
          isbn?: string | null
          issn?: string | null
          journal?: string | null
          volume?: string | null
          issue?: string | null
          pages?: string | null
          publisher?: string | null
          pdf_url?: string | null
          is_open_access?: boolean | null
          keywords?: string[] | null
          citation_count?: number | null
          impact_factor?: number | null
          completeness?: number | null
          source_api?: string | null
          fetched_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      pdf_uploads: {
        Row: {
          id: string
          source_id: string | null
          user_id: string
          file_name: string
          file_path: string
          file_size: number | null
          extracted_text: string | null
          page_count: number | null
          created_at: string
        }
        Insert: {
          id?: string
          source_id?: string | null
          user_id: string
          file_name: string
          file_path: string
          file_size?: number | null
          extracted_text?: string | null
          page_count?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          source_id?: string | null
          user_id?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          extracted_text?: string | null
          page_count?: number | null
          created_at?: string
        }
        Relationships: []
      }
      citations: {
        Row: {
          id: string
          document_id: string | null
          source_id: string | null
          library_id: string | null
          user_id: string | null
          citation_style: string
          in_text_citation: string
          full_citation: string
          page_number: string | null
          title: string | null
          source: string | null
          year: number | null
          last_edited: string | null
          href: string | null
          external_url: string | null
          authors: string[] | null
          abstract: string | null
          doi: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          document_id?: string | null
          source_id?: string | null
          library_id?: string | null
          user_id?: string | null
          citation_style: string
          in_text_citation: string
          full_citation: string
          page_number?: string | null
          title?: string | null
          source?: string | null
          year?: number | null
          last_edited?: string | null
          href?: string | null
          external_url?: string | null
          authors?: string[] | null
          abstract?: string | null
          doi?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          document_id?: string | null
          source_id?: string | null
          library_id?: string | null
          user_id?: string | null
          citation_style?: string
          in_text_citation?: string
          full_citation?: string
          page_number?: string | null
          title?: string | null
          source?: string | null
          year?: number | null
          last_edited?: string | null
          href?: string | null
          external_url?: string | null
          authors?: string[] | null
          abstract?: string | null
          doi?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      citation_libraries: {
        Row: {
          id: string
          user_id: string
          project_id: string | null
          name: string
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          project_id?: string | null
          name: string
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          project_id?: string | null
          name?: string
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_conversations: {
        Row: {
          id: string
          user_id: string
          project_id: string | null
          title: string
          updated_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          project_id?: string | null
          title: string
          updated_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          project_id?: string | null
          title?: string
          updated_at?: string
          created_at?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          id: string
          conversation_id: string
          role: 'user' | 'assistant'
          content: string
          reasoning: string | null
          parts: Json
          tool_invocations: Json
          tool_steps: Json
          files: Json
          context: Json
          mentions: Json
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          role: 'user' | 'assistant'
          content: string
          reasoning?: string | null
          parts?: Json
          tool_invocations?: Json
          tool_steps?: Json
          files?: Json
          context?: Json
          mentions?: Json
          order_index?: number
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          role?: 'user' | 'assistant'
          content?: string
          reasoning?: string | null
          parts?: Json
          tool_invocations?: Json
          tool_steps?: Json
          files?: Json
          context?: Json
          mentions?: Json
          order_index?: number
          created_at?: string
        }
        Relationships: []
      }

      saved_messages: {
        Row: {
          id: string
          user_id: string
          message_id: string
          conversation_id: string
          content: string
          role: 'user' | 'assistant'
          preview: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          message_id: string
          conversation_id: string
          content: string
          role: 'user' | 'assistant'
          preview?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          message_id?: string
          conversation_id?: string
          content?: string
          role?: 'user' | 'assistant'
          preview?: string | null
          created_at?: string
        }
        Relationships: []
      }
      slash_commands: {
        Row: {
          id: string
          user_id: string
          label: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          label: string
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          label?: string
          content?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      agent_states: {
        Row: {
          id: string
          user_id: string
          project_id: string | null
          is_active: boolean
          arbeit_type: 'bachelor' | 'master' | 'general' | null
          thema: string | null
          current_step: number | null
          step_data: Json
          progress: number
          selected_sources: Json
          pending_sources: Json
          started_at: string | null
          last_updated: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          project_id?: string | null
          is_active?: boolean
          arbeit_type?: 'bachelor' | 'master' | 'general' | null
          thema?: string | null
          current_step?: number | null
          step_data?: Json
          progress?: number
          selected_sources?: Json
          pending_sources?: Json
          started_at?: string | null
          last_updated?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          project_id?: string | null
          is_active?: boolean
          arbeit_type?: 'bachelor' | 'master' | 'general' | null
          thema?: string | null
          current_step?: number | null
          step_data?: Json
          progress?: number
          selected_sources?: Json
          pending_sources?: Json
          started_at?: string | null
          last_updated?: string
          created_at?: string
        }
        Relationships: []
      }
      discussions: {
        Row: {
          id: string
          document_id: string
          user_id: string
          document_content: string | null
          is_resolved: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          document_id: string
          user_id: string
          document_content?: string | null
          is_resolved?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          user_id?: string
          document_content?: string | null
          is_resolved?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          id: string
          discussion_id: string
          user_id: string
          content_rich: Json
          is_edited: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          discussion_id: string
          user_id: string
          content_rich: Json
          is_edited?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          discussion_id?: string
          user_id?: string
          content_rich?: Json
          is_edited?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_onboarding: {
        Row: {
          id: string
          user_id: string
          current_step: number
          completed_steps: number[]
          is_completed: boolean
          is_skipped: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          current_step?: number
          completed_steps?: number[]
          is_completed?: boolean
          is_skipped?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          current_step?: number
          completed_steps?: number[]
          is_completed?: boolean
          is_skipped?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_shares: {
        Row: {
          id: string
          project_id: string
          owner_id: string
          share_token: string
          mode: 'view' | 'edit' | 'suggest'
          is_active: boolean
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          owner_id: string
          share_token: string
          mode: 'view' | 'edit' | 'suggest'
          is_active?: boolean
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          owner_id?: string
          share_token?: string
          mode?: 'view' | 'edit' | 'suggest'
          is_active?: boolean
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_share_members: {
        Row: {
          id: string
          share_id: string
          user_id: string
          joined_at: string
        }
        Insert: {
          id?: string
          share_id: string
          user_id: string
          joined_at?: string
        }
        Update: {
          id?: string
          share_id?: string
          user_id?: string
          joined_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      join_project_share: {
        Args: { share_token_param: string }
        Returns: {
          success: boolean
          error?: string
          isOwner?: boolean
          projectId?: string
          shareId?: string
          mode?: 'view' | 'edit' | 'suggest'
        }
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
