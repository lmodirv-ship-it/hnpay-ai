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
          requires_approval: boolean
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
          requires_approval?: boolean
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
          requires_approval?: boolean
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
      hn_projects: {
        Row: {
          brand_color: string | null
          category: string | null
          code: string
          created_at: string
          created_by: string | null
          default_currency: string
          default_provider_id: string | null
          description: string | null
          id: string
          name: string
          owner_id: string | null
          primary_domain: string | null
          status: string
          updated_at: string
        }
        Insert: {
          brand_color?: string | null
          category?: string | null
          code: string
          created_at?: string
          created_by?: string | null
          default_currency?: string
          default_provider_id?: string | null
          description?: string | null
          id?: string
          name: string
          owner_id?: string | null
          primary_domain?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          brand_color?: string | null
          category?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          default_currency?: string
          default_provider_id?: string | null
          description?: string | null
          id?: string
          name?: string
          owner_id?: string | null
          primary_domain?: string | null
          status?: string
          updated_at?: string
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
      payment_providers: {
        Row: {
          api_key: string | null
          code: string
          created_at: string
          created_by: string | null
          display_name: string
          environment: string
          extra: Json
          id: string
          is_default: boolean
          is_enabled: boolean
          last_test_message: string | null
          last_test_status: string | null
          last_tested_at: string | null
          merchant_id: string | null
          secret_key: string | null
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
          id?: string
          is_default?: boolean
          is_enabled?: boolean
          last_test_message?: string | null
          last_test_status?: string | null
          last_tested_at?: string | null
          merchant_id?: string | null
          secret_key?: string | null
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
          id?: string
          is_default?: boolean
          is_enabled?: boolean
          last_test_message?: string | null
          last_test_status?: string | null
          last_tested_at?: string | null
          merchant_id?: string | null
          secret_key?: string | null
          updated_at?: string
          webhook_secret?: string | null
        }
        Relationships: []
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
          site_id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          customer_id: string
          expires_at?: string
          site_id: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string
          expires_at?: string
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
      site_api_keys: {
        Row: {
          created_at: string
          id: string
          key_hash: string
          key_prefix: string
          label: string
          last_used_at: string | null
          mode: string
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
          revoked_at?: string | null
          site_id?: string
        }
        Relationships: [
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
          brand_color: string | null
          created_at: string
          created_by: string | null
          domain: string
          domain_id: string | null
          enabled_providers: string[]
          environment: string
          id: string
          is_active: boolean
          logo_url: string | null
          manual_bank_details: Json
          manual_instructions: string | null
          name: string
          portfolio_id: string | null
          project_id: string | null
          slug: string
          updated_at: string
          webhook_secret: string
          webhook_url: string | null
        }
        Insert: {
          brand_color?: string | null
          created_at?: string
          created_by?: string | null
          domain: string
          domain_id?: string | null
          enabled_providers?: string[]
          environment?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          manual_bank_details?: Json
          manual_instructions?: string | null
          name: string
          portfolio_id?: string | null
          project_id?: string | null
          slug: string
          updated_at?: string
          webhook_secret?: string
          webhook_url?: string | null
        }
        Update: {
          brand_color?: string | null
          created_at?: string
          created_by?: string | null
          domain?: string
          domain_id?: string | null
          enabled_providers?: string[]
          environment?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          manual_bank_details?: Json
          manual_instructions?: string | null
          name?: string
          portfolio_id?: string | null
          project_id?: string | null
          slug?: string
          updated_at?: string
          webhook_secret?: string
          webhook_url?: string | null
        }
        Relationships: [
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
          public_id?: string
          site_id?: string
        }
        Relationships: [
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
      is_protected_owner: { Args: { _user_id: string }; Returns: boolean }
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
      app_role: [
        "owner",
        "admin",
        "manager",
        "developer",
        "subscriber",
        "viewer",
        "accountant",
      ],
    },
  },
} as const
