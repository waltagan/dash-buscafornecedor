import { useShow } from "@refinedev/core";
import { TextField, DateField } from "@refinedev/antd";
import { Typography, Descriptions, Tag, Collapse, Card, Spin } from "antd";
import { Consultas } from "../../types/database";

const { Title } = Typography;
const { Panel } = Collapse;

export const ConsultasShow = () => {
  const { queryResult } = useShow<Consultas>({
    resource: "consultas",
  });

  const { data, isLoading } = queryResult;
  const record = data?.data;

  if (isLoading) {
    return (
      <div style={{ padding: "24px", textAlign: "center" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Card style={{ margin: "24px" }}>
      <Title level={5}>Detalhes da Consulta</Title>
      <Descriptions bordered column={1}>
        <Descriptions.Item label="ID">
          <TextField value={record?.id} />
        </Descriptions.Item>
        <Descriptions.Item label="Comprador ID">
          <TextField value={record?.comprador || "-"} />
        </Descriptions.Item>
        <Descriptions.Item label="Status">
          <Tag color={record?.status === "concluida" ? "green" : "orange"}>
            {record?.status || "Pendente"}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Session ID">
          <TextField value={record?.session_id || "-"} />
        </Descriptions.Item>
        <Descriptions.Item label="Execution ID">
          <TextField value={record?.execution_id || "-"} />
        </Descriptions.Item>
        <Descriptions.Item label="Data da Consulta">
          <DateField value={record?.created_at} format="DD/MM/YYYY HH:mm:ss" />
        </Descriptions.Item>
      </Descriptions>

      <Collapse style={{ marginTop: 16 }}>
        <Panel header="Parâmetros da Consulta" key="1">
          <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {record?.parametros
              ? JSON.stringify(record.parametros, null, 2)
              : "Nenhum parâmetro disponível"}
          </pre>
        </Panel>
        <Panel header="Resultados" key="2">
          <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {record?.resultados
              ? JSON.stringify(record.resultados, null, 2)
              : "Nenhum resultado disponível"}
          </pre>
        </Panel>
      </Collapse>
    </Card>
  );
};

