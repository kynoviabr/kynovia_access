export type { Database } from "./types";
export {
  accessPointKinds,
  defaultCondominiumTimezone,
  isAccessPointKind,
  normalizeNullableText,
  normalizeSlug,
  parseJsonObject,
  parseNonNegativeInteger
} from "./condominiums";
export {
  isLikelyBrazilianPlate,
  isResidentStatus,
  isResidentUnitRelationship,
  normalizeBrazilianPlate,
  normalizePhone,
  residentStatuses,
  residentUnitRelationships
} from "./residents";
export { createBrowserSupabaseClient } from "./supabase";
