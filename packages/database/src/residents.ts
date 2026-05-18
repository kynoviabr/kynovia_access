export const residentStatuses = ["active", "inactive", "blocked"] as const;
export const residentUnitRelationships = ["owner", "tenant", "dependent", "resident"] as const;

export type ResidentStatus = (typeof residentStatuses)[number];
export type ResidentUnitRelationship = (typeof residentUnitRelationships)[number];

export function isResidentStatus(value: string): value is ResidentStatus {
  return residentStatuses.includes(value as ResidentStatus);
}

export function isResidentUnitRelationship(value: string): value is ResidentUnitRelationship {
  return residentUnitRelationships.includes(value as ResidentUnitRelationship);
}

export function normalizeBrazilianPlate(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase();
}

export function isLikelyBrazilianPlate(value: string) {
  const plate = normalizeBrazilianPlate(value);
  return /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(plate);
}

export function normalizePhone(value: string) {
  return value.replace(/[^\d+]/g, "").trim();
}
