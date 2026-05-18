import type { Json } from "./types";

export const defaultCondominiumTimezone = "America/Sao_Paulo";

export const accessPointKinds = [
  "vehicle_gate",
  "pedestrian_gate",
  "service_gate",
  "other"
] as const;

export type AccessPointKind = (typeof accessPointKinds)[number];

export function normalizeSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeNullableText(value: string) {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

export function parseNonNegativeInteger(value: string, fallback = 0) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export function parseJsonObject(value: string): Json {
  const trimmed = value.trim();

  if (!trimmed) {
    return {};
  }

  const parsed: unknown = JSON.parse(trimmed);

  if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
    throw new Error("Expected a JSON object.");
  }

  return parsed as Json;
}

export function isAccessPointKind(value: string): value is AccessPointKind {
  return accessPointKinds.includes(value as AccessPointKind);
}
