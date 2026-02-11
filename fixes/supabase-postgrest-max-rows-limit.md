# Fix: Supabase PostgREST Max Rows Limit - Aparições Incompletas

## Problema

Na tabela "Últimas 50 Consultas", ao clicar em fornecedores com nota >= 60, o histórico completo de aparições não era exibido. Por exemplo, o CNPJ 13040543 possuía **5 aparições** no banco de dados, mas apenas **2** eram exibidas no dashboard.

## Causa Raiz

O **Supabase REST API (PostgREST)** possui um limite máximo de **10.000 linhas** por requisição (`PGRST_MAX_ROWS`). O banco possuía **100.109+ aparições**, mas o código tentava carregar todas via `useList` com `pageSize: 100000`:

```typescript
// ANTES (com problema):
const { data: aparicoesData } = useList<Aparicoes>({
  resource: "aparicoes",
  pagination: {
    pageSize: 100000, // Supabase ignora e retorna apenas 10.000
    mode: "server",
  },
});
```

O Supabase retornava apenas as **10.000 aparições mais recentes** (confirmado pelo header `Content-Range: 0-9999/100109`). Ao filtrar por um CNPJ específico dentro desses 10K resultados, apenas um subconjunto das aparições reais era encontrado.

## Solução

Substituímos o carregamento em massa por **queries diretas e direcionadas** ao Supabase:

1. **Contagem de "Nota >= 60"**: Query direta filtrando apenas os 50 `consulta_id` das últimas consultas com `nota >= 60`
2. **Histórico do fornecedor (modal)**: Query direta por `cnpj_basico` específico quando o usuário clica no botão
3. **Estatísticas de score**: Calculadas a partir dos dados completos retornados pela query direcionada

```typescript
// DEPOIS (corrigido):
// 1. Para contagem na tabela
const { data } = await supabaseClient
  .from("aparicoes")
  .select("consulta_id, nota")
  .in("consulta_id", consultaIds) // Apenas 50 IDs
  .gte("nota", 60);

// 2. Para histórico completo no modal
const { data: todasAparicoes } = await supabaseClient
  .from("aparicoes")
  .select("*")
  .in("cnpj_basico", cnpjsBasicos) // Poucos CNPJs específicos
  .order("created_at", { ascending: false });
```

## Arquivos Alterados

- `src/pages/dashboard-comprador/index.tsx`

## Impacto

- Corrige a exibição do histórico completo de aparições por fornecedor
- Reduz o consumo de memória do browser (não carrega 100K+ linhas)
- Queries mais rápidas (buscam apenas dados necessários)

## Componentes Afetados e Corrigidos

### 1. `src/pages/dashboard-comprador/index.tsx` (modal "Nota >= 60")
- **Estratégia**: Queries diretas ao Supabase sob demanda (quando o usuário clica)
- Não carrega mais aparições em massa

### 2. `src/pages/dashboard-comprador/FornecedoresTable.tsx` (tabela de fornecedores)
- **Estratégia**: Carregamento paginado em lotes de 10K usando `supabaseClient.range()`
- Carrega todas as 100K+ aparições em ~11 requests

### 3. `src/pages/dashboard-fornecedor/index.tsx` + `AparicoesTable.tsx`
- **Estratégia**: Carregamento paginado em lotes de 10K (mesmo padrão)
- KPI "Total de Fornecedores Pesquisados" agora reflete dados completos

### Componente sem impacto:
- `CompradoresTable.tsx` — Usa apenas `consultas` (635) e `usuario_comprador` (136), ambos dentro do limite

## Padrão para Futuras Consultas

Sempre que precisar carregar a tabela `aparicoes` (100K+ registros), usar carregamento em lotes:
```typescript
const pageSize = 10000;
let page = 0;
let hasMore = true;
while (hasMore) {
  const from = page * pageSize;
  const to = from + pageSize - 1;
  const { data } = await supabaseClient
    .from("aparicoes")
    .select("*")
    .range(from, to);
  // ...
  hasMore = data.length === pageSize;
  page++;
}
```
