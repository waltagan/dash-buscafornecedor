-- Fix RLS para permitir leitura pública (read-only) em todas as tabelas do schema busca_fornecedor
-- Isso permite que o dashboard administrativo acesse os dados usando a anon key

-- usuario_comprador
CREATE POLICY IF NOT EXISTS "Permitir leitura pública - usuario_comprador" 
  ON busca_fornecedor.usuario_comprador
  FOR SELECT 
  TO anon
  USING (true);

-- usuario_fornecedor
CREATE POLICY IF NOT EXISTS "Permitir leitura pública - usuario_fornecedor" 
  ON busca_fornecedor.usuario_fornecedor
  FOR SELECT 
  TO anon
  USING (true);

-- consultas (caso ainda não tenha)
CREATE POLICY IF NOT EXISTS "Permitir leitura pública - consultas" 
  ON busca_fornecedor.consultas
  FOR SELECT 
  TO anon
  USING (true);

-- aparicoes
CREATE POLICY IF NOT EXISTS "Permitir leitura pública - aparicoes" 
  ON busca_fornecedor.aparicoes
  FOR SELECT 
  TO anon
  USING (true);

-- Verificar todas as políticas criadas
SELECT 
    schemaname,
    tablename,
    policyname,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'busca_fornecedor' 
ORDER BY tablename, policyname;

