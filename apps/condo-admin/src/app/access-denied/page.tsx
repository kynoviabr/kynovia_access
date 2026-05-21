import { AccessDeniedShell } from "@kynovia/ui";

export default function AccessDeniedPage() {
  return (
    <AccessDeniedShell
      eyebrow="Condo Admin"
      description="Seu perfil nao possui permissao para acessar a administracao do condominio."
    />
  );
}
