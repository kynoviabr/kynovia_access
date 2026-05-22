"use client";

import { useState } from "react";
import { RequiredLabel } from "./ClientRegistrationFields";

type FinanceStatusFieldsProps = {
  accessStatus?: string | null;
  blockedReason?: string | null;
  billingStatus?: string | null;
  isBlocked?: boolean;
};

export function FinanceStatusFields({
  accessStatus = "active",
  billingStatus = "current",
  blockedReason = "",
  isBlocked = false
}: FinanceStatusFieldsProps) {
  const [selectedAccessStatus, setSelectedAccessStatus] = useState(accessStatus ?? "active");
  const [selectedBillingStatus, setSelectedBillingStatus] = useState(billingStatus ?? "current");
  const [inactiveReason, setInactiveReason] = useState(
    (accessStatus ?? "active") === "active" ? "" : (blockedReason ?? "")
  );
  const shouldShowBlockedMessage =
    selectedAccessStatus === "inactive" || selectedBillingStatus === "overdue" || (isBlocked && selectedAccessStatus !== "active");

  return (
    <>
      <div className="form-row finance-status-row">
        <label>
          <RequiredLabel>Status de acesso</RequiredLabel>
          <select
            name="access_status"
            required
            value={selectedAccessStatus}
            onChange={(event) => {
              const nextStatus = event.target.value;
              setSelectedAccessStatus(nextStatus);

              if (nextStatus === "active") {
                setInactiveReason("");
                setSelectedBillingStatus("current");
                return;
              }

              if (nextStatus === "inactive") {
                setSelectedBillingStatus("overdue");
              }
            }}
          >
            <option value="active">Ativo</option>
            <option value="inactive">Inativo / bloqueado</option>
          </select>
        </label>
        <label>
          <RequiredLabel>Status do pagamento</RequiredLabel>
          <select
            name="payment_status"
            required
            value={selectedBillingStatus}
            onChange={(event) => {
              const nextBillingStatus = event.target.value;
              setSelectedBillingStatus(nextBillingStatus);

              if (nextBillingStatus === "overdue") {
                setSelectedAccessStatus("inactive");
                return;
              }

              if (nextBillingStatus === "current") {
                setSelectedAccessStatus("active");
                setInactiveReason("");
              }
            }}
          >
            <option value="current">Em dia</option>
            <option value="overdue">Atrasado</option>
          </select>
        </label>
      </div>
      <label>
        Motivo de inatividade/bloqueio
        <input
          name="inactive_reason"
          disabled={selectedAccessStatus === "active"}
          value={inactiveReason}
          onChange={(event) => setInactiveReason(event.target.value)}
          placeholder={selectedAccessStatus === "active" ? "Disponivel apenas para status inativo" : "Pagamento em atraso"}
        />
      </label>
      {shouldShowBlockedMessage ? (
        <p className="form-error">Cliente bloqueado: {inactiveReason || "Pagamento em atraso"}</p>
      ) : (
        <p className="form-success">Cliente ativo para uso do sistema.</p>
      )}
    </>
  );
}
