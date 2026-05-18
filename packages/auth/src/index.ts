export type SessionActor = {
  id: string;
  email: string;
  tenantId: string;
};

export type AuthContext = {
  actor: SessionActor | null;
};
