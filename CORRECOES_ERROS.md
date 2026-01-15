# Correções de Erros Implementadas

## 1. Erro: `Cannot read properties of undefined (reading 'flatMap')`

### Avaliação:
- **Causa**: O componente `List` do Refine tenta renderizar um `Breadcrumb` que precisa acessar os recursos através da rota atual. Como `CompradoresTable` está dentro do `DashboardComprador` (rota customizada `/dashboard-comprador`), o Breadcrumb não consegue encontrar o recurso `usuario_comprador` mapeado e tenta fazer `flatMap` em `undefined`.

### Solução Implementada:
- **Removido o componente `List`** de `CompradoresTable.tsx`
- **Usado apenas `Table` diretamente**, já que estamos dentro de um `Card` no Dashboard que já tem o título "Compradores"
- **Adicionado `resource="usuario_comprador"`** ao `ShowButton` para garantir que ele funcione corretamente

### Código Alterado:
```typescript
// ANTES (causava erro)
return (
  <List resource="usuario_comprador" canCreate={false} headerButtons={false}>
    <Table {...tableProps}>...</Table>
  </List>
);

// DEPOIS (corrigido)
return (
  <Table {...tableProps}>...</Table>
);
```

## 2. Warning: `[antd: Menu] children is deprecated`

### Avaliação:
- **Causa**: O componente interno do Refine (`ThemedSider`) ainda usa a API antiga do Menu do Ant Design (`children` em vez de `items`)
- **Impacto**: Apenas um warning, não afeta funcionalidade

### Solução Implementada:
- **Movida a supressão de warnings para antes do React renderizar** (nível de módulo)
- **Captura warnings mais cedo**, antes que sejam logados
- **Suprime apenas warnings específicos** do Refine/Ant Design

### Código Alterado:
```typescript
// ANTES (não capturava todos os warnings)
React.useEffect(() => {
  // Supressão aqui
}, []);

// DEPOIS (captura antes do React renderizar)
if (import.meta.env.DEV && typeof window !== 'undefined') {
  const originalWarn = console.warn;
  console.warn = (...args: any[]) => {
    // Supressão aqui
  };
}
```

## Resultado

✅ **Erro do flatMap resolvido**: Removido o `List` que causava o problema  
✅ **Warning do Menu suprimido**: Capturado antes do React renderizar  
✅ **Funcionalidade preservada**: Tabela continua funcionando normalmente  

## Arquivos Modificados

1. `src/pages/dashboard-comprador/CompradoresTable.tsx`
   - Removido import de `List`
   - Removido wrapper `<List>` ao redor da `Table`
   - Adicionado `resource` ao `ShowButton`

2. `src/App.tsx`
   - Movida supressão de warnings para nível de módulo
   - Melhorada captura de warnings do Menu

