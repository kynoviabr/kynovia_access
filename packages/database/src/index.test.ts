import { describe, expect, it } from "vitest";
import {
  buildInviteQrPayload,
  createBrowserSupabaseClient,
  hasPlateAuthorization,
  isAccessDecision,
  isAccessDirection,
  isAccessPointKind,
  isGateCommand,
  isInviteStatus,
  isInviteType,
  isInviteValidationResult,
  isLikelyBrazilianPlate,
  isOccurrenceSeverity,
  isOccurrenceStatus,
  isResidentStatus,
  isResidentUnitRelationship,
  normalizeBrazilianPlate,
  normalizeInviteUsageLimit,
  normalizeNullableText,
  normalizePhone,
  normalizeSlug,
  parseJsonObject,
  parseInviteQrPayload,
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
        },
        residents: {
          Row: {
            id: "resident_123",
            tenant_id: "tenant_123",
            condominium_id: "condominium_123",
            full_name: "Maria Silva",
            document: "123",
            phone: "11999999999",
            email: "maria@example.com",
            profile_id: "profile_123",
            status: "active",
            block_reason: null,
            blocked_at: null,
            metadata: {},
            created_at: "2026-05-18T00:00:00Z",
            updated_at: "2026-05-18T00:00:00Z"
          },
          Insert: {
            tenant_id: "tenant_123",
            condominium_id: "condominium_123",
            full_name: "Maria Silva"
          },
          Update: {
            status: "blocked",
            block_reason: "Pendencia cadastral"
          },
          Relationships: []
        },
        resident_units: {
          Row: {
            id: "resident_unit_123",
            tenant_id: "tenant_123",
            condominium_id: "condominium_123",
            resident_id: "resident_123",
            unit_id: "unit_123",
            relationship: "owner",
            is_primary: true,
            created_at: "2026-05-18T00:00:00Z",
            updated_at: "2026-05-18T00:00:00Z"
          },
          Insert: {
            tenant_id: "tenant_123",
            condominium_id: "condominium_123",
            resident_id: "resident_123",
            unit_id: "unit_123"
          },
          Update: {
            relationship: "tenant"
          },
          Relationships: []
        },
        resident_vehicles: {
          Row: {
            id: "vehicle_123",
            tenant_id: "tenant_123",
            condominium_id: "condominium_123",
            resident_id: "resident_123",
            plate: "ABC1D23",
            label: "Carro principal",
            status: "active",
            block_reason: null,
            blocked_at: null,
            created_at: "2026-05-18T00:00:00Z",
            updated_at: "2026-05-18T00:00:00Z"
          },
          Insert: {
            tenant_id: "tenant_123",
            condominium_id: "condominium_123",
            resident_id: "resident_123",
            plate: "ABC1D23"
          },
          Update: {
            status: "blocked"
          },
          Relationships: []
        },
        visitors: {
          Row: {
            id: "visitor_123",
            tenant_id: "tenant_123",
            condominium_id: "condominium_123",
            full_name: "Joao Visitante",
            document: null,
            phone: null,
            notes: null,
            created_at: "2026-05-18T00:00:00Z",
            updated_at: "2026-05-18T00:00:00Z"
          },
          Insert: {
            tenant_id: "tenant_123",
            condominium_id: "condominium_123",
            full_name: "Joao Visitante"
          },
          Update: {
            notes: "Fornecedor"
          },
          Relationships: []
        },
        visitor_vehicles: {
          Row: {
            id: "visitor_vehicle_123",
            tenant_id: "tenant_123",
            condominium_id: "condominium_123",
            visitor_id: "visitor_123",
            plate: "XYZ9A87",
            created_at: "2026-05-18T00:00:00Z",
            updated_at: "2026-05-18T00:00:00Z"
          },
          Insert: {
            tenant_id: "tenant_123",
            condominium_id: "condominium_123",
            visitor_id: "visitor_123",
            plate: "XYZ9A87"
          },
          Update: {
            plate: "XYZ9A88"
          },
          Relationships: []
        },
        visitor_unit_visits: {
          Row: {
            id: "visit_123",
            tenant_id: "tenant_123",
            condominium_id: "condominium_123",
            visitor_id: "visitor_123",
            unit_id: "unit_123",
            occurred_at: "2026-05-18T00:00:00Z",
            notes: "Visita registrada",
            created_at: "2026-05-18T00:00:00Z",
            updated_at: "2026-05-18T00:00:00Z"
          },
          Insert: {
            tenant_id: "tenant_123",
            condominium_id: "condominium_123",
            visitor_id: "visitor_123",
            unit_id: "unit_123"
          },
          Update: {
            notes: "Atualizado"
          },
          Relationships: []
        },
        access_invites: {
          Row: {
            id: "invite_123",
            tenant_id: "tenant_123",
            condominium_id: "condominium_123",
            unit_id: "unit_123",
            resident_id: "resident_123",
            visitor_id: "visitor_123",
            visitor_name: "Joao Visitante",
            visitor_phone: "11999999999",
            plate: null,
            starts_at: "2026-05-18T00:00:00Z",
            expires_at: "2026-05-18T23:59:59Z",
            max_uses: 1,
            use_count: 0,
            status: "active",
            invite_type: "single",
            recurrence_rule: null,
            qr_token_hash: "hash",
            qr_token_expires_at: "2026-05-18T23:59:59Z",
            cancelled_by: null,
            cancelled_at: null,
            metadata: {},
            created_at: "2026-05-18T00:00:00Z",
            updated_at: "2026-05-18T00:00:00Z"
          },
          Insert: {
            tenant_id: "tenant_123",
            condominium_id: "condominium_123",
            visitor_name: "Joao Visitante",
            expires_at: "2026-05-18T23:59:59Z"
          },
          Update: {
            status: "cancelled"
          },
          Relationships: []
        },
        access_invite_validations: {
          Row: {
            id: "validation_123",
            tenant_id: "tenant_123",
            condominium_id: "condominium_123",
            invite_id: "invite_123",
            validated_by: "profile_123",
            result: "allowed",
            reason: null,
            created_at: "2026-05-18T00:00:00Z"
          },
          Insert: {
            tenant_id: "tenant_123",
            condominium_id: "condominium_123",
            result: "allowed"
          },
          Update: {
            reason: "Validacao manual"
          },
          Relationships: []
        },
        access_events: {
          Row: {
            id: "access_event_123",
            tenant_id: "tenant_123",
            condominium_id: "condominium_123",
            access_point_id: "access_point_123",
            invite_id: "invite_123",
            resident_id: null,
            visitor_id: "visitor_123",
            plate: "ABC1D23",
            direction: "entry",
            decision: "manual_review",
            reason: "Revisao da portaria",
            decided_by: "profile_123",
            decided_at: "2026-05-18T00:00:00Z",
            metadata: {},
            created_at: "2026-05-18T00:00:00Z"
          },
          Insert: {
            tenant_id: "tenant_123",
            condominium_id: "condominium_123",
            direction: "entry",
            decision: "allow"
          },
          Update: {
            decision: "deny"
          },
          Relationships: []
        },
        gate_commands: {
          Row: {
            id: "gate_command_123",
            tenant_id: "tenant_123",
            condominium_id: "condominium_123",
            access_point_id: "access_point_123",
            access_event_id: "access_event_123",
            command: "open",
            provider: "mock",
            status: "pending",
            requested_by: "profile_123",
            requested_at: "2026-05-18T00:00:00Z",
            executed_at: null,
            metadata: {},
            created_at: "2026-05-18T00:00:00Z",
            updated_at: "2026-05-18T00:00:00Z"
          },
          Insert: {
            tenant_id: "tenant_123",
            condominium_id: "condominium_123",
            access_point_id: "access_point_123",
            command: "open"
          },
          Update: {
            status: "confirmed"
          },
          Relationships: []
        },
        gatehouse_occurrences: {
          Row: {
            id: "occurrence_123",
            tenant_id: "tenant_123",
            condominium_id: "condominium_123",
            title: "Entrega sem autorizacao",
            description: "Visitante aguardando confirmacao.",
            severity: "medium",
            status: "open",
            created_by: "profile_123",
            resolved_by: null,
            resolved_at: null,
            created_at: "2026-05-18T00:00:00Z",
            updated_at: "2026-05-18T00:00:00Z"
          },
          Insert: {
            tenant_id: "tenant_123",
            condominium_id: "condominium_123",
            title: "Entrega sem autorizacao"
          },
          Update: {
            status: "resolved"
          },
          Relationships: []
        },
        vehicle_plate_blacklist: {
          Row: {
            id: "blacklist_123",
            tenant_id: "tenant_123",
            condominium_id: "condominium_123",
            plate: "ABC1D23",
            reason: "Bloqueio operacional",
            status: "active",
            created_by: "profile_123",
            created_at: "2026-05-18T00:00:00Z",
            updated_at: "2026-05-18T00:00:00Z"
          },
          Insert: {
            tenant_id: "tenant_123",
            condominium_id: "condominium_123",
            plate: "ABC1D23"
          },
          Update: {
            status: "inactive"
          },
          Relationships: []
        },
        visitor_vehicle_accesses: {
          Row: {
            id: "vehicle_access_123",
            tenant_id: "tenant_123",
            condominium_id: "condominium_123",
            invite_id: "invite_123",
            unit_id: "unit_123",
            plate: "ABC1D23",
            visitor_name: "Joao Visitante",
            status: "active",
            entered_at: "2026-05-18T00:00:00Z",
            exited_at: null,
            entry_validated_by: "profile_123",
            exit_validated_by: null,
            notes: null,
            created_at: "2026-05-18T00:00:00Z",
            updated_at: "2026-05-18T00:00:00Z"
          },
          Insert: {
            tenant_id: "tenant_123",
            condominium_id: "condominium_123",
            plate: "ABC1D23",
            visitor_name: "Joao Visitante"
          },
          Update: {
            status: "exited"
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

  it("normalizes resident, vehicle, and visitor inputs", () => {
    expect(normalizeBrazilianPlate("abc-1d23")).toBe("ABC1D23");
    expect(isLikelyBrazilianPlate("ABC-1234")).toBe(true);
    expect(isLikelyBrazilianPlate("ABC1D23")).toBe(true);
    expect(isLikelyBrazilianPlate("A1")).toBe(false);
    expect(normalizePhone("(11) 99999-0000")).toBe("11999990000");
    expect(isResidentStatus("blocked")).toBe(true);
    expect(isResidentStatus("pending")).toBe(false);
    expect(isResidentUnitRelationship("owner")).toBe(true);
  });

  it("normalizes invite and QR inputs", () => {
    const payload = buildInviteQrPayload("invite_123", "token_456");

    expect(payload).toBe("invite_123.token_456");
    expect(parseInviteQrPayload(payload)).toEqual({ inviteId: "invite_123", token: "token_456" });
    expect(parseInviteQrPayload("broken")).toBeNull();
    expect(normalizeInviteUsageLimit("3")).toBe(3);
    expect(normalizeInviteUsageLimit("0", 2)).toBe(2);
    expect(isInviteStatus("active")).toBe(true);
    expect(isInviteStatus("pending")).toBe(false);
    expect(isInviteType("recurring")).toBe(true);
    expect(isInviteValidationResult("usage_limit_reached")).toBe(true);
    expect(isInviteValidationResult("blacklisted")).toBe(true);
    expect(hasPlateAuthorization("ABC1D23")).toBe(true);
    expect(hasPlateAuthorization("")).toBe(false);
  });

  it("normalizes gatehouse operation contracts", () => {
    expect(isAccessDirection("entry")).toBe(true);
    expect(isAccessDirection("transfer")).toBe(false);
    expect(isAccessDecision("manual_review")).toBe(true);
    expect(isAccessDecision("pending")).toBe(false);
    expect(isGateCommand("open")).toBe(true);
    expect(isGateCommand("unlock")).toBe(false);
    expect(isOccurrenceSeverity("critical")).toBe(true);
    expect(isOccurrenceSeverity("urgent")).toBe(false);
    expect(isOccurrenceStatus("open")).toBe(true);
    expect(isOccurrenceStatus("archived")).toBe(false);
  });
});
