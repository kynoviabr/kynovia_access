import { redirect } from "next/navigation";
import type { ActiveCondominium, CondoAdminContext } from "../condominiums/context";

export type CondoOperationalModule = {
  description: string;
  href: string;
  key: string;
  phase: "available" | "foundation";
  scope: string[];
  title: string;
};

export type AuthorizedCondoOperationalContext = CondoAdminContext & {
  condominium: ActiveCondominium;
};

export const operationalModules = [
  {
    description: "Dados gerais, contato, endereco e parametros operacionais do condominio.",
    href: "/dashboard/settings",
    key: "settings",
    phase: "available",
    scope: ["Dados gerais do condominio", "CNPJ e contatos", "Timezone e vagas visitantes"],
    title: "Configuracoes"
  },
  {
    description: "Cadastro operacional de apartamentos, casas, quadras, lotes e blocos.",
    href: "/dashboard/units",
    key: "units",
    phase: "available",
    scope: ["Enderecos das unidades", "Blocos, quadras, lotes e numeros", "Observacoes em metadata"],
    title: "Unidades"
  },
  {
    description: "Moradores, vinculos com unidades e status operacional.",
    href: "/dashboard/residents",
    key: "residents",
    phase: "available",
    scope: ["Consultar moradores", "Manter vinculos com unidades", "Acompanhar bloqueios"],
    title: "Moradores"
  },
  {
    description: "Veiculos de moradores e visitantes autorizados.",
    href: "/dashboard/vehicles",
    key: "vehicles",
    phase: "foundation",
    scope: ["Centralizar placas", "Preparar regras de autorizacao", "Apoiar leitura por placa"],
    title: "Veiculos"
  },
  {
    description: "Pontos de acesso, portoes, cancelas e comandos recentes.",
    href: "/dashboard/gates",
    key: "gates",
    phase: "available",
    scope: ["Configurar pontos de acesso", "Acompanhar comandos", "Preparar integracoes"],
    title: "Portoes e Cancelas"
  },
  {
    description: "Funcionarios autorizados pelo condominio.",
    href: "/dashboard/employees",
    key: "employees",
    phase: "foundation",
    scope: ["Cadastrar funcionarios", "Controlar status", "Preparar vinculo com acessos"],
    title: "Funcionarios"
  },
  {
    description: "Prestadores e fornecedores recorrentes.",
    href: "/dashboard/suppliers",
    key: "suppliers",
    phase: "foundation",
    scope: ["Organizar prestadores", "Controlar recorrencia", "Preparar regras de entrada"],
    title: "Prestadores de Servico"
  },
  {
    description: "Catalogo das areas comuns disponiveis para futura reserva e regras de uso.",
    href: "/dashboard/common-areas",
    key: "common_areas",
    phase: "foundation",
    scope: ["Selecionar areas padrao", "Registrar area personalizada", "Preparar futuras reservas"],
    title: "Areas Comuns"
  },
  {
    description: "Capacidade e identificacao das vagas destinadas a visitantes.",
    href: "/dashboard/visitor-parking",
    key: "visitor_parking",
    phase: "available",
    scope: ["Numero total de vagas", "Localizacao das vagas", "Identificacao operacional"],
    title: "Vagas Visitantes"
  }
] satisfies CondoOperationalModule[];

const allowedModulesByRole: Record<string, string[]> = {
  condominium_admin: operationalModules.map((module) => module.key),
  doorman_supervisor: ["vehicles", "gates", "common_areas", "visitor_parking"],
  manager: operationalModules.map((module) => module.key),
  resident_manager: ["units", "residents", "vehicles", "common_areas", "visitor_parking"],
  syndic: operationalModules.map((module) => module.key)
};

export function getAllowedOperationalModules(role: string) {
  const allowedKeys = new Set(allowedModulesByRole[role] ?? []);
  return operationalModules.filter((module) => allowedKeys.has(module.key));
}

export function canAccessOperationalModule(role: string, moduleKey: string) {
  return allowedModulesByRole[role]?.includes(moduleKey) ?? false;
}

export function requireOperationalModuleAccess(
  context: CondoAdminContext | null,
  moduleKey: string
): AuthorizedCondoOperationalContext {
  if (!context?.condominium) {
    redirect("/dashboard?error=missing_condominium_context");
  }

  if (!canAccessOperationalModule(context.profile.role, moduleKey)) {
    redirect("/access-denied?app=condo-admin");
  }

  return { ...context, condominium: context.condominium };
}
