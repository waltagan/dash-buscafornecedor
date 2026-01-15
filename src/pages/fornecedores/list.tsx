import { useTable, ShowButton } from "@refinedev/antd";
import { Table, Space, Tag, Card } from "antd";
import { UsuarioFornecedor } from "../../types/database";

export const FornecedoresList = () => {
  const { tableProps } = useTable<UsuarioFornecedor>({
    resource: "usuario_fornecedor",
    meta: {
      select: "*",
    },
  });

  return (
    <Card title="Fornecedores" style={{ margin: "24px" }}>
      <Table
        {...tableProps}
        rowKey="id"
        pagination={{
          ...tableProps.pagination,
          showSizeChanger: true,
          showTotal: (total) => `Total: ${total} fornecedores`,
        }}
      >
        <Table.Column
          dataIndex="nome"
          title="Nome"
          sorter
          render={(value) => value || "-"}
        />
        <Table.Column
          title="CNPJ"
          render={(_, record: UsuarioFornecedor) => {
            const cnpj = record.cnpj || 
              `${record.cnpj_basico}/${record.cnpj_ordem}-${record.cnpj_dv}`;
            return cnpj;
          }}
        />
        <Table.Column
          dataIndex="telefone"
          title="Telefone"
          render={(value) => value || "-"}
        />
        <Table.Column
          dataIndex="plano_categoria"
          title="Plano"
          sorter
          render={(value) => <Tag color="blue">{value}</Tag>}
        />
        <Table.Column
          dataIndex="assinatura_ativa"
          title="Ativo"
          render={(value) => (
            <Tag color={value ? "green" : "red"}>
              {value ? "Sim" : "Não"}
            </Tag>
          )}
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
          render={(_, record: UsuarioFornecedor) => (
            <Space>
              <ShowButton 
                hideText 
                size="small" 
                recordItemId={record.id}
                resource="usuario_fornecedor"
              />
            </Space>
          )}
        />
      </Table>
    </Card>
  );
};

