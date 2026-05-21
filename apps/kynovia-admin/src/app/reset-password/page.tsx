import { ResetPasswordShell } from "@kynovia/ui";
import { resetPasswordAction } from "../actions";

type ResetPasswordPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = await searchParams;
  const sent = params?.sent === "1";
  const hasError = Boolean(params?.error);

  return (
    <ResetPasswordShell
      resetPasswordAction={resetPasswordAction}
      hasError={hasError}
      sent={sent}
    />
  );
}
