import { describe, expect, it } from "vitest";
import {
  createBrowserSupabaseClient,
  isAccessPointKind,
  normalizeNullableText,
  normalizeSlug,
  parseJsonObject,
  parseNonNegativeInteger
} from "./index";
import type { Database } from "./index";

describe("@kynovia/database", () => {
  it("exports a Supabase browser client factory", () => {
    expect(createBrowserSupabaseClient).toBeTypeOf("function");
  });

  it("exposes the generated database type contract", () => {
    const publicSchema = {
      Tables: {
        tenants: {
          Row: {
            id: "tenant_123",
            name: "Kynovia Demo",
            slug: "kynovia-demo",
            created_at: "2026-05-18T00:00:00Z",
            updated_at: "2026-05-18T00:00:00Z"
          },
          Insert: {
            name: "Kynovia Demo",
            slug: "kynovia-demo"
          },
          Update: {
            name: "Kynovia Atualizado"
          },
          Relationships: []
        },
        condominiums: {
          Row: {
            id: "condominium_123",
            tenant_id: "tenant_123",
            name: "Residencial Aurora",
            slug: "residencial-aurora",
            timezone: "America/Sao_Paulo",
            settings: {},
            operational_rules: {},
            visitor_parking_capacity: 12,
            metadata: {},
            created_at: "2026-05-18T00:00:00Z",
            updated_at: "2026-05-18T00:00:00Z"
          },
          Insert: {
            tenant_id: "tenant_123",
            name: "Residencial Aurora",
            slug: "residencial-aurora"
          },
          Update: {
            visitor_parking_capacity: 10
          },
          Relationships: []
        },
        profiles: {
          Row: {
            id: "profile_123",
            tenant_id: "tenant_123",
            full_name: "Operador Demo",
            role: "gatehouse_operator",
            created_at: "2026-05-18T00:00:00Z",
            updated_at: "2026-05-18T00:00:00Z"
          },
          Insert: {
            id: "profile_123",
            tenant_id: "tenant_123",
            full_name: "Operador Demo",
            role: "gatehouse_operator"
          },
          Update: {
            full_name: "Operador Atualizado"
          },
          Relationships: []
        },
        condominium_memberships: {
          Row: {
            id: "membership_123",
            tenant_id: "tenant_123",
            condominium_id: "condominium_123",
            profile_id: "profile_123",
            role: "gatehouse_operator",
            created_at: "2026-05-18T00:00:00Z",
            updated_at: "2026-05-18T00:00:00Z"
          },
          Insert: {
            tenant_id: "tenant_123",
            condominium_id: "condominium_123",
            profile_id: "profile_123",
            role: "gatehouse_operator"
          },
          Update: {
            role: "condominium_admin"
          },
          Relationships: []
        },
        units: {
          Row: {
            id: "unit_123",
            tenant_id: "tenant_123",
            condominium_id: "condominium_123",
            block: "A",
            number: "101",
            floor: "1",
            metadata: {},
            created_at: "2026-05-18T00:00:00Z",
            updated_at: "2026-05-18T00:00:00Z"
          },
          Insert: {
            tenant_id: "tenant_123",
            condominium_id: "condominium_123",
            number: "101"
          },
          Update: {
            floor: "2"
          },
          Relationships: []
        },
        access_points: {
          Row: {
            id: "access_point_123",
            tenant_id: "tenant_123",
            condominium_id: "condominium_123",
            name: "Cancela social",
            kind: "vehicle_gate",
            created_at: "2026-05-18T00:00:00Z",
            updated_at: "2026-05-18T00:00:00Z"
          },
          Insert: {
            tenant_id: "tenant_123",
            condominium_id: "condominium_123",
            name: "Cancela social",
            kind: "vehicle_gate"
          },
          Update: {
            name: "Portao social"
          },
          Relationships: []
        }
      },
      Views: {},
      Functions: {},
      Enums: {},
      CompositeTypes: {}
    } satisfies Database["public"];

    expect(publicSchema.Tables.profiles.Row.role).toBe("gatehouse_operator");
  });

  it("normalizes condominium management inputs", () => {
    expect(normalizeSlug("Residencial Águas Claras")).toBe("residencial-aguas-claras");
    expect(normalizeNullableText("  ")).toBeNull();
    expect(parseNonNegativeInteger("-1", 5)).toBe(5);
    expect(parseJsonObject('{ "quietHours": true }')).toEqual({ quietHours: true });
    expect(isAccessPointKind("vehicle_gate")).toBe(true);
    expect(isAccessPointKind("unknown")).toBe(false);
  });
});
