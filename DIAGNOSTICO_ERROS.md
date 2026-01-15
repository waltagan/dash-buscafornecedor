# Diagnóstico dos Erros

## 🔴 Erro Crítico: 401 Unauthorized

### Causa
O Supabase está rejeitando todas as requisições porque:
1. **Anon Key pode estar incorreta** - Verifique se copiou a chave correta
2. **RLS (Row Level Security) está bloqueando** - As tabelas podem ter RLS ativado sem políticas públicas
3. **Schema não acessível** - O schema `busca_fornecedor` pode não estar configurado para acesso público

### Solução Rápida (Testes)
Execute no **SQL Editor do Supabase Dashboard**:

```sql
-- Desabilitar RLS temporariamente (APENAS PARA TESTES!)
ALTER TABLE busca_fornecedor.usuario_comprador DISABLE ROW LEVEL SECURITY;
ALTER TABLE busca_fornecedor.usuario_fornecedor DISABLE ROW LEVEL SECURITY;
ALTER TABLE busca_fornecedor.consultas DISABLE ROW LEVEL SECURITY;
ALTER TABLE busca_fornecedor.aparicoes DISABLE ROW LEVEL SECURITY;
```

### Solução Recomendada (Produção)
Execute o arquivo `setup-rls.sql` no SQL Editor do Supabase para criar políticas de leitura pública.

## ⚠️ Warnings (Não Críticos)

### 1. React DevTools
```
Download the React DevTools for a better development experience
```
**Causa**: Aviso informativo do React  
**Solução**: Instale a extensão React DevTools no navegador (opcional)

### 2. Ant Design Menu `children` deprecated
```
Warning: [antd: Menu] `children` is deprecated. Please use `items` instead.
```
**Causa**: Versão antiga da API do Ant Design Menu (vindo do Refine)  
**Solução**: Pode ser ignorado - será corrigido em atualizações futuras do Refine

### 3. findDOMNode deprecated
```
Warning: findDOMNode is deprecated
```
**Causa**: Biblioteca antiga usando API deprecated do React  
**Solução**: Pode ser ignorado - será corrigido em atualizações futuras

### 4. React Router Future Flags
```
React Router Future Flag Warning: v7_startTransition, v7_relativeSplatPath
```
**Causa**: Avisos sobre mudanças futuras no React Router v7  
**Solução**: Pode ser ignorado - são avisos para preparação futura

### 5. useForm não conectado
```
Instance created by `useForm` is not connected to any Form element
```
**Causa**: Algum componente do Refine usando useForm sem Form  
**Solução**: Pode ser ignorado - não afeta funcionalidade

## ✅ Checklist de Verificação

- [ ] Anon Key está correta no `.env`?
- [ ] RLS está configurado ou desabilitado?
- [ ] Schema `busca_fornecedor` existe e está acessível?
- [ ] Servidor foi reiniciado após atualizar `.env`?

## 🚀 Próximos Passos

1. **Primeiro**: Resolva o erro 401 executando o SQL acima
2. **Depois**: Os warnings podem ser ignorados (não afetam funcionalidade)
3. **Opcional**: Atualize as bibliotecas no futuro para remover warnings

