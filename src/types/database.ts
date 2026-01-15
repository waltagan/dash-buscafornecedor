/**
 * Interfaces TypeScript inferidas do schema busca_fornecedor
 * Gerado a partir da introspecção do banco de dados Supabase
 */

export interface UsuarioComprador {
  id: string;
  nome?: string | null;
  telefone?: string | null;
  empresa_nome?: string | null;
  tier_busca: string;
  codigo_embaixador?: number | null;
  embaixador_referente_id?: string | null;
  created_at: string;
}

export interface UsuarioFornecedor {
  id: string;
  cnpj_basico: string;
  cnpj_ordem: string;
  cnpj_dv: string;
  cnpj?: string | null;
  nome?: string | null;
  telefone?: string | null;
  plano_categoria: string;
  assinatura_ativa?: boolean | null;
  data_limite_plano?: string | null;
  subscription_end?: string | null;
  cadastro_incompleto?: boolean | null;
  senha_temporaria?: string | null;
  token_completar_cadastro?: string | null;
  webhook_elite_enviado?: boolean | null;
  webhook_elite_enviado_em?: string | null;
  created_at: string;
}

export interface Consultas {
  id: string;
  comprador?: string | null;
  status?: string | null;
  parametros?: unknown | null;
  resultados?: unknown | null;
  session_id?: string | null;
  execution_id?: string | null;
  created_at: string;
}

export interface Aparicoes {
  id: string;
  consulta_id: string;
  comprador_id?: string | null;
  cnpj_basico: string;
  cnpj_ordem: string;
  cnpj_dv: string;
  nota?: number | null;
  created_at?: string | null;
}

