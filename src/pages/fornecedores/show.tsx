import { useShow } from "@refinedev/core";
import { TextField, DateField, BooleanField } from "@refinedev/antd";
import { Typography, Descriptions, Tag, Card, Spin } from "antd";
import { UsuarioFornecedor } from "../../types/database";

const { Title } = Typography;

export const FornecedoresShow = () => {
  const { queryResult } = useShow<UsuarioFornecedor>({
    resource: "usuario_fornecedor",
  });

  const { data, isLoading } = queryResult;
  const record = data?.data;

  const cnpj = record?.cnpj || 
    (record ? `${record.cnpj_basico}/${record.cnpj_ordem}-${record.cnpj_dv}` : "-");

  if (isLoading) {
    return (
      <div style={{ padding: "24px", textAlign: "center" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Card style={{ margin: "24px" }}>
      <Title level={5}>Detalhes do Fornecedor</Title>
      <Descriptions bordered column={1}>
        <Descriptions.Item label="ID">
          <TextField value={record?.id} />
        </Descriptions.Item>
        <Descriptions.Item label="Nome">
          <TextField value={record?.nome || "-"} />
        </Descriptions.Item>
        <Descriptions.Item label="CNPJ">
          <TextField value={cnpj} />
        </Descriptions.Item>
        <Descriptions.Item label="Telefone">
          <TextField value={record?.telefone || "-"} />
        </Descriptions.Item>
        <Descriptions.Item label="Plano">
          <Tag color="blue">{record?.plano_categoria}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Assinatura Ativa">
          <BooleanField value={record?.assinatura_ativa} />
        </Descriptions.Item>
        <Descriptions.Item label="Cadastro Incompleto">
          <BooleanField value={record?.cadastro_incompleto} />
        </Descriptions.Item>
        <Descriptions.Item label="Data Limite do Plano">
          {record?.data_limite_plano ? (
            <DateField 
              value={record.data_limite_plano} 
              format="DD/MM/YYYY"
            />
          ) : (
            "-"
          )}
        </Descriptions.Item>
        <Descriptions.Item label="Fim da Assinatura">
          {record?.subscription_end ? (
            <DateField 
              value={record.subscription_end} 
              format="DD/MM/YYYY"
            />
          ) : (
            "-"
          )}
        </Descriptions.Item>
        <Descriptions.Item label="Data de Cadastro">
          <DateField value={record?.created_at} format="DD/MM/YYYY HH:mm" />
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
};

