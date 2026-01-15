# Solução para Erro 401 (Unauthorized) e 42501 (Permission Denied)

## 🔴 Problemas Identificados

1. **401 Unauthorized**: A anon key não está autenticando corretamente
2. **42501 - permission denied for schema busca_fornecedor**: O schema não está acessível para a anon key

## ✅ Soluções

### Solução 1: Verificar Anon Key (Mais Provável)

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings > API**
4. Verifique se a **anon public** key no `.env` está correta
5. A key deve começar com `eyJ...` e ser bem longa

### Solução 2: Configurar Permissões no Schema (Recomendado)

Execute no **SQL Editor** do Supabase:

```sql
-- Conceder permissões de uso no schema para o role anon
GRANT USAGE ON SCHEMA busca_fornecedor TO anon;

-- Conceder permissões de SELECT nas tabelas para o role anon
GRANT SELECT ON busca_fornecedor.usuario_comprador TO anon;
GRANT SELECT ON busca_fornecedor.usuario_fornecedor TO anon;
GRANT SELECT ON busca_fornecedor.consultas TO anon;
GRANT SELECT ON busca_fornecedor.aparicoes TO anon;
```

### Solução 3: Desabilitar RLS Temporariamente (Para Testes)

Se as tabelas têm RLS ativado, desabilite temporariamente:

```sql
ALTER TABLE busca_fornecedor.usuario_comprador DISABLE ROW LEVEL SECURITY;
ALTER TABLE busca_fornecedor.usuario_fornecedor DISABLE ROW LEVEL SECURITY;
ALTER TABLE busca_fornecedor.consultas DISABLE ROW LEVEL SECURITY;
ALTER TABLE busca_fornecedor.aparicoes DISABLE ROW LEVEL SECURITY;
```

⚠️ **ATENÇÃO**: Isso remove a segurança. Use apenas para desenvolvimento!

### Solução 4: Criar Políticas RLS (Recomendado para Produção)

Se preferir manter RLS ativado, crie políticas de leitura:

```sql
-- Habilitar RLS nas tabelas
ALTER TABLE busca_fornecedor.usuario_comprador ENABLE ROW LEVEL SECURITY;
ALTER TABLE busca_fornecedor.usuario_fornecedor ENABLE ROW LEVEL SECURITY;
ALTER TABLE busca_fornecedor.consultas ENABLE ROW LEVEL SECURITY;
ALTER TABLE busca_fornecedor.aparicoes ENABLE ROW LEVEL SECURITY;

-- Criar políticas de leitura pública (read-only)
CREATE POLICY "Permitir leitura pública - compradores" 
  ON busca_fornecedor.usuario_comprador
  FOR SELECT 
  USING (true);

CREATE POLICY "Permitir leitura pública - fornecedores" 
  ON busca_fornecedor.usuario_fornecedor
  FOR SELECT 
  USING (true);

CREATE POLICY "Permitir leitura pública - consultas" 
  ON busca_fornecedor.consultas
  FOR SELECT 
  USING (true);

CREATE POLICY "Permitir leitura pública - aparições" 
  ON busca_fornecedor.aparicoes
  FOR SELECT 
  USING (true);
```

## 🔧 O que foi alterado no código

- Removida a configuração do schema no cliente Supabase
- Todos os recursos agora usam o formato `busca_fornecedor.tabela`
- Isso permite que o data provider acesse o schema correto

## 📝 Próximos Passos

1. Execute a **Solução 2** no SQL Editor do Supabase
2. Reinicie o servidor: `npm run dev`
3. Recarregue a página no navegador
4. Os erros 401 e 42501 devem desaparecer
