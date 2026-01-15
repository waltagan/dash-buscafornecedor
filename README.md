# BuscaFornecedor Admin Dashboard

Dashboard administrativo Read-Only para visualização de métricas de compradores e fornecedores da plataforma BuscaFornecedor.

## Stack Tecnológica

- **Framework**: Refine.dev (React)
- **UI Library**: Ant Design
- **Backend/Database**: Supabase (PostgreSQL)
- **Build Tool**: Vite
- **TypeScript**: Sim

## Estrutura do Projeto

```
dash_busca/
├── src/
│   ├── types/
│   │   └── database.ts          # Interfaces TypeScript do schema
│   ├── utils/
│   │   └── supabaseClient.ts    # Cliente Supabase configurado
│   ├── App.tsx                  # Componente principal do Refine
│   └── main.tsx                 # Entry point
├── prd.txt                      # Product Requirements Document
└── package.json
```

## Schema do Banco de Dados

O projeto utiliza o schema `busca_fornecedor` no Supabase com as seguintes tabelas:

### Tabelas Mapeadas

1. **usuario_comprador**: Perfil dos compradores
2. **usuario_fornecedor**: Perfil dos fornecedores
3. **consultas**: Logs de buscas realizadas
4. **aparicoes**: Resultados gerados pelas consultas

As interfaces TypeScript foram inferidas através de introspecção do banco e estão disponíveis em `src/types/database.ts`.

## Configuração

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

### 3. Executar o Projeto

```bash
npm run dev
```

## Modo Read-Only

O sistema está configurado estritamente em modo Read-Only:
- ✅ Apenas visualização (list e show)
- ❌ Sem criação (canCreate: false)
- ❌ Sem edição (canEdit: false)
- ❌ Sem exclusão (canDelete: false)

## Status de Implementação

### ✅ Fase 1: Setup e Reconhecimento - CONCLUÍDA
- [x] Análise do schema do banco de dados
- [x] Interfaces TypeScript criadas
- [x] Projeto Refine configurado
- [x] Cliente Supabase configurado

### ✅ Fase 2: Construção dos Recursos - CONCLUÍDA
- [x] Páginas de listagem para cada recurso
- [x] Páginas de detalhes (show) para cada recurso
- [x] Rotas configuradas (apenas list e show)
- [x] Modo Read-Only garantido (sem create/edit/delete)

### ✅ Fase 3: Dashboard Comprador - CONCLUÍDA
- [x] KPIs: Total de Compradores e Total de Consultas
- [x] Gráfico de Novos Compradores (linha)
- [x] Gráfico de Volume de Consultas (barras)
- [x] Filtro temporal (Diária, Semanal, Mensal)
- [x] Tabela de Compradores com drill-down para consultas

## Próximos Passos (Conforme PRD)

### Fase 4: Dashboard Fornecedor
- [ ] KPI: Total de Fornecedores Pesquisados
- [ ] Tabela de Aparições Aglutinada com buckets de score
- [ ] Drill-down para consultas originais

### Fase 4: Dashboard Fornecedor
- [ ] KPI: Total de Fornecedores Pesquisados
- [ ] Tabela de Aparições Aglutinada com buckets de score
- [ ] Drill-down para consultas originais

### Fase 5: Refinamento Visual
- [ ] Aplicar paleta Azul/Branco
- [ ] Revisar responsividade
- [ ] Testar filtros e ordenações

## Padrões e Tecnologias

- **Refine.dev**: Framework para dashboards administrativos
- **Ant Design**: Componentes UI
- **@ant-design/charts**: Gráficos (Line, Column)
- **Supabase**: Backend como serviço (PostgreSQL)
- **TypeScript**: Tipagem estática
- **Vite**: Build tool e dev server

