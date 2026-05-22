"use client";

import { useRouter } from "next/navigation";

type CondominiumOption = {
  cnpj?: string | null;
  id: string;
  legalName?: string | null;
  name: string;
  slug?: string | null;
  tradeName?: string | null;
};

export function CondominiumSelector({ condominiums }: { condominiums: CondominiumOption[] }) {
  const router = useRouter();

  return (
    <div className="customer-search">
      <label>
        Buscar cliente
        <input
          aria-label="Buscar cliente"
          list="kynovia-customer-options"
          placeholder="Procure por nome fantasia, razao social, CNPJ ou slug"
          onChange={(event) => {
            const selected = condominiums.find((condominium) => {
              const optionValue = customerOptionValue(condominium);
              return optionValue === event.target.value;
            });

            if (selected) {
              router.push(`/dashboard/condominiums/${selected.id}`);
            }
          }}
        />
      </label>
      <span aria-hidden="true" className="search-icon" />
      <datalist id="kynovia-customer-options">
        {condominiums.map((condominium) => (
          <option key={condominium.id} value={customerOptionValue(condominium)} />
        ))}
      </datalist>
    </div>
  );
}

function customerOptionValue(condominium: CondominiumOption) {
  return [
    condominium.tradeName || condominium.name,
    condominium.legalName,
    condominium.cnpj,
    condominium.slug
  ]
    .filter(Boolean)
    .join(" | ");
}
