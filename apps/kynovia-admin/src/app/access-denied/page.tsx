import { AccessDeniedShell } from "@kynovia/ui";

export default function AccessDeniedPage() {
  return (
    <AccessDeniedShell
      eyebrow="Kynovia Admin"
      description="Seu perfil nao possui permissao para acessar o backoffice interno da Kynovia."
    />
  );
}
