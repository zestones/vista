export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]
export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      github_installations: {
        Row: {
          account_login: string
          created_at: string
          id: string
          installation_id: number
          installed_by: string
        }
        Insert: {
          account_login: string
          created_at?: string
          id?: string
          installation_id: number
          installed_by: string
        }
        Update: {
          account_login?: string
          created_at?: string
          id?: string
          installation_id?: number
          installed_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "github_installations_installed_by_fkey"
            columns: ["installed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      issues: {
        Row: {
          author_avatar_url: string | null
          author_login: string | null
          closed_at: string | null
          created_at: string | null
          html_url: string | null
          id: string
          labels: Json | null
          milestone_id: string | null
          number: number
          project_repo_id: string
          shared: boolean
          state: string | null
          title: string
          updated_at: string
        }
        Insert: {
          author_avatar_url?: string | null
          author_login?: string | null
          closed_at?: string | null
          created_at?: string | null
          html_url?: string | null
          id?: string
          labels?: Json | null
          milestone_id?: string | null
          number: number
          project_repo_id: string
          shared?: boolean
          state?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          author_avatar_url?: string | null
          author_login?: string | null
          closed_at?: string | null
          created_at?: string | null
          html_url?: string | null
          id?: string
          labels?: Json | null
          milestone_id?: string | null
          number?: number
          project_repo_id?: string
          shared?: boolean
          state?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "issues_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issues_project_repo_id_fkey"
            columns: ["project_repo_id"]
            isOneToOne: false
            referencedRelation: "project_repos"
            referencedColumns: ["id"]
          },
        ]
      }
      milestones: {
        Row: {
          closed_issues: number | null
          description: string | null
          due_on: string | null
          id: string
          number: number
          open_issues: number | null
          project_repo_id: string
          shared: boolean
          state: string | null
          title: string
          updated_at: string
        }
        Insert: {
          closed_issues?: number | null
          description?: string | null
          due_on?: string | null
          id?: string
          number: number
          open_issues?: number | null
          project_repo_id: string
          shared?: boolean
          state?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          closed_issues?: number | null
          description?: string | null
          due_on?: string | null
          id?: string
          number?: number
          open_issues?: number | null
          project_repo_id?: string
          shared?: boolean
          state?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestones_project_repo_id_fkey"
            columns: ["project_repo_id"]
            isOneToOne: false
            referencedRelation: "project_repos"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          name: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id: string
          name?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string | null
        }
        Relationships: []
      }
      project_invites: {
        Row: {
          created_at: string
          id: string
          project_id: string
          revoked_at: string | null
          token: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          revoked_at?: string | null
          token: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          revoked_at?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_invites_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_members: {
        Row: {
          decided_at: string | null
          email: string
          id: string
          invited_at: string
          name: string | null
          project_id: string
          role: Database["public"]["Enums"]["member_role"]
          status: Database["public"]["Enums"]["member_status"]
          user_id: string | null
        }
        Insert: {
          decided_at?: string | null
          email: string
          id?: string
          invited_at?: string
          name?: string | null
          project_id: string
          role?: Database["public"]["Enums"]["member_role"]
          status?: Database["public"]["Enums"]["member_status"]
          user_id?: string | null
        }
        Update: {
          decided_at?: string | null
          email?: string
          id?: string
          invited_at?: string
          name?: string | null
          project_id?: string
          role?: Database["public"]["Enums"]["member_role"]
          status?: Database["public"]["Enums"]["member_status"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_repos: {
        Row: {
          created_at: string
          github_repo_id: number | null
          id: string
          installation_id: number
          owner: string
          project_id: string
          repo: string
        }
        Insert: {
          created_at?: string
          github_repo_id?: number | null
          id?: string
          installation_id: number
          owner: string
          project_id: string
          repo: string
        }
        Update: {
          created_at?: string
          github_repo_id?: number | null
          id?: string
          installation_id?: number
          owner?: string
          project_id?: string
          repo?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_repos_installation_id_fkey"
            columns: ["installation_id"]
            isOneToOne: false
            referencedRelation: "github_installations"
            referencedColumns: ["installation_id"]
          },
          {
            foreignKeyName: "project_repos_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          available_on_vista: boolean
          color: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          owner_id: string
          visibility: Database["public"]["Enums"]["project_visibility"]
        }
        Insert: {
          available_on_vista?: boolean
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          owner_id: string
          visibility?: Database["public"]["Enums"]["project_visibility"]
        }
        Update: {
          available_on_vista?: boolean
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          owner_id?: string
          visibility?: Database["public"]["Enums"]["project_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "projects_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          body: string | null
          created_at: string
          decided_at: string | null
          decided_by: string | null
          github_issue_number: number | null
          id: string
          project_id: string
          status: Database["public"]["Enums"]["submission_status"]
          submitted_by: string | null
          submitter_email: string | null
          submitter_name: string | null
          title: string
          type: Database["public"]["Enums"]["submission_type"]
        }
        Insert: {
          body?: string | null
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          github_issue_number?: number | null
          id?: string
          project_id: string
          status?: Database["public"]["Enums"]["submission_status"]
          submitted_by?: string | null
          submitter_email?: string | null
          submitter_name?: string | null
          title: string
          type?: Database["public"]["Enums"]["submission_type"]
        }
        Update: {
          body?: string | null
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          github_issue_number?: number | null
          id?: string
          project_id?: string
          status?: Database["public"]["Enums"]["submission_status"]
          submitted_by?: string | null
          submitter_email?: string | null
          submitter_name?: string | null
          title?: string
          type?: Database["public"]["Enums"]["submission_type"]
        }
        Relationships: [
          {
            foreignKeyName: "submissions_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_state: {
        Row: {
          last_etag: string | null
          last_synced_at: string | null
          project_repo_id: string
        }
        Insert: {
          last_etag?: string | null
          last_synced_at?: string | null
          project_repo_id: string
        }
        Update: {
          last_etag?: string | null
          last_synced_at?: string | null
          project_repo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_state_project_repo_id_fkey"
            columns: ["project_repo_id"]
            isOneToOne: true
            referencedRelation: "project_repos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_memberships: {
        Args: { p_email: string; p_uid: string }
        Returns: undefined
      }
      create_project: {
        Args: {
          p_available: boolean
          p_description: string
          p_name: string
          p_visibility: Database["public"]["Enums"]["project_visibility"]
        }
        Returns: {
          available_on_vista: boolean
          color: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          owner_id: string
          visibility: Database["public"]["Enums"]["project_visibility"]
        }
        SetofOptions: {
          from: "*"
          to: "projects"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_project_by_token: {
        Args: { p_token: string }
        Returns: {
          color: string
          description: string
          id: string
          member_count: number
          name: string
        }[]
      }
      get_projects_for_user: { Args: never; Returns: Json }
      has_role: {
        Args: {
          min_role: Database["public"]["Enums"]["member_role"]
          p: string
        }
        Returns: boolean
      }
      is_active_member: { Args: { p: string }; Returns: boolean }
      is_milestone_shared: { Args: { m: string }; Returns: boolean }
      is_owner: { Args: { p: string }; Returns: boolean }
      is_project_published: { Args: { p: string }; Returns: boolean }
      is_repo_visible_to_member: { Args: { pr: string }; Returns: boolean }
      request_access: { Args: { p_token: string }; Returns: string }
      resync_all_repos: { Args: never; Returns: undefined }
      set_issue_shared: {
        Args: { i: string; value: boolean }
        Returns: undefined
      }
      set_milestone_issues_shared: {
        Args: { m: string; value: boolean }
        Returns: undefined
      }
      set_milestone_shared: {
        Args: { m: string; value: boolean }
        Returns: undefined
      }
    }
    Enums: {
      member_role: "owner" | "editor" | "viewer"
      member_status: "pending" | "active"
      project_visibility: "private" | "shared"
      submission_status: "pending" | "approved" | "denied"
      submission_type: "feature" | "bug" | "question" | "other"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]
export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never
export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never
export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never
export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never
export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      member_role: ["owner", "editor", "viewer"],
      member_status: ["pending", "active"],
      project_visibility: ["private", "shared"],
      submission_status: ["pending", "approved", "denied"],
      submission_type: ["feature", "bug", "question", "other"],
    },
  },
} as const
