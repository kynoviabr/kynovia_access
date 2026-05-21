export default function AccessDeniedPage() {
  return (
    <main className="auth-page">
      <section className="auth-panel">
        <p className="eyebrow">Kynovia Admin</p>
        <h1>Acesso negado</h1>
        <p className="muted">
          Seu perfil nao possui permissao para acessar o backoffice interno da Kynovia.
        </p>
        <a className="button-link" href="/login">
          Trocar usuario
        </a>
      </section>
    </main>
  );
}
