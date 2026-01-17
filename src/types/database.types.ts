export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            subscription_plans: {
                Row: {
                    created_at: string | null
                    features: Json | null
                    id: string
                    max_projects: number
                    max_spools: number | null
                    max_storage_gb: number | null
                    max_users: number
                    name: string
                    price_monthly: number
                }
                Insert: {
                    created_at?: string | null
                    features?: Json | null
                    id: string
                    max_projects: number
                    max_spools?: number | null
                    max_storage_gb?: number | null
                    max_users: number
                    name: string
                    price_monthly: number
                }
                Update: {
                    created_at?: string | null
                    features?: Json | null
                    id?: string
                    max_projects?: number
                    max_spools?: number | null
                    max_storage_gb?: number | null
                    max_users?: number
                    name?: string
                    price_monthly?: number
                }
                Relationships: []
            }
            companies: {
                Row: {
                    created_at: string | null
                    id: string
                    name: string
                    payment_instructions: string | null
                    slug: string
                    storage_used_bytes: number | null
                    subscription_end_date: string | null
                    subscription_status:
                    | Database["public"]["Enums"]["subscription_status"]
                    | null
                    subscription_tier:
                    | Database["public"]["Enums"]["subscription_tier"]
                    | null
                    suspended_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    created_at?: string | null
                    id?: string
                    name: string
                    payment_instructions?: string | null
                    slug: string
                    storage_used_bytes?: number | null
                    subscription_end_date?: string | null
                    subscription_status?:
                    | Database["public"]["Enums"]["subscription_status"]
                    | null
                    subscription_tier?:
                    | Database["public"]["Enums"]["subscription_tier"]
                    | null
                    suspended_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    created_at?: string | null
                    id?: string
                    name?: string
                    payment_instructions?: string | null
                    slug?: string
                    storage_used_bytes?: number | null
                    subscription_end_date?: string | null
                    subscription_status?:
                    | Database["public"]["Enums"]["subscription_status"]
                    | null
                    subscription_tier?:
                    | Database["public"]["Enums"]["subscription_tier"]
                    | null
                    suspended_at?: string | null
                    updated_at?: string | null
                }
                Relationships: []
            }
            quota_strikes: {
                Row: {
                    company_id: string
                    created_at: string
                    date: string
                    id: string
                    resource_type: string | null
                    spool_count: number | null
                    usage_value: number | null
                }
                Insert: {
                    company_id: string
                    created_at?: string
                    date?: string
                    id?: string
                    resource_type?: string | null
                    spool_count?: number | null
                    usage_value?: number | null
                }
                Update: {
                    company_id?: string
                    created_at?: string
                    date?: string
                    id?: string
                    resource_type?: string | null
                    spool_count?: number | null
                    usage_value?: number | null
                }
                Relationships: [
                    {
                        foreignKeyName: "quota_strikes_company_id_fkey"
                        columns: ["company_id"]
                        isOneToOne: false
                        referencedRelation: "companies"
                        referencedColumns: ["id"]
                    },
                ]
            }
            spools: {
                Row: {
                    area: string | null
                    created_at: string | null
                    description: string | null
                    diameter_inch: number | null
                    id: string
                    isometric_id: string | null
                    management_tag: string | null
                    material_type: string | null
                    parent_spool_id: string | null
                    pinta: string | null
                    project_id: string | null
                    revision_id: string | null
                    schedule: string | null
                    spec_code: string | null
                    spool_number: string
                    status: string | null
                    system: string | null
                    tag_registry_id: string | null
                    updated_at: string | null
                }
                Insert: {
                    area?: string | null
                    created_at?: string | null
                    description?: string | null
                    diameter_inch?: number | null
                    id?: string
                    isometric_id?: string | null
                    management_tag?: string | null
                    material_type?: string | null
                    parent_spool_id?: string | null
                    pinta?: string | null
                    project_id?: string | null
                    revision_id?: string | null
                    schedule?: string | null
                    spec_code?: string | null
                    spool_number: string
                    status?: string | null
                    system?: string | null
                    tag_registry_id?: string | null
                    updated_at?: string | null
                }
                Update: {
                    area?: string | null
                    created_at?: string | null
                    description?: string | null
                    diameter_inch?: number | null
                    id?: string
                    isometric_id?: string | null
                    management_tag?: string | null
                    material_type?: string | null
                    parent_spool_id?: string | null
                    pinta?: string | null
                    project_id?: string | null
                    revision_id?: string | null
                    schedule?: string | null
                    spec_code?: string | null
                    spool_number?: string
                    status?: string | null
                    system?: string | null
                    tag_registry_id?: string | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "spools_isometric_id_fkey"
                        columns: ["isometric_id"]
                        isOneToOne: false
                        referencedRelation: "isometrics"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "spools_parent_spool_id_fkey"
                        columns: ["parent_spool_id"]
                        isOneToOne: false
                        referencedRelation: "spools"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "spools_project_id_fkey"
                        columns: ["project_id"]
                        isOneToOne: false
                        referencedRelation: "projects"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "spools_revision_id_fkey"
                        columns: ["revision_id"]
                        isOneToOne: false
                        referencedRelation: "revisions"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "spools_tag_registry_id_fkey"
                        columns: ["tag_registry_id"]
                        isOneToOne: false
                        referencedRelation: "spool_tags_registry"
                        referencedColumns: ["id"]
                    },
                ]
            }
            system_notifications: {
                Row: {
                    company_id: string
                    created_at: string
                    data: Json | null
                    id: string
                    is_sent: boolean | null
                    strike_count: number
                    type: string
                }
                Insert: {
                    company_id: string
                    created_at?: string
                    data?: Json | null
                    id?: string
                    is_sent?: boolean | null
                    strike_count: number
                    type: string
                }
                Update: {
                    company_id?: string
                    created_at?: string
                    data?: Json | null
                    id?: string
                    is_sent?: boolean | null
                    strike_count?: number
                    type?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "system_notifications_company_id_fkey"
                        columns: ["company_id"]
                        isOneToOne: false
                        referencedRelation: "companies"
                        referencedColumns: ["id"]
                    },
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Enums: {
            subscription_status: "active" | "past_due" | "suspended"
            subscription_tier: "starter" | "pro" | "enterprise"
            user_role: "super_admin" | "founder" | "admin" | "supervisor" | "worker"
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

export type Tables<
    PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
            Row: infer R
        }
    ? R
    : never
    : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
        Database["public"]["Views"])
    ? (Database["public"]["Tables"] &
        Database["public"]["Views"])[PublicTableNameOrOptions] extends {
            Row: infer R
        }
    ? R
    : never
    : never

export type TablesInsert<
    PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Insert: infer I
    }
    ? I
    : never
    : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
    }
    ? I
    : never
    : never

export type TablesUpdate<
    PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Update: infer U
    }
    ? U
    : never
    : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
    }
    ? U
    : never
    : never

export type Enums<
    PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
    EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
    ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
    : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
    ? Database["public"]["Enums"][PublicEnumNameOrOptions]
    : never
