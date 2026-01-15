import { useList } from "@refinedev/core";
import { Card, Row, Col, Statistic, Space } from "antd";
import { ShopOutlined } from "@ant-design/icons";
import { useMemo } from "react";
import { Aparicoes, UsuarioFornecedor } from "../../types/database";
import { AparicoesTable } from "./AparicoesTable";

export const DashboardFornecedor = () => {
  // Buscar todas as aparições para calcular fornecedores distintos
  const { data: aparicoesData, isLoading: isLoadingAparicoes } = useList<Aparicoes>({
    resource: "aparicoes",
    pagination: {
      mode: "off",
    },
  });

  // Buscar todos os fornecedores para fazer join e pegar nomes
  const { data: fornecedoresData, isLoading: isLoadingFornecedores } = useList<UsuarioFornecedor>({
    resource: "usuario_fornecedor",
    pagination: {
      mode: "off",
    },
  });

  // Calcular total de fornecedores distintos (baseado em CNPJ único)
  const totalFornecedoresPesquisados = useMemo(() => {
    if (!aparicoesData?.data) return 0;
    
    const cnpjsUnicos = new Set<string>();
    aparicoesData.data.forEach((aparicao) => {
      const cnpjKey = `${aparicao.cnpj_basico}-${aparicao.cnpj_ordem}-${aparicao.cnpj_dv}`;
      cnpjsUnicos.add(cnpjKey);
    });
    
    return cnpjsUnicos.size;
  }, [aparicoesData]);

  const isLoading = isLoadingAparicoes || isLoadingFornecedores;

  return (
    <div style={{ padding: "24px" }}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {/* KPIs */}
        <Row gutter={16}>
          <Col xs={24} sm={12} lg={12}>
            <Card>
              <Statistic
                title="Total de Fornecedores Pesquisados"
                value={totalFornecedoresPesquisados}
                prefix={<ShopOutlined />}
                loading={isLoading}
              />
            </Card>
          </Col>
        </Row>

        {/* Tabela de Aparições Aglutinada */}
        <Card title="Aparições por Fornecedor">
          <AparicoesTable 
            aparicoes={aparicoesData?.data || []}
            fornecedores={fornecedoresData?.data || []}
            isLoading={isLoading}
          />
        </Card>
      </Space>
    </div>
  );
};

