import { useTable, ShowButton } from "@refinedev/antd";
import { Table, Space, Tag, Card } from "antd";
import { Consultas } from "../../types/database";

export const ConsultasList = () => {
  const { tableProps } = useTable<Consultas>({
    resource: "consultas",
    meta: {
      select: "*",
    },
  });

  return (
    <Card title="Consultas" style={{ margin: "24px" }}>
      <Table
        {...tableProps}
        rowKey="id"
        pagination={{
          ...tableProps.pagination,
          showSizeChanger: true,
          showTotal: (total) => `Total: ${total} consultas`,
        }}
      >
        <Table.Column
          dataIndex="comprador"
          title="Comprador ID"
          render={(value) => value || "-"}
        />
        <Table.Column
          dataIndex="status"
          title="Status"
          sorter
          render={(value) => (
            <Tag color={value === "concluida" ? "green" : "orange"}>
              {value || "Pendente"}
            </Tag>
          )}
        />
        <Table.Column
          dataIndex="created_at"
          title="Data da Consulta"
          sorter
          defaultSortOrder="descend"
          render={(value) =>
            value ? new Date(value).toLocaleString("pt-BR") : "-"
          }
        />
        <Table.Column
          dataIndex="session_id"
          title="Session ID"
          render={(value) => value || "-"}
        />
        <Table.Column
          title="Ações"
          render={(_, record: Consultas) => (
            <Space>
              <ShowButton 
                hideText 
                size="small" 
                recordItemId={record.id}
                resource="consultas"
              />
            </Space>
          )}
        />
      </Table>
    </Card>
  );
};

