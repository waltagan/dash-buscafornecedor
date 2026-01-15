-- Fix RLS para permitir leitura pública (read-only) na tabela usuario_comprador
-- Isso permite que o dashboard administrativo acesse os dados usando a anon key

-- Criar política de leitura pública para anon
CREATE POLICY "Permitir leitura pública - usuario_comprador" 
  ON busca_fornecedor.usuario_comprador
  FOR SELECT 
  TO anon
  USING (true);

-- Verificar se a política foi criada
SELECT 
    schemaname,
    tablename,
    policyname,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'busca_fornecedor' 
AND tablename = 'usuario_comprador'
ORDER BY policyname;

