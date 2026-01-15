-- Script SQL para configurar Row Level Security (RLS) no Supabase
-- Execute este script no SQL Editor do Supabase Dashboard

-- ============================================
-- OPÇÃO 1: Desabilitar RLS (APENAS PARA TESTES!)
-- ============================================
-- Use esta opção se quiser acesso total sem RLS
-- ⚠️ ATENÇÃO: Isso remove a segurança. Use apenas em desenvolvimento!

-- ALTER TABLE busca_fornecedor.usuario_comprador DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE busca_fornecedor.usuario_fornecedor DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE busca_fornecedor.consultas DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE busca_fornecedor.aparicoes DISABLE ROW LEVEL SECURITY;

-- ============================================
-- OPÇÃO 2: Criar Políticas RLS (RECOMENDADO)
-- ============================================
-- Permite leitura pública (read-only) para usuários anônimos

-- Habilitar RLS nas tabelas
ALTER TABLE busca_fornecedor.usuario_comprador ENABLE ROW LEVEL SECURITY;
ALTER TABLE busca_fornecedor.usuario_fornecedor ENABLE ROW LEVEL SECURITY;
ALTER TABLE busca_fornecedor.consultas ENABLE ROW LEVEL SECURITY;
ALTER TABLE busca_fornecedor.aparicoes ENABLE ROW LEVEL SECURITY;

-- Criar políticas de leitura pública (SELECT)
CREATE POLICY "Permitir leitura pública - usuario_comprador" 
ON busca_fornecedor.usuario_comprador
FOR SELECT 
USING (true);

CREATE POLICY "Permitir leitura pública - usuario_fornecedor" 
ON busca_fornecedor.usuario_fornecedor
FOR SELECT 
USING (true);

CREATE POLICY "Permitir leitura pública - consultas" 
ON busca_fornecedor.consultas
FOR SELECT 
USING (true);

CREATE POLICY "Permitir leitura pública - aparicoes" 
ON busca_fornecedor.aparicoes
FOR SELECT 
USING (true);

-- ============================================
-- Verificar se as políticas foram criadas
-- ============================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'busca_fornecedor'
ORDER BY tablename, policyname;

