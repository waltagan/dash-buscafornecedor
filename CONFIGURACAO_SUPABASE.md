# Configuração do Supabase - Por que não usar a Connection String Direta?

## ⚠️ Diferença entre Connection String e Cliente Supabase

### Connection String Direta (PostgreSQL)
```
postgresql://postgres.hccolkrnyrxcbxuuajwq:1d8vUnUlDXT7cmox@aws-0-sa-east-1.pooler.supabase.com:5432/postgres
```

**Quando usar:**
- ✅ Scripts de introspecção do schema (como fizemos na Fase 1)
- ✅ Migrações e configuração inicial
- ✅ Backend/server-side (nunca no frontend!)

**Por que NÃO usar no frontend:**
- ❌ Expõe credenciais sensíveis (senha do banco)
- ❌ Bypassa a camada de segurança do Supabase (RLS - Row Level Security)
- ❌ Não funciona com o cliente Supabase.js
- ❌ Credenciais ficam visíveis no código JavaScript do navegador

### Cliente Supabase (Recomendado para Frontend)
```javascript
import { createClient } from "@supabase/supabase-js";

const supabaseClient = createClient(
  "https://hccolkrnyrxcbxuuajwq.supabase.co",  // URL pública
  "sua-anon-key-aqui"                          // Chave anônima (segura)
);
```

**Vantagens:**
- ✅ Seguro para usar no frontend
- ✅ Respeita RLS (Row Level Security)
- ✅ Integração nativa com Refine.dev
- ✅ API REST otimizada
- ✅ Funcionalidades extras (realtime, storage, etc.)

## 🔍 Como obter as credenciais corretas

### 1. URL do Supabase
Baseado na connection string, o Project ID é: `hccolkrnyrxcbxuuajwq`

**URL provável:**
```
https://hccolkrnyrxcbxuuajwq.supabase.co
```

### 2. Anon Key (Chave Anônima)
Você precisa obter no Supabase Dashboard:
1. Acesse: https://supabase.com/dashboard
2. Selecione o projeto
3. Vá em **Settings > API**
4. Copie a **anon public** key (não a service_role!)

## 📝 Configuração do .env

Crie/edite o arquivo `.env`:

```env
# URL do Supabase (extraída da connection string)
VITE_SUPABASE_URL=https://hccolkrnyrxcbxuuajwq.supabase.co

# Anon Key (obtenha no Dashboard > Settings > API)
VITE_SUPABASE_ANON_KEY=sua_anon_key_aqui
```

## 🔐 Segurança

- ✅ **Anon Key**: Segura para frontend, respeita RLS
- ❌ **Connection String**: NUNCA no frontend, apenas backend/introspecção
- ✅ **Service Role Key**: Apenas backend, nunca frontend

## 📚 Referência no PRD

O próprio PRD menciona:
> "A conexão direta via string abaixo deve ser usada para introspecção do esquema e configuração inicial, mas **recomenda-se o uso do supabase-js client com as credenciais públicas/anon para o frontend**, configuradas com RLS (Row Level Security) se possível."

