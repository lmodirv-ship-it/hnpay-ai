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
      audit_logs: {
        Row: {
          action: string
          after_data: Json | null
          before_data: Json | null
          created_at: string
          entity_id: string | null
          entity_table: string | null
          id: string
          ip_address: string | null
          metadata: Json
          project_id: string | null
          site_id: string | null
          status: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_table?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json
          project_id?: string | null
          site_id?: string | null
          status?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_table?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json
          project_id?: string | null
          site_id?: string | null
          status?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "hn_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_invoices: {
        Row: {
          created_at: string
          created_by: string | null
          currency: string
          customer_id: string | null
          discount_amount: number
          due_at: string | null
          id: string
          invoice_number: string
          issued_at: string
          metadata: Json
          notes: string | null
          paid_at: string | null
          payment_id: string | null
          pdf_url: string | null
          project_id: string | null
          public_id: string
          site_id: string | null
          status: string
          subscription_id: string | null
          subtotal: number
          tax_amount: number
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_id?: string | null
          discount_amount?: number
          due_at?: string | null
          id?: string
          invoice_number: string
          issued_at?: string
          metadata?: Json
          notes?: string | null
          paid_at?: string | null
          payment_id?: string | null
          pdf_url?: string | null
          project_id?: string | null
          public_id?: string
          site_id?: string | null
          status?: string
          subscription_id?: string | null
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_id?: string | null
          discount_amount?: number
          due_at?: string | null
          id?: string
          invoice_number?: string
          issued_at?: string
          metadata?: Json
          notes?: string | null
          paid_at?: string | null
          payment_id?: string | null
          pdf_url?: string | null
          project_id?: string | null
          public_id?: string
          site_id?: string | null
          status?: string
          subscription_id?: string | null
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_invoices_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "hn_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_invoices_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_categories: {
        Row: {
          code: string
          created_at: string
          description_ar: string | null
          description_en: string | null
          display_order: number
          icon: string | null
          id: string
          is_active: boolean
          name_ar: string
          name_en: string | null
          parent_id: string | null
          project_id: string | null
          site_id: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          is_active?: boolean
          name_ar: string
          name_en?: string | null
          parent_id?: string | null
          project_id?: string | null
          site_id: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          is_active?: boolean
          name_ar?: string
          name_en?: string | null
          parent_id?: string | null
          project_id?: string | null
          site_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "catalog_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_categories_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "hn_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_categories_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_features: {
        Row: {
          catalog_item_id: string
          created_at: string
          display_order: number
          feature_key: string | null
          id: string
          included: boolean
          name_ar: string
          name_en: string | null
          updated_at: string
          value_number: number | null
          value_text: string | null
        }
        Insert: {
          catalog_item_id: string
          created_at?: string
          display_order?: number
          feature_key?: string | null
          id?: string
          included?: boolean
          name_ar: string
          name_en?: string | null
          updated_at?: string
          value_number?: number | null
          value_text?: string | null
        }
        Update: {
          catalog_item_id?: string
          created_at?: string
          display_order?: number
          feature_key?: string | null
          id?: string
          included?: boolean
          name_ar?: string
          name_en?: string | null
          updated_at?: string
          value_number?: number | null
          value_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "catalog_features_catalog_item_id_fkey"
            columns: ["catalog_item_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_item_providers: {
        Row: {
          catalog_item_id: string
          created_at: string
          id: string
          is_default: boolean
          is_enabled: boolean
          project_id: string | null
          provider_id: string
          site_id: string
          updated_at: string
        }
        Insert: {
          catalog_item_id: string
          created_at?: string
          id?: string
          is_default?: boolean
          is_enabled?: boolean
          project_id?: string | null
          provider_id: string
          site_id: string
          updated_at?: string
        }
        Update: {
          catalog_item_id?: string
          created_at?: string
          id?: string
          is_default?: boolean
          is_enabled?: boolean
          project_id?: string | null
          provider_id?: string
          site_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_item_providers_catalog_item_id_fkey"
            columns: ["catalog_item_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_item_providers_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "hn_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_item_providers_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "payment_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_item_providers_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_items: {
        Row: {
          category_id: string | null
          created_at: string
          created_by: string | null
          description_ar: string | null
          description_en: string | null
          id: string
          image_url: string | null
          is_public: boolean
          item_code: string
          item_type: string
          metadata: Json
          name_ar: string
          name_en: string | null
          project_id: string | null
          requires_approval: boolean
          share_with_group: boolean
          short_description_ar: string | null
          short_description_en: string | null
          site_id: string
          slug: string | null
          status: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          description_ar?: string | null
          description_en?: string | null
          id?: string
          image_url?: string | null
          is_public?: boolean
          item_code: string
          item_type: string
          metadata?: Json
          name_ar: string
          name_en?: string | null
          project_id?: string | null
          requires_approval?: boolean
          share_with_group?: boolean
          short_description_ar?: string | null
          short_description_en?: string | null
          site_id: string
          slug?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          description_ar?: string | null
          description_en?: string | null
          id?: string
          image_url?: string | null
          is_public?: boolean
          item_code?: string
          item_type?: string
          metadata?: Json
          name_ar?: string
          name_en?: string | null
          project_id?: string | null
          requires_approval?: boolean
          share_with_group?: boolean
          short_description_ar?: string | null
          short_description_en?: string | null
          site_id?: string
          slug?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "catalog_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "hn_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_items_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_prices: {
        Row: {
          amount: number | null
          billing_interval: string | null
          billing_type: string
          catalog_item_id: string
          created_at: string
          currency: string
          id: string
          interval_count: number
          is_active: boolean
          is_default: boolean
          maximum_quantity: number | null
          metadata: Json
          minimum_quantity: number
          name_ar: string | null
          name_en: string | null
          price_code: string
          project_id: string | null
          setup_fee: number
          site_id: string
          tax_behavior: string
          tax_rate: number
          trial_days: number
          updated_at: string
        }
        Insert: {
          amount?: number | null
          billing_interval?: string | null
          billing_type: string
          catalog_item_id: string
          created_at?: string
          currency?: string
          id?: string
          interval_count?: number
          is_active?: boolean
          is_default?: boolean
          maximum_quantity?: number | null
          metadata?: Json
          minimum_quantity?: number
          name_ar?: string | null
          name_en?: string | null
          price_code: string
          project_id?: string | null
          setup_fee?: number
          site_id: string
          tax_behavior?: string
          tax_rate?: number
          trial_days?: number
          updated_at?: string
        }
        Update: {
          amount?: number | null
          billing_interval?: string | null
          billing_type?: string
          catalog_item_id?: string
          created_at?: string
          currency?: string
          id?: string
          interval_count?: number
          is_active?: boolean
          is_default?: boolean
          maximum_quantity?: number | null
          metadata?: Json
          minimum_quantity?: number
          name_ar?: string | null
          name_en?: string | null
          price_code?: string
          project_id?: string | null
          setup_fee?: number
          site_id?: string
          tax_behavior?: string
          tax_rate?: number
          trial_days?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_prices_catalog_item_id_fkey"
            columns: ["catalog_item_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_prices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "hn_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_prices_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      checkout_sessions: {
        Row: {
          amount: number
          awaiting_reference: string | null
          cancel_url: string | null
          client_token: string | null
          client_token_expires_at: string | null
          completed_at: string | null
          created_at: string
          currency: string
          customer_email: string | null
          customer_external_id: string | null
          customer_name: string | null
          display_mode: string
          domain_id: string | null
          expires_at: string
          group_free_applied: boolean
          group_free_reason: string | null
          id: string
          metadata: Json | null
          plan_id: string
          project_id: string | null
          provider: string
          provider_checkout_url: string | null
          provider_details: Json
          provider_session_id: string | null
          public_id: string
          site_id: string
          status: string
          success_url: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          awaiting_reference?: string | null
          cancel_url?: string | null
          client_token?: string | null
          client_token_expires_at?: string | null
          completed_at?: string | null
          created_at?: string
          currency: string
          customer_email?: string | null
          customer_external_id?: string | null
          customer_name?: string | null
          display_mode?: string
          domain_id?: string | null
          expires_at?: string
          group_free_applied?: boolean
          group_free_reason?: string | null
          id?: string
          metadata?: Json | null
          plan_id: string
          project_id?: string | null
          provider?: string
          provider_checkout_url?: string | null
          provider_details?: Json
          provider_session_id?: string | null
          public_id?: string
          site_id: string
          status?: string
          success_url?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          awaiting_reference?: string | null
          cancel_url?: string | null
          client_token?: string | null
          client_token_expires_at?: string | null
          completed_at?: string | null
          created_at?: string
          currency?: string
          customer_email?: string | null
          customer_external_id?: string | null
          customer_name?: string | null
          display_mode?: string
          domain_id?: string | null
          expires_at?: string
          group_free_applied?: boolean
          group_free_reason?: string | null
          id?: string
          metadata?: Json | null
          plan_id?: string
          project_id?: string | null
          provider?: string
          provider_checkout_url?: string | null
          provider_details?: Json
          provider_session_id?: string | null
          public_id?: string
          site_id?: string
          status?: string
          success_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkout_sessions_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "project_domains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkout_sessions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkout_sessions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "hn_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkout_sessions_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      consumer_wallets: {
        Row: {
          balance_eur: number
          balance_mad: number
          balance_usd: number
          created_at: string
          email: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance_eur?: number
          balance_mad?: number
          balance_usd?: number
          created_at?: string
          email?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance_eur?: number
          balance_mad?: number
          balance_usd?: number
          created_at?: string
          email?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          created_at: string
          domain_id: string | null
          email: string | null
          external_id: string
          id: string
          metadata: Json | null
          name: string | null
          project_id: string | null
          provider: string
          provider_customer_id: string | null
          site_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          domain_id?: string | null
          email?: string | null
          external_id: string
          id?: string
          metadata?: Json | null
          name?: string | null
          project_id?: string | null
          provider?: string
          provider_customer_id?: string | null
          site_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          domain_id?: string | null
          email?: string | null
          external_id?: string
          id?: string
          metadata?: Json | null
          name?: string | null
          project_id?: string | null
          provider?: string
          provider_customer_id?: string | null
          site_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "project_domains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "hn_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      google_sync_events: {
        Row: {
          attempts: number
          created_at: string
          event_type: string
          google_destination: string
          id: string
          last_error: string | null
          payload: Json
          sync_status: string
          synced_at: string | null
        }
        Insert: {
          attempts?: number
          created_at?: string
          event_type: string
          google_destination: string
          id?: string
          last_error?: string | null
          payload?: Json
          sync_status?: string
          synced_at?: string | null
        }
        Update: {
          attempts?: number
          created_at?: string
          event_type?: string
          google_destination?: string
          id?: string
          last_error?: string | null
          payload?: Json
          sync_status?: string
          synced_at?: string | null
        }
        Relationships: []
      }
      hn_apps: {
        Row: {
          active: boolean
          app_id: string
          category: string | null
          created_at: string
          description: string | null
          domain: string | null
          id: string
          name: string
        }
        Insert: {
          active?: boolean
          app_id: string
          category?: string | null
          created_at?: string
          description?: string | null
          domain?: string | null
          id?: string
          name: string
        }
        Update: {
          active?: boolean
          app_id?: string
          category?: string | null
          created_at?: string
          description?: string | null
          domain?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      hn_group_members: {
        Row: {
          created_at: string
          email: string | null
          is_active: boolean
          joined_at: string
          joined_via_site_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          is_active?: boolean
          joined_at?: string
          joined_via_site_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          is_active?: boolean
          joined_at?: string
          joined_via_site_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hn_group_members_joined_via_site_id_fkey"
            columns: ["joined_via_site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      hn_projects: {
        Row: {
          api_enabled: boolean
          arr_cached: number
          brand_color: string | null
          category: string | null
          code: string
          connection_status: string
          created_at: string
          created_by: string | null
          default_currency: string
          default_provider_id: string | null
          description: string | null
          environment: string
          financial_metrics_updated_at: string | null
          id: string
          integration_mode: string
          invoices_enabled: boolean
          last_seen_at: string | null
          logo_url: string | null
          mrr_cached: number
          name: string
          owner_id: string | null
          payments_enabled: boolean
          primary_domain: string | null
          project_type: string | null
          status: string
          subscriptions_enabled: boolean
          updated_at: string
          webhooks_enabled: boolean
        }
        Insert: {
          api_enabled?: boolean
          arr_cached?: number
          brand_color?: string | null
          category?: string | null
          code: string
          connection_status?: string
          created_at?: string
          created_by?: string | null
          default_currency?: string
          default_provider_id?: string | null
          description?: string | null
          environment?: string
          financial_metrics_updated_at?: string | null
          id?: string
          integration_mode?: string
          invoices_enabled?: boolean
          last_seen_at?: string | null
          logo_url?: string | null
          mrr_cached?: number
          name: string
          owner_id?: string | null
          payments_enabled?: boolean
          primary_domain?: string | null
          project_type?: string | null
          status?: string
          subscriptions_enabled?: boolean
          updated_at?: string
          webhooks_enabled?: boolean
        }
        Update: {
          api_enabled?: boolean
          arr_cached?: number
          brand_color?: string | null
          category?: string | null
          code?: string
          connection_status?: string
          created_at?: string
          created_by?: string | null
          default_currency?: string
          default_provider_id?: string | null
          description?: string | null
          environment?: string
          financial_metrics_updated_at?: string | null
          id?: string
          integration_mode?: string
          invoices_enabled?: boolean
          last_seen_at?: string | null
          logo_url?: string | null
          mrr_cached?: number
          name?: string
          owner_id?: string | null
          payments_enabled?: boolean
          primary_domain?: string | null
          project_type?: string | null
          status?: string
          subscriptions_enabled?: boolean
          updated_at?: string
          webhooks_enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "hn_projects_default_provider_id_fkey"
            columns: ["default_provider_id"]
            isOneToOne: false
            referencedRelation: "payment_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      hn_subscriptions: {
        Row: {
          app_id: string
          created_at: string
          id: string
          plan: string
          quota: number
          renews_at: string | null
          status: string
          used: number
          user_id: string
        }
        Insert: {
          app_id: string
          created_at?: string
          id?: string
          plan?: string
          quota?: number
          renews_at?: string | null
          status?: string
          used?: number
          user_id: string
        }
        Update: {
          app_id?: string
          created_at?: string
          id?: string
          plan?: string
          quota?: number
          renews_at?: string | null
          status?: string
          used?: number
          user_id?: string
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          catalog_item_id: string | null
          catalog_price_id: string | null
          created_at: string
          description: string
          discount_amount: number
          id: string
          invoice_id: string
          line_total: number
          metadata: Json
          plan_id: string | null
          quantity: number
          tax_amount: number
          unit_price: number
        }
        Insert: {
          catalog_item_id?: string | null
          catalog_price_id?: string | null
          created_at?: string
          description: string
          discount_amount?: number
          id?: string
          invoice_id: string
          line_total?: number
          metadata?: Json
          plan_id?: string | null
          quantity?: number
          tax_amount?: number
          unit_price?: number
        }
        Update: {
          catalog_item_id?: string | null
          catalog_price_id?: string | null
          created_at?: string
          description?: string
          discount_amount?: number
          id?: string
          invoice_id?: string
          line_total?: number
          metadata?: Json
          plan_id?: string | null
          quantity?: number
          tax_amount?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_catalog_item_id_fkey"
            columns: ["catalog_item_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_catalog_price_id_fkey"
            columns: ["catalog_price_id"]
            isOneToOne: false
            referencedRelation: "catalog_prices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "billing_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_providers: {
        Row: {
          api_key: string | null
          code: string
          created_at: string
          created_by: string | null
          display_name: string
          environment: string
          extra: Json
          fee_fixed: number
          fee_percent: number
          id: string
          is_default: boolean
          is_enabled: boolean
          last_test_message: string | null
          last_test_status: string | null
          last_tested_at: string | null
          merchant_id: string | null
          project_id: string | null
          public_key: string | null
          secret_key: string | null
          site_id: string | null
          supported_countries: string[]
          supported_currencies: string[]
          tax_mode: string
          updated_at: string
          webhook_secret: string | null
        }
        Insert: {
          api_key?: string | null
          code: string
          created_at?: string
          created_by?: string | null
          display_name: string
          environment?: string
          extra?: Json
          fee_fixed?: number
          fee_percent?: number
          id?: string
          is_default?: boolean
          is_enabled?: boolean
          last_test_message?: string | null
          last_test_status?: string | null
          last_tested_at?: string | null
          merchant_id?: string | null
          project_id?: string | null
          public_key?: string | null
          secret_key?: string | null
          site_id?: string | null
          supported_countries?: string[]
          supported_currencies?: string[]
          tax_mode?: string
          updated_at?: string
          webhook_secret?: string | null
        }
        Update: {
          api_key?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          display_name?: string
          environment?: string
          extra?: Json
          fee_fixed?: number
          fee_percent?: number
          id?: string
          is_default?: boolean
          is_enabled?: boolean
          last_test_message?: string | null
          last_test_status?: string | null
          last_tested_at?: string | null
          merchant_id?: string | null
          project_id?: string | null
          public_key?: string | null
          secret_key?: string | null
          site_id?: string | null
          supported_countries?: string[]
          supported_currencies?: string[]
          tax_mode?: string
          updated_at?: string
          webhook_secret?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_providers_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "hn_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_providers_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          checkout_session_id: string | null
          created_at: string
          currency: string
          customer_id: string | null
          domain_id: string | null
          id: string
          metadata: Json | null
          notes: string | null
          plan_id: string | null
          project_id: string | null
          provider: string | null
          provider_invoice_id: string | null
          provider_payment_id: string | null
          provider_ref: string | null
          public_id: string
          settled_at: string | null
          settled_by: string | null
          site_id: string
          status: string
        }
        Insert: {
          amount: number
          checkout_session_id?: string | null
          created_at?: string
          currency: string
          customer_id?: string | null
          domain_id?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          plan_id?: string | null
          project_id?: string | null
          provider?: string | null
          provider_invoice_id?: string | null
          provider_payment_id?: string | null
          provider_ref?: string | null
          public_id?: string
          settled_at?: string | null
          settled_by?: string | null
          site_id: string
          status?: string
        }
        Update: {
          amount?: number
          checkout_session_id?: string | null
          created_at?: string
          currency?: string
          customer_id?: string | null
          domain_id?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          plan_id?: string | null
          project_id?: string | null
          provider?: string | null
          provider_invoice_id?: string | null
          provider_payment_id?: string | null
          provider_ref?: string | null
          public_id?: string
          settled_at?: string | null
          settled_by?: string | null
          site_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_checkout_session_id_fkey"
            columns: ["checkout_session_id"]
            isOneToOne: false
            referencedRelation: "checkout_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "project_domains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "hn_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          amount: number
          billing_interval: string | null
          catalog_item_id: string | null
          catalog_price_id: string | null
          category_id: string | null
          code: string
          created_at: string
          currency: string
          description: string | null
          domain_id: string | null
          id: string
          is_active: boolean
          name: string
          project_id: string | null
          provider: string | null
          provider_price_id: string | null
          provider_product_id: string | null
          share_with_group: boolean
          site_id: string | null
          trial_days: number | null
          updated_at: string
        }
        Insert: {
          amount: number
          billing_interval?: string | null
          catalog_item_id?: string | null
          catalog_price_id?: string | null
          category_id?: string | null
          code: string
          created_at?: string
          currency?: string
          description?: string | null
          domain_id?: string | null
          id?: string
          is_active?: boolean
          name: string
          project_id?: string | null
          provider?: string | null
          provider_price_id?: string | null
          provider_product_id?: string | null
          share_with_group?: boolean
          site_id?: string | null
          trial_days?: number | null
          updated_at?: string
        }
        Update: {
          amount?: number
          billing_interval?: string | null
          catalog_item_id?: string | null
          catalog_price_id?: string | null
          category_id?: string | null
          code?: string
          created_at?: string
          currency?: string
          description?: string | null
          domain_id?: string | null
          id?: string
          is_active?: boolean
          name?: string
          project_id?: string | null
          provider?: string | null
          provider_price_id?: string | null
          provider_product_id?: string | null
          share_with_group?: boolean
          site_id?: string | null
          trial_days?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plans_catalog_item_id_fkey"
            columns: ["catalog_item_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plans_catalog_price_id_fkey"
            columns: ["catalog_price_id"]
            isOneToOne: false
            referencedRelation: "catalog_prices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plans_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plans_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "project_domains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plans_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "hn_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plans_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_tokens: {
        Row: {
          created_at: string
          customer_id: string
          expires_at: string
          project_id: string | null
          site_id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          customer_id: string
          expires_at?: string
          project_id?: string | null
          site_id: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string
          expires_at?: string
          project_id?: string | null
          site_id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portal_tokens_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_tokens_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "hn_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_tokens_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolios: {
        Row: {
          brand_color: string | null
          created_at: string
          created_by: string | null
          default_currency: string
          default_provider: string | null
          description: string | null
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          brand_color?: string | null
          created_at?: string
          created_by?: string | null
          default_currency?: string
          default_provider?: string | null
          description?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          brand_color?: string | null
          created_at?: string
          created_by?: string | null
          default_currency?: string
          default_provider?: string | null
          description?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      processed_webhook_events: {
        Row: {
          event_id: string
          processed_at: string
          source: string
        }
        Insert: {
          event_id: string
          processed_at?: string
          source: string
        }
        Update: {
          event_id?: string
          processed_at?: string
          source?: string
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          color: string | null
          created_at: string
          created_by: string | null
          description: string | null
          display_order: number
          icon: string | null
          id: string
          is_active: boolean
          metadata: Json
          name: string
          parent_id: string | null
          project_id: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json
          name: string
          parent_id?: string | null
          project_id?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json
          name?: string
          parent_id?: string | null
          project_id?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_categories_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "hn_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      products_services: {
        Row: {
          allowed_providers: string[]
          billing_type: string
          category: string | null
          category_id: string | null
          created_at: string
          created_by: string | null
          currency: string
          customers_count: number
          description: string | null
          display_order: number
          domain_id: string | null
          id: string
          image_url: string | null
          is_renewable: boolean
          is_taxable: boolean
          keywords: string | null
          metadata: Json
          name: string
          price: number
          product_code: string
          project_id: string | null
          requires_approval: boolean
          sales_count: number
          setup_fee: number
          site_id: string | null
          slug: string | null
          status: string
          subscription_interval: string | null
          tags: string[]
          tax_rate: number
          total_revenue: number
          trial_days: number
          type: string
          updated_at: string
          visible_in_store: boolean
        }
        Insert: {
          allowed_providers?: string[]
          billing_type?: string
          category?: string | null
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          customers_count?: number
          description?: string | null
          display_order?: number
          domain_id?: string | null
          id?: string
          image_url?: string | null
          is_renewable?: boolean
          is_taxable?: boolean
          keywords?: string | null
          metadata?: Json
          name: string
          price?: number
          product_code?: string
          project_id?: string | null
          requires_approval?: boolean
          sales_count?: number
          setup_fee?: number
          site_id?: string | null
          slug?: string | null
          status?: string
          subscription_interval?: string | null
          tags?: string[]
          tax_rate?: number
          total_revenue?: number
          trial_days?: number
          type?: string
          updated_at?: string
          visible_in_store?: boolean
        }
        Update: {
          allowed_providers?: string[]
          billing_type?: string
          category?: string | null
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          customers_count?: number
          description?: string | null
          display_order?: number
          domain_id?: string | null
          id?: string
          image_url?: string | null
          is_renewable?: boolean
          is_taxable?: boolean
          keywords?: string | null
          metadata?: Json
          name?: string
          price?: number
          product_code?: string
          project_id?: string | null
          requires_approval?: boolean
          sales_count?: number
          setup_fee?: number
          site_id?: string | null
          slug?: string | null
          status?: string
          subscription_interval?: string | null
          tags?: string[]
          tax_rate?: number
          total_revenue?: number
          trial_days?: number
          type?: string
          updated_at?: string
          visible_in_store?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "products_services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_services_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "project_domains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_services_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "hn_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_services_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          origin_app: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          origin_app?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          origin_app?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      project_api_keys: {
        Row: {
          created_at: string
          environment: string
          id: string
          label: string | null
          last_used_at: string | null
          project_id: string
          public_key: string
          secret_key_hash: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          environment?: string
          id?: string
          label?: string | null
          last_used_at?: string | null
          project_id: string
          public_key: string
          secret_key_hash: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          environment?: string
          id?: string
          label?: string | null
          last_used_at?: string | null
          project_id?: string
          public_key?: string
          secret_key_hash?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_api_keys_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "hn_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_domains: {
        Row: {
          created_at: string
          domain: string
          domain_type: string
          environment: string
          id: string
          is_primary: boolean
          notes: string | null
          payments_enabled: boolean
          project_id: string
          updated_at: string
          verification_status: string
        }
        Insert: {
          created_at?: string
          domain: string
          domain_type?: string
          environment?: string
          id?: string
          is_primary?: boolean
          notes?: string | null
          payments_enabled?: boolean
          project_id: string
          updated_at?: string
          verification_status?: string
        }
        Update: {
          created_at?: string
          domain?: string
          domain_type?: string
          environment?: string
          id?: string
          is_primary?: boolean
          notes?: string | null
          payments_enabled?: boolean
          project_id?: string
          updated_at?: string
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_domains_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "hn_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_payment_settings: {
        Row: {
          checkout_enabled: boolean
          created_at: string
          invoices_enabled: boolean
          project_id: string
          provider_id: string
          refunds_enabled: boolean
          subscriptions_enabled: boolean
          updated_at: string
        }
        Insert: {
          checkout_enabled?: boolean
          created_at?: string
          invoices_enabled?: boolean
          project_id: string
          provider_id: string
          refunds_enabled?: boolean
          subscriptions_enabled?: boolean
          updated_at?: string
        }
        Update: {
          checkout_enabled?: boolean
          created_at?: string
          invoices_enabled?: boolean
          project_id?: string
          provider_id?: string
          refunds_enabled?: boolean
          subscriptions_enabled?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_payment_settings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "hn_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_payment_settings_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "payment_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      project_settings: {
        Row: {
          ai_support_enabled: boolean
          branding: Json
          created_at: string
          default_webhook_url: string | null
          id: string
          invoice_footer: string | null
          invoice_prefix: string | null
          legal_address: Json
          locale: string
          metadata: Json
          notification_emails: string[]
          project_id: string
          tax_id: string | null
          timezone: string
          updated_at: string
          webhook_signing_algo: string
        }
        Insert: {
          ai_support_enabled?: boolean
          branding?: Json
          created_at?: string
          default_webhook_url?: string | null
          id?: string
          invoice_footer?: string | null
          invoice_prefix?: string | null
          legal_address?: Json
          locale?: string
          metadata?: Json
          notification_emails?: string[]
          project_id: string
          tax_id?: string | null
          timezone?: string
          updated_at?: string
          webhook_signing_algo?: string
        }
        Update: {
          ai_support_enabled?: boolean
          branding?: Json
          created_at?: string
          default_webhook_url?: string | null
          id?: string
          invoice_footer?: string | null
          invoice_prefix?: string | null
          legal_address?: Json
          locale?: string
          metadata?: Json
          notification_emails?: string[]
          project_id?: string
          tax_id?: string | null
          timezone?: string
          updated_at?: string
          webhook_signing_algo?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_settings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "hn_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_events: {
        Row: {
          event_type: string
          id: string
          payload: Json
          processed_at: string
          provider: string
          provider_event_id: string
        }
        Insert: {
          event_type: string
          id?: string
          payload: Json
          processed_at?: string
          provider: string
          provider_event_id: string
        }
        Update: {
          event_type?: string
          id?: string
          payload?: Json
          processed_at?: string
          provider?: string
          provider_event_id?: string
        }
        Relationships: []
      }
      refunds: {
        Row: {
          amount: number
          approved_by: string | null
          created_at: string
          currency: string
          failure_reason: string | null
          id: string
          invoice_id: string | null
          metadata: Json
          payment_id: string
          processed_at: string | null
          project_id: string | null
          provider: string | null
          provider_refund_id: string | null
          public_id: string
          reason: string | null
          requested_by: string | null
          site_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          approved_by?: string | null
          created_at?: string
          currency?: string
          failure_reason?: string | null
          id?: string
          invoice_id?: string | null
          metadata?: Json
          payment_id: string
          processed_at?: string | null
          project_id?: string | null
          provider?: string | null
          provider_refund_id?: string | null
          public_id?: string
          reason?: string | null
          requested_by?: string | null
          site_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          approved_by?: string | null
          created_at?: string
          currency?: string
          failure_reason?: string | null
          id?: string
          invoice_id?: string | null
          metadata?: Json
          payment_id?: string
          processed_at?: string | null
          project_id?: string | null
          provider?: string | null
          provider_refund_id?: string | null
          public_id?: string
          reason?: string | null
          requested_by?: string | null
          site_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "refunds_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "billing_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "hn_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          permission: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          permission: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          permission?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      routing_rules: {
        Row: {
          condition_app_category: string | null
          condition_country: string | null
          condition_currency: string | null
          created_at: string
          fallback_provider: string | null
          id: string
          is_active: boolean
          name: string | null
          primary_provider: string
          priority: number
          updated_at: string
        }
        Insert: {
          condition_app_category?: string | null
          condition_country?: string | null
          condition_currency?: string | null
          created_at?: string
          fallback_provider?: string | null
          id?: string
          is_active?: boolean
          name?: string | null
          primary_provider: string
          priority?: number
          updated_at?: string
        }
        Update: {
          condition_app_category?: string | null
          condition_country?: string | null
          condition_currency?: string | null
          created_at?: string
          fallback_provider?: string | null
          id?: string
          is_active?: boolean
          name?: string | null
          primary_provider?: string
          priority?: number
          updated_at?: string
        }
        Relationships: []
      }
      settlements: {
        Row: {
          bank_reference: string | null
          created_at: string
          currency: string
          expected_payout: number
          fee_amount: number
          gross_amount: number
          id: string
          metadata: Json
          net_amount: number
          project_id: string | null
          provider: string
          public_id: string
          reconciliation_status: string
          refund_amount: number
          settlement_date: string | null
          tax_amount: number
          unmatched_count: number
          updated_at: string
        }
        Insert: {
          bank_reference?: string | null
          created_at?: string
          currency?: string
          expected_payout?: number
          fee_amount?: number
          gross_amount?: number
          id?: string
          metadata?: Json
          net_amount?: number
          project_id?: string | null
          provider: string
          public_id?: string
          reconciliation_status?: string
          refund_amount?: number
          settlement_date?: string | null
          tax_amount?: number
          unmatched_count?: number
          updated_at?: string
        }
        Update: {
          bank_reference?: string | null
          created_at?: string
          currency?: string
          expected_payout?: number
          fee_amount?: number
          gross_amount?: number
          id?: string
          metadata?: Json
          net_amount?: number
          project_id?: string | null
          provider?: string
          public_id?: string
          reconciliation_status?: string
          refund_amount?: number
          settlement_date?: string | null
          tax_amount?: number
          unmatched_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "settlements_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "hn_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      site_api_keys: {
        Row: {
          created_at: string
          id: string
          key_hash: string
          key_prefix: string
          label: string
          last_used_at: string | null
          mode: string
          project_id: string | null
          revoked_at: string | null
          site_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          key_hash: string
          key_prefix: string
          label?: string
          last_used_at?: string | null
          mode?: string
          project_id?: string | null
          revoked_at?: string | null
          site_id: string
        }
        Update: {
          created_at?: string
          id?: string
          key_hash?: string
          key_prefix?: string
          label?: string
          last_used_at?: string | null
          mode?: string
          project_id?: string | null
          revoked_at?: string | null
          site_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_api_keys_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "hn_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_api_keys_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      sites: {
        Row: {
          adsense_enabled: boolean
          adsense_publisher_id: string | null
          allowed_origins: string[]
          allowed_providers: string[]
          api_enabled: boolean
          brand_color: string | null
          created_at: string
          created_by: string | null
          database_access: boolean
          default_provider_id: string | null
          domain: string
          domain_id: string | null
          enabled_providers: string[]
          environment: string
          google_analytics_id: string | null
          id: string
          integration_mode: string
          integration_status: string
          is_active: boolean
          is_group_site: boolean
          is_internal: boolean
          last_connection_at: string | null
          logo_url: string | null
          manual_bank_details: Json
          manual_instructions: string | null
          name: string
          portfolio_id: string | null
          project_id: string | null
          slug: string
          updated_at: string
          webhook_enabled: boolean
          webhook_secret: string
          webhook_url: string | null
        }
        Insert: {
          adsense_enabled?: boolean
          adsense_publisher_id?: string | null
          allowed_origins?: string[]
          allowed_providers?: string[]
          api_enabled?: boolean
          brand_color?: string | null
          created_at?: string
          created_by?: string | null
          database_access?: boolean
          default_provider_id?: string | null
          domain: string
          domain_id?: string | null
          enabled_providers?: string[]
          environment?: string
          google_analytics_id?: string | null
          id?: string
          integration_mode?: string
          integration_status?: string
          is_active?: boolean
          is_group_site?: boolean
          is_internal?: boolean
          last_connection_at?: string | null
          logo_url?: string | null
          manual_bank_details?: Json
          manual_instructions?: string | null
          name: string
          portfolio_id?: string | null
          project_id?: string | null
          slug: string
          updated_at?: string
          webhook_enabled?: boolean
          webhook_secret?: string
          webhook_url?: string | null
        }
        Update: {
          adsense_enabled?: boolean
          adsense_publisher_id?: string | null
          allowed_origins?: string[]
          allowed_providers?: string[]
          api_enabled?: boolean
          brand_color?: string | null
          created_at?: string
          created_by?: string | null
          database_access?: boolean
          default_provider_id?: string | null
          domain?: string
          domain_id?: string | null
          enabled_providers?: string[]
          environment?: string
          google_analytics_id?: string | null
          id?: string
          integration_mode?: string
          integration_status?: string
          is_active?: boolean
          is_group_site?: boolean
          is_internal?: boolean
          last_connection_at?: string | null
          logo_url?: string | null
          manual_bank_details?: Json
          manual_instructions?: string | null
          name?: string
          portfolio_id?: string | null
          project_id?: string | null
          slug?: string
          updated_at?: string
          webhook_enabled?: boolean
          webhook_secret?: string
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sites_default_provider_id_fkey"
            columns: ["default_provider_id"]
            isOneToOne: false
            referencedRelation: "payment_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sites_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "project_domains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sites_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sites_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "hn_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          canceled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string
          customer_id: string
          domain_id: string | null
          id: string
          metadata: Json | null
          plan_id: string
          project_id: string | null
          provider: string
          provider_ref: string | null
          provider_subscription_id: string | null
          public_id: string
          site_id: string
          status: string
          updated_at: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string
          customer_id: string
          domain_id?: string | null
          id?: string
          metadata?: Json | null
          plan_id: string
          project_id?: string | null
          provider?: string
          provider_ref?: string | null
          provider_subscription_id?: string | null
          public_id?: string
          site_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string
          customer_id?: string
          domain_id?: string | null
          id?: string
          metadata?: Json | null
          plan_id?: string
          project_id?: string | null
          provider?: string
          provider_ref?: string | null
          provider_subscription_id?: string | null
          public_id?: string
          site_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "project_domains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "hn_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          app_id: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          app_id: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          app_id?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          metadata: Json
          reference: string | null
          source_site_id: string | null
          type: string
          wallet_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency: string
          id?: string
          metadata?: Json
          reference?: string | null
          source_site_id?: string | null
          type: string
          wallet_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json
          reference?: string | null
          source_site_id?: string | null
          type?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_source_site_id_fkey"
            columns: ["source_site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "consumer_wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_events: {
        Row: {
          attempts: number
          created_at: string
          delivered: boolean
          delivered_at: string | null
          event_type: string
          id: string
          last_attempt_at: string | null
          last_response_body: string | null
          last_response_status: number | null
          payload: Json
          project_id: string | null
          public_id: string
          site_id: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          delivered?: boolean
          delivered_at?: string | null
          event_type: string
          id?: string
          last_attempt_at?: string | null
          last_response_body?: string | null
          last_response_status?: number | null
          payload: Json
          project_id?: string | null
          public_id?: string
          site_id: string
        }
        Update: {
          attempts?: number
          created_at?: string
          delivered?: boolean
          delivered_at?: string | null
          event_type?: string
          id?: string
          last_attempt_at?: string | null
          last_response_body?: string | null
          last_response_status?: number | null
          payload?: Json
          project_id?: string | null
          public_id?: string
          site_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "hn_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_events_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_invoice_number: { Args: never; Returns: string }
      is_hn_group_email: { Args: { _email: string }; Returns: boolean }
      is_hn_group_member: { Args: { _user_id: string }; Returns: boolean }
      is_protected_owner: { Args: { _user_id: string }; Returns: boolean }
      user_can_access_project: {
        Args: { _project_id: string }
        Returns: boolean
      }
      wallet_apply: {
        Args: {
          _amount: number
          _currency: string
          _email: string
          _reference: string
          _site_id: string
          _type: string
          _user_id: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role:
        | "owner"
        | "admin"
        | "manager"
        | "developer"
        | "subscriber"
        | "viewer"
        | "accountant"
        | "finance_manager"
        | "hn_pay_admin"
        | "group_owner"
        | "project_owner"
        | "project_manager"
        | "support_agent"
        | "security_auditor"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: [
        "owner",
        "admin",
        "manager",
        "developer",
        "subscriber",
        "viewer",
        "accountant",
        "finance_manager",
        "hn_pay_admin",
        "group_owner",
        "project_owner",
        "project_manager",
        "support_agent",
        "security_auditor",
      ],
    },
  },
} as const
