import { useTable, ShowButton } from "@refinedev/antd";
import { Table, Space, Card } from "antd";
import { Aparicoes } from "../../types/database";

export const AparicoesList = () => {
  const { tableProps } = useTable<Aparicoes>({
    resource: "aparicoes",
    meta: {
      select: "*",
    },
  });

  return (
    <Card title="Aparições" style={{ margin: "24px" }}>
      <Table
        {...tableProps}
        rowKey="id"
        pagination={{
          ...tableProps.pagination,
          showSizeChanger: true,
          showTotal: (total) => `Total: ${total} aparições`,
        }}
      >
        <Table.Column
          title="CNPJ"
          render={(_, record: Aparicoes) => {
            return `${record.cnpj_basico}/${record.cnpj_ordem}-${record.cnpj_dv}`;
          }}
        />
        <Table.Column
          dataIndex="consulta_id"
          title="Consulta ID"
          render={(value) => value || "-"}
        />
        <Table.Column
          dataIndex="comprador_id"
          title="Comprador ID"
          render={(value) => value || "-"}
        />
        <Table.Column
          dataIndex="nota"
          title="Nota"
          sorter
          render={(value) => value !== null && value !== undefined ? value : "-"}
        />
        <Table.Column
          dataIndex="created_at"
          title="Data"
          sorter
          render={(value) =>
            value ? new Date(value).toLocaleString("pt-BR") : "-"
          }
        />
        <Table.Column
          title="Ações"
          render={(_, record: Aparicoes) => (
            <Space>
              <ShowButton 
                hideText 
                size="small" 
                recordItemId={record.id}
                resource="aparicoes"
              />
            </Space>
          )}
        />
      </Table>
    </Card>
  );
};

