export type IntegrationProvider = "whatsapp" | "email" | "sms" | "webhook";

export type IntegrationEvent = {
  id: string;
  tenantId: string;
  provider: IntegrationProvider;
  occurredAt: string;
};
