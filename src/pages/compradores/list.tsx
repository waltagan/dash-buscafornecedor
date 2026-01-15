import { useTable, ShowButton } from "@refinedev/antd";
import { Table, Space, Card } from "antd";
import { UsuarioComprador } from "../../types/database";

export const CompradoresList = () => {
  const { tableProps } = useTable<UsuarioComprador>({
    resource: "usuario_comprador",
    meta: {
      select: "*",
    },
  });

  return (
    <Card title="Compradores" style={{ margin: "24px" }}>
      <Table
        {...tableProps}
        rowKey="id"
        pagination={{
          ...tableProps.pagination,
          showSizeChanger: true,
          showTotal: (total) => `Total: ${total} compradores`,
        }}
      >
        <Table.Column
          dataIndex="nome"
          title="Nome"
          sorter
          render={(value) => value || "-"}
        />
        <Table.Column
          dataIndex="empresa_nome"
          title="Empresa"
          sorter
          render={(value) => value || "-"}
        />
        <Table.Column
          dataIndex="telefone"
          title="Telefone"
          render={(value) => value || "-"}
        />
        <Table.Column
          dataIndex="tier_busca"
          title="Tier"
          sorter
        />
        <Table.Column
          dataIndex="created_at"
          title="Data de Cadastro"
          sorter
          render={(value) =>
            value ? new Date(value).toLocaleDateString("pt-BR") : "-"
          }
        />
        <Table.Column
          title="Ações"
          render={(_, record: UsuarioComprador) => (
            <Space>
              <ShowButton 
                hideText 
                size="small" 
                recordItemId={record.id}
                resource="usuario_comprador"
              />
            </Space>
          )}
        />
      </Table>
    </Card>
  );
};

