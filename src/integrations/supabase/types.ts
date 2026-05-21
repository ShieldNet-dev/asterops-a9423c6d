export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      agent_reloads: {
        Row: {
          config_id: string | null
          config_version: number | null
          created_at: string
          id: string
          notes: string | null
          outcome: string
          server_id: string
        }
        Insert: {
          config_id?: string | null
          config_version?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          outcome: string
          server_id: string
        }
        Update: {
          config_id?: string | null
          config_version?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          outcome?: string
          server_id?: string
        }
        Relationships: []
      }
      audit_events: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          meta: Json
          server_id: string | null
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          meta?: Json
          server_id?: string | null
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          meta?: Json
          server_id?: string | null
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: false
            referencedRelation: "servers"
            referencedColumns: ["id"]
          },
        ]
      }
      call_records: {
        Row: {
          accountcode: string | null
          amaflags: string | null
          answer_ts: string | null
          billsec: number
          channel: string | null
          created_at: string
          disposition: Database["public"]["Enums"]["call_disposition"]
          dst: string | null
          dst_channel: string | null
          duration: number
          encrypted: boolean
          end_ts: string | null
          id: string
          lastapp: string | null
          lastdata: string | null
          linkedid: string | null
          server_id: string
          src: string | null
          start_ts: string
          uniqueid: string
        }
        Insert: {
          accountcode?: string | null
          amaflags?: string | null
          answer_ts?: string | null
          billsec?: number
          channel?: string | null
          created_at?: string
          disposition?: Database["public"]["Enums"]["call_disposition"]
          dst?: string | null
          dst_channel?: string | null
          duration?: number
          encrypted?: boolean
          end_ts?: string | null
          id?: string
          lastapp?: string | null
          lastdata?: string | null
          linkedid?: string | null
          server_id: string
          src?: string | null
          start_ts: string
          uniqueid: string
        }
        Update: {
          accountcode?: string | null
          amaflags?: string | null
          answer_ts?: string | null
          billsec?: number
          channel?: string | null
          created_at?: string
          disposition?: Database["public"]["Enums"]["call_disposition"]
          dst?: string | null
          dst_channel?: string | null
          duration?: number
          encrypted?: boolean
          end_ts?: string | null
          id?: string
          lastapp?: string | null
          lastdata?: string | null
          linkedid?: string | null
          server_id?: string
          src?: string | null
          start_ts?: string
          uniqueid?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_records_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: false
            referencedRelation: "servers"
            referencedColumns: ["id"]
          },
        ]
      }
      endpoints: {
        Row: {
          codecs: string[]
          context: string
          created_at: string
          display_name: string | null
          extension: string
          id: string
          max_contacts: number
          password_hash: string | null
          server_id: string
          srtp_required: boolean
          tls_required: boolean
          transport: string
          updated_at: string
        }
        Insert: {
          codecs?: string[]
          context?: string
          created_at?: string
          display_name?: string | null
          extension: string
          id?: string
          max_contacts?: number
          password_hash?: string | null
          server_id: string
          srtp_required?: boolean
          tls_required?: boolean
          transport?: string
          updated_at?: string
        }
        Update: {
          codecs?: string[]
          context?: string
          created_at?: string
          display_name?: string | null
          extension?: string
          id?: string
          max_contacts?: number
          password_hash?: string | null
          server_id?: string
          srtp_required?: boolean
          tls_required?: boolean
          transport?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "endpoints_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: false
            referencedRelation: "servers"
            referencedColumns: ["id"]
          },
        ]
      }
      hardening_profiles: {
        Row: {
          ami_lockdown: boolean
          fail2ban_enabled: boolean
          id: string
          iptables_enabled: boolean
          rtp_port_end: number
          rtp_port_start: number
          server_id: string
          srtp_only: boolean
          ssh_hardening: boolean
          tls_only: boolean
          updated_at: string
        }
        Insert: {
          ami_lockdown?: boolean
          fail2ban_enabled?: boolean
          id?: string
          iptables_enabled?: boolean
          rtp_port_end?: number
          rtp_port_start?: number
          server_id: string
          srtp_only?: boolean
          ssh_hardening?: boolean
          tls_only?: boolean
          updated_at?: string
        }
        Update: {
          ami_lockdown?: boolean
          fail2ban_enabled?: boolean
          id?: string
          iptables_enabled?: boolean
          rtp_port_end?: number
          rtp_port_start?: number
          server_id?: string
          srtp_only?: boolean
          ssh_hardening?: boolean
          tls_only?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hardening_profiles_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: true
            referencedRelation: "servers"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          created_at: string
          delivered_email: boolean
          delivered_webhook: boolean
          id: string
          kind: string
          message: string | null
          meta: Json
          server_id: string | null
          severity: string
          title: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          created_at?: string
          delivered_email?: boolean
          delivered_webhook?: boolean
          id?: string
          kind: string
          message?: string | null
          meta?: Json
          server_id?: string | null
          severity: string
          title: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          created_at?: string
          delivered_email?: boolean
          delivered_webhook?: boolean
          id?: string
          kind?: string
          message?: string | null
          meta?: Json
          server_id?: string | null
          severity?: string
          title?: string
        }
        Relationships: []
      }
      pjsip_configs: {
        Row: {
          applied_at: string | null
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          rendered_text: string
          server_id: string
          state: Database["public"]["Enums"]["config_state"]
          version: number
        }
        Insert: {
          applied_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          rendered_text: string
          server_id: string
          state?: Database["public"]["Enums"]["config_state"]
          version: number
        }
        Update: {
          applied_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          rendered_text?: string
          server_id?: string
          state?: Database["public"]["Enums"]["config_state"]
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "pjsip_configs_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: false
            referencedRelation: "servers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      servers: {
        Row: {
          active_calls: number
          agent_token_hash: string | null
          agent_version: string | null
          alert_email: string | null
          asterisk_version: string | null
          cert_critical_days: number
          cert_expires_at: string | null
          cert_warn_days: number
          created_at: string
          description: string | null
          enrollment_token_hash: string | null
          hostname: string | null
          id: string
          last_seen_at: string | null
          name: string
          owner_id: string
          region: string | null
          status: Database["public"]["Enums"]["server_status"]
          updated_at: string
          webhook_url: string | null
        }
        Insert: {
          active_calls?: number
          agent_token_hash?: string | null
          agent_version?: string | null
          alert_email?: string | null
          asterisk_version?: string | null
          cert_critical_days?: number
          cert_expires_at?: string | null
          cert_warn_days?: number
          created_at?: string
          description?: string | null
          enrollment_token_hash?: string | null
          hostname?: string | null
          id?: string
          last_seen_at?: string | null
          name: string
          owner_id: string
          region?: string | null
          status?: Database["public"]["Enums"]["server_status"]
          updated_at?: string
          webhook_url?: string | null
        }
        Update: {
          active_calls?: number
          agent_token_hash?: string | null
          agent_version?: string | null
          alert_email?: string | null
          asterisk_version?: string | null
          cert_critical_days?: number
          cert_expires_at?: string | null
          cert_warn_days?: number
          created_at?: string
          description?: string | null
          enrollment_token_hash?: string | null
          hostname?: string | null
          id?: string
          last_seen_at?: string | null
          name?: string
          owner_id?: string
          region?: string | null
          status?: Database["public"]["Enums"]["server_status"]
          updated_at?: string
          webhook_url?: string | null
        }
        Relationships: []
      }
      tls_certs: {
        Row: {
          applied_at: string | null
          cert_pem: string | null
          created_at: string
          domain: string | null
          fingerprint_sha256: string
          id: string
          is_self_signed: boolean
          issuer: string | null
          last_error: string | null
          le_email: string | null
          not_after: string
          not_before: string | null
          requested_by: string | null
          server_id: string
          source: Database["public"]["Enums"]["cert_source"]
          state: Database["public"]["Enums"]["cert_state"]
          subject: string
        }
        Insert: {
          applied_at?: string | null
          cert_pem?: string | null
          created_at?: string
          domain?: string | null
          fingerprint_sha256: string
          id?: string
          is_self_signed?: boolean
          issuer?: string | null
          last_error?: string | null
          le_email?: string | null
          not_after: string
          not_before?: string | null
          requested_by?: string | null
          server_id: string
          source?: Database["public"]["Enums"]["cert_source"]
          state?: Database["public"]["Enums"]["cert_state"]
          subject: string
        }
        Update: {
          applied_at?: string | null
          cert_pem?: string | null
          created_at?: string
          domain?: string | null
          fingerprint_sha256?: string
          id?: string
          is_self_signed?: boolean
          issuer?: string | null
          last_error?: string | null
          le_email?: string | null
          not_after?: string
          not_before?: string | null
          requested_by?: string | null
          server_id?: string
          source?: Database["public"]["Enums"]["cert_source"]
          state?: Database["public"]["Enums"]["cert_state"]
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "tls_certs_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: false
            referencedRelation: "servers"
            referencedColumns: ["id"]
          },
        ]
      }
      trunks: {
        Row: {
          created_at: string
          host: string
          id: string
          name: string
          password_hash: string | null
          port: number
          provider: string | null
          server_id: string
          srtp_required: boolean
          transport: string
          username: string | null
        }
        Insert: {
          created_at?: string
          host: string
          id?: string
          name: string
          password_hash?: string | null
          port?: number
          provider?: string | null
          server_id: string
          srtp_required?: boolean
          transport?: string
          username?: string | null
        }
        Update: {
          created_at?: string
          host?: string
          id?: string
          name?: string
          password_hash?: string | null
          port?: number
          provider?: string | null
          server_id?: string
          srtp_required?: boolean
          transport?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trunks_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: false
            referencedRelation: "servers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "operator" | "viewer"
      call_disposition:
        | "ANSWERED"
        | "NO_ANSWER"
        | "BUSY"
        | "FAILED"
        | "REJECTED"
        | "CONGESTION"
        | "UNKNOWN"
      cert_source: "uploaded" | "letsencrypt" | "self_signed"
      cert_state: "pending" | "active" | "failed" | "superseded"
      config_state: "draft" | "pending" | "applied" | "failed" | "reverted"
      server_status: "pending" | "online" | "degraded" | "offline"
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
  public: {
    Enums: {
      app_role: ["admin", "operator", "viewer"],
      call_disposition: [
        "ANSWERED",
        "NO_ANSWER",
        "BUSY",
        "FAILED",
        "REJECTED",
        "CONGESTION",
        "UNKNOWN",
      ],
      cert_source: ["uploaded", "letsencrypt", "self_signed"],
      cert_state: ["pending", "active", "failed", "superseded"],
      config_state: ["draft", "pending", "applied", "failed", "reverted"],
      server_status: ["pending", "online", "degraded", "offline"],
    },
  },
} as const
