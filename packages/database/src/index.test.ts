import { describe, expect, it } from "vitest";
import { createBrowserSupabaseClient } from "./index";
import type { Database } from "./index";

describe("@kynovia/database", () => {
  it("exports a Supabase browser client factory", () => {
    expect(createBrowserSupabaseClient).toBeTypeOf("function");
  });

  it("exposes the generated database type contract", () => {
    const publicSchema = {
      Tables: {
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
        }
      },
      Views: {},
      Functions: {},
      Enums: {},
      CompositeTypes: {}
    } satisfies Database["public"];

    expect(publicSchema.Tables.profiles.Row.role).toBe("gatehouse_operator");
  });
});
