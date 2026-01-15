import { useShow } from "@refinedev/core";
import { TextField, DateField, NumberField } from "@refinedev/antd";
import { Typography, Descriptions, Card, Spin } from "antd";
import { Aparicoes } from "../../types/database";

const { Title } = Typography;

export const AparicoesShow = () => {
  const { queryResult } = useShow<Aparicoes>({
    resource: "aparicoes",
  });

  const { data, isLoading } = queryResult;
  const record = data?.data;

  const cnpj = record
    ? `${record.cnpj_basico}/${record.cnpj_ordem}-${record.cnpj_dv}`
    : "-";

  if (isLoading) {
    return (
      <div style={{ padding: "24px", textAlign: "center" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Card style={{ margin: "24px" }}>
      <Title level={5}>Detalhes da Aparição</Title>
      <Descriptions bordered column={1}>
        <Descriptions.Item label="ID">
          <TextField value={record?.id} />
        </Descriptions.Item>
        <Descriptions.Item label="CNPJ">
          <TextField value={cnpj} />
        </Descriptions.Item>
        <Descriptions.Item label="Consulta ID">
          <TextField value={record?.consulta_id} />
        </Descriptions.Item>
        <Descriptions.Item label="Comprador ID">
          <TextField value={record?.comprador_id || "-"} />
        </Descriptions.Item>
        <Descriptions.Item label="Nota">
          <NumberField 
            value={record?.nota} 
            valueIfEmpty="-"
            options={{ style: "decimal" }}
          />
        </Descriptions.Item>
        <Descriptions.Item label="Data">
          <DateField 
            value={record?.created_at} 
            format="DD/MM/YYYY HH:mm:ss"
            valueIfEmpty="-"
          />
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
};

