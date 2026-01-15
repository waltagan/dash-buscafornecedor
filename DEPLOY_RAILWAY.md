# 🚂 Deploy no Railway - Dashboard BuscaFornecedor

## 📋 Pré-requisitos

1. Conta no [Railway](https://railway.app/)
2. Repositório GitHub configurado
3. Credenciais do Supabase

## 🚀 Passo a Passo para Deploy

### 1. Criar Novo Projeto no Railway

1. Acesse [Railway Dashboard](https://railway.app/dashboard)
2. Clique em "New Project"
3. Selecione "Deploy from GitHub repo"
4. Escolha o repositório: `waltagan/dash-buscafornecedor`
5. Clique em "Deploy Now"

### 2. Configurar Variáveis de Ambiente

No Railway Dashboard, vá em:
- **Settings** → **Variables** → **RAW Editor**

Cole as seguintes variáveis:

```env
# Supabase Connection String (Opção 1 - Recomendado)
VITE_SUPABASE_CONNECTION_STRING=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@[HOST]:[PORT]/[DB]

# OU Supabase URL + Keys (Opção 2)
VITE_SUPABASE_URL=https://[PROJECT_REF].supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_aqui

# Service Role (Opcional - Use com cuidado)
VITE_SUPABASE_SERVICE_ROLE=sua_service_role_key_aqui

# Porta (Railway define automaticamente)
PORT=5173
```

### 3. Configurações de Build (Automáticas)

O Railway detectará automaticamente as configurações através dos arquivos:

- ✅ `railway.json` - Configuração principal
- ✅ `nixpacks.toml` - Build system
- ✅ `package.json` - Scripts de build e start

**Build Command**: `npm install && npm run build`  
**Start Command**: `npm run start`

### 4. Deploy

1. O Railway iniciará o build automaticamente
2. Aguarde o processo de build (2-5 minutos)
3. Após conclusão, acesse a URL gerada pelo Railway

## 🔧 Configurações Importantes

### Porta Dinâmica

O Railway fornece a porta dinamicamente via variável `$PORT`. O projeto já está configurado para usar:

```typescript
// vite.config.ts
preview: {
  host: "0.0.0.0",
  port: parseInt(process.env.PORT || "5173"),
}
```

### Variáveis de Ambiente no Frontend

**IMPORTANTE**: No Vite, apenas variáveis com prefixo `VITE_` são expostas ao cliente.

✅ **Correto**: `VITE_SUPABASE_URL`  
❌ **Errado**: `SUPABASE_URL`

### Health Check

O Railway faz health check automático. A aplicação responde em:
- `https://[seu-app].up.railway.app/`

## 🔍 Verificar Logs

Para verificar logs de build e runtime:

1. No Railway Dashboard, clique no seu projeto
2. Vá em **Deployments**
3. Clique no deployment ativo
4. Veja os logs em tempo real

## 🛠️ Troubleshooting

### Erro: "Build Failed"

**Causa**: Falta de memória ou dependências
**Solução**: 
```bash
# No Railway, aumentar recursos em Settings > Resources
# Ou otimizar build
```

### Erro: "Application Failed to Respond"

**Causa**: Porta não configurada corretamente
**Solução**: Verificar se `PORT` está sendo usada:
```javascript
port: parseInt(process.env.PORT || "5173")
```

### Erro: "Supabase Connection Failed"

**Causa**: Variáveis de ambiente não configuradas
**Solução**: 
1. Verificar se variáveis começam com `VITE_`
2. Redeployar após adicionar variáveis
3. Verificar logs do console no browser (F12)

### Erro: "404 Not Found" ao acessar rotas

**Causa**: SPA routing não configurado
**Solução**: O Vite preview já serve o index.html para rotas SPA automaticamente

## 📊 Monitoramento

### Métricas Disponíveis

O Railway fornece:
- ✅ CPU Usage
- ✅ Memory Usage
- ✅ Network Traffic
- ✅ Response Time

Acesse em: **Metrics** no Dashboard

## 🔄 Atualizações Automáticas

O Railway monitora o repositório GitHub. Quando você faz push:

1. Railway detecta mudanças automaticamente
2. Inicia novo build
3. Deploy automático após build bem-sucedido
4. Zero downtime (Blue-Green deployment)

## 🔐 Segurança

### RLS (Row Level Security) no Supabase

Certifique-se que as políticas RLS estão ativas:

```sql
-- Já configurado em fix-rls-all-tables.sql
-- Permite leitura pública para anon role
```

### CORS

Se houver erro de CORS, configure no Supabase:
1. Dashboard → Authentication → URL Configuration
2. Adicione a URL do Railway em "Site URL" e "Redirect URLs"

## 🌐 Custom Domain (Opcional)

Para adicionar domínio customizado:

1. Railway Dashboard → **Settings** → **Domains**
2. Clique em "Add Domain"
3. Configure DNS records conforme instruções
4. Aguarde propagação (até 48h)

## 📝 Comandos Úteis

```bash
# Ver logs em tempo real (via Railway CLI)
railway logs

# Forçar redeploy
railway up --detach

# Abrir app no browser
railway open
```

## ✅ Checklist de Deploy

- [ ] Repositório no GitHub atualizado
- [ ] Variáveis de ambiente configuradas no Railway
- [ ] Build concluído sem erros
- [ ] Health check passando
- [ ] Dashboard abrindo corretamente
- [ ] Dados do Supabase carregando
- [ ] Gráficos renderizando
- [ ] Tabelas com drill-down funcionando
- [ ] Filtros temporais operando
- [ ] Console do browser sem erros críticos

## 🆘 Suporte

- **Railway Docs**: https://docs.railway.app/
- **Railway Discord**: https://discord.gg/railway
- **Vite Docs**: https://vitejs.dev/guide/
- **Refine Docs**: https://refine.dev/docs/

---

**Status**: ✅ Pronto para Deploy  
**Última atualização**: Janeiro 2026

