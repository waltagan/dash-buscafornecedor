import { useShow } from "@refinedev/core";
import { TextField, DateField } from "@refinedev/antd";
import { Typography, Descriptions, Card, Spin } from "antd";
import { UsuarioComprador } from "../../types/database";

const { Title } = Typography;

export const CompradoresShow = () => {
  const { queryResult } = useShow<UsuarioComprador>({
    resource: "usuario_comprador",
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
      <Title level={5}>Detalhes do Comprador</Title>
      <Descriptions bordered column={1}>
        <Descriptions.Item label="ID">
          <TextField value={record?.id} />
        </Descriptions.Item>
        <Descriptions.Item label="Nome">
          <TextField value={record?.nome || "-"} />
        </Descriptions.Item>
        <Descriptions.Item label="Empresa">
          <TextField value={record?.empresa_nome || "-"} />
        </Descriptions.Item>
        <Descriptions.Item label="Telefone">
          <TextField value={record?.telefone || "-"} />
        </Descriptions.Item>
        <Descriptions.Item label="Tier de Busca">
          <TextField value={record?.tier_busca} />
        </Descriptions.Item>
        <Descriptions.Item label="Código Embaixador">
          <TextField value={record?.codigo_embaixador?.toString() || "-"} />
        </Descriptions.Item>
        <Descriptions.Item label="Data de Cadastro">
          <DateField value={record?.created_at} format="DD/MM/YYYY HH:mm" />
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
};

