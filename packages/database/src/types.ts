export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string;
          name: string;
          slug: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      condominiums: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          slug: string;
          timezone: string;
          settings: Json;
          operational_rules: Json;
          visitor_parking_capacity: number;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          name: string;
          slug: string;
          timezone?: string;
          settings?: Json;
          operational_rules?: Json;
          visitor_parking_capacity?: number;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          name?: string;
          slug?: string;
          timezone?: string;
          settings?: Json;
          operational_rules?: Json;
          visitor_parking_capacity?: number;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          tenant_id: string;
          full_name: string;
          role: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          tenant_id: string;
          full_name: string;
          role: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          full_name?: string;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      condominium_memberships: {
        Row: {
          id: string;
          tenant_id: string;
          condominium_id: string;
          profile_id: string;
          role: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          condominium_id: string;
          profile_id: string;
          role: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          condominium_id?: string;
          profile_id?: string;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      units: {
        Row: {
          id: string;
          tenant_id: string;
          condominium_id: string;
          block: string | null;
          number: string;
          floor: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          condominium_id: string;
          block?: string | null;
          number: string;
          floor?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          condominium_id?: string;
          block?: string | null;
          number?: string;
          floor?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      access_points: {
        Row: {
          id: string;
          tenant_id: string;
          condominium_id: string;
          name: string;
          kind: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          condominium_id: string;
          name: string;
          kind: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          condominium_id?: string;
          name?: string;
          kind?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      residents: {
        Row: {
          id: string;
          tenant_id: string;
          condominium_id: string;
          full_name: string;
          document: string | null;
          phone: string | null;
          email: string | null;
          status: string;
          block_reason: string | null;
          blocked_at: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          condominium_id: string;
          full_name: string;
          document?: string | null;
          phone?: string | null;
          email?: string | null;
          status?: string;
          block_reason?: string | null;
          blocked_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          condominium_id?: string;
          full_name?: string;
          document?: string | null;
          phone?: string | null;
          email?: string | null;
          status?: string;
          block_reason?: string | null;
          blocked_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      resident_units: {
        Row: {
          id: string;
          tenant_id: string;
          condominium_id: string;
          resident_id: string;
          unit_id: string;
          relationship: string;
          is_primary: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          condominium_id: string;
          resident_id: string;
          unit_id: string;
          relationship?: string;
          is_primary?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          condominium_id?: string;
          resident_id?: string;
          unit_id?: string;
          relationship?: string;
          is_primary?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      resident_vehicles: {
        Row: {
          id: string;
          tenant_id: string;
          condominium_id: string;
          resident_id: string;
          plate: string;
          label: string | null;
          status: string;
          block_reason: string | null;
          blocked_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          condominium_id: string;
          resident_id: string;
          plate: string;
          label?: string | null;
          status?: string;
          block_reason?: string | null;
          blocked_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          condominium_id?: string;
          resident_id?: string;
          plate?: string;
          label?: string | null;
          status?: string;
          block_reason?: string | null;
          blocked_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      visitors: {
        Row: {
          id: string;
          tenant_id: string;
          condominium_id: string;
          full_name: string;
          document: string | null;
          phone: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          condominium_id: string;
          full_name: string;
          document?: string | null;
          phone?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          condominium_id?: string;
          full_name?: string;
          document?: string | null;
          phone?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      visitor_vehicles: {
        Row: {
          id: string;
          tenant_id: string;
          condominium_id: string;
          visitor_id: string;
          plate: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          condominium_id: string;
          visitor_id: string;
          plate: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          condominium_id?: string;
          visitor_id?: string;
          plate?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      visitor_unit_visits: {
        Row: {
          id: string;
          tenant_id: string;
          condominium_id: string;
          visitor_id: string;
          unit_id: string;
          occurred_at: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          condominium_id: string;
          visitor_id: string;
          unit_id: string;
          occurred_at?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          condominium_id?: string;
          visitor_id?: string;
          unit_id?: string;
          occurred_at?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
