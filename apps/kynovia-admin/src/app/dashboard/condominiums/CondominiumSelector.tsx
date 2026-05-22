"use client";

import { useRouter } from "next/navigation";

type CondominiumOption = {
  id: string;
  name: string;
};

export function CondominiumSelector({ condominiums }: { condominiums: CondominiumOption[] }) {
  const router = useRouter();

  return (
    <label>
      Buscar cliente/condominio
      <select
        defaultValue=""
        onChange={(event) => {
          if (event.target.value) {
            router.push(`/dashboard/condominiums/${event.target.value}`);
          }
        }}
      >
        <option value="">Selecione um condominio</option>
        {condominiums.map((condominium) => (
          <option key={condominium.id} value={condominium.id}>
            {condominium.name}
          </option>
        ))}
      </select>
    </label>
  );
}
