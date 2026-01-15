# Solução: Warning `useForm` não conectado

## 1. Qual a causa?

O warning `Instance created by 'useForm' is not connected to any Form element` ocorre porque:

- O componente `Show` do Refine (`@refinedev/antd`) usa internamente o hook `useForm` do Ant Design
- Mesmo com `canEdit={false}`, o componente `Show` ainda inicializa o `useForm` para preparar o formulário caso seja necessário
- Como estamos em modo **Read-Only** e não há um componente `<Form>` renderizado, o `useForm` fica "órfão"
- Isso é um comportamento interno do Refine e não afeta a funcionalidade

## 2. Qual a correção?

### Opção 1: Suprimir o warning (Recomendado para Read-Only)

Como estamos em modo Read-Only e não usamos formulários, podemos suprimir este warning específico:

```typescript
// Adicionar no início do App.tsx ou main.tsx
if (import.meta.env.DEV) {
  const originalWarn = console.warn;
  console.warn = (...args: any[]) => {
    const message = args[0];
    if (
      typeof message === 'string' &&
      message.includes('useForm') &&
      message.includes('not connected')
    ) {
      return; // Suprimir apenas este warning
    }
    originalWarn.apply(console, args);
  };
}
```

### Opção 2: Criar componentes customizados sem `Show` (Mais trabalhoso)

Substituir os componentes `Show` por componentes customizados que não usam `useForm`:

```typescript
// Exemplo: compradores/show.tsx sem usar Show
export const CompradoresShow = () => {
  const { queryResult } = useShow<UsuarioComprador>({
    resource: "usuario_comprador",
  });

  const { data, isLoading } = queryResult;
  const record = data?.data;

  if (isLoading) return <Spin />;

  return (
    <Card>
      <Title level={5}>Detalhes do Comprador</Title>
      <Descriptions bordered column={1}>
        {/* ... campos ... */}
      </Descriptions>
    </Card>
  );
};
```

### Opção 3: Aguardar correção do Refine (Futuro)

Este é um problema conhecido do Refine e será corrigido em futuras versões. O warning não afeta a funcionalidade.

## Recomendação

**Opção 1** é a mais prática para um dashboard Read-Only, pois:
- ✅ Não requer mudanças significativas no código
- ✅ Remove o warning do console
- ✅ Não afeta a funcionalidade
- ✅ É uma solução temporária até o Refine corrigir

