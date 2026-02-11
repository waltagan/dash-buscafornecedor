import { useList } from "@refinedev/core";
import { Card, Row, Col, Statistic, Space } from "antd";
import { ShopOutlined } from "@ant-design/icons";
import { useState, useMemo, useEffect } from "react";
import { Aparicoes, UsuarioFornecedor } from "../../types/database";
import { AparicoesTable } from "./AparicoesTable";
import { supabaseClient } from "../../utils/supabaseClient";

export const DashboardFornecedor = () => {
  // Carregar TODAS as aparições em lotes (PostgREST limita a 10K por request)
  // CORRIGIDO: useList com mode:"off" retornava apenas 10K de 100K+ registros
  const [allAparicoes, setAllAparicoes] = useState<Aparicoes[]>([]);
  const [isLoadingAparicoes, setIsLoadingAparicoes] = useState(true);

  useEffect(() => {
    const fetchAllAparicoes = async () => {
      setIsLoadingAparicoes(true);
      const allData: Aparicoes[] = [];
      const pageSize = 10000;
      let page = 0;
      let hasMore = true;

      while (hasMore) {
        const from = page * pageSize;
        const to = from + pageSize - 1;

        const { data, error } = await supabaseClient
          .from("aparicoes")
          .select("*")
          .range(from, to)
          .order("created_at", { ascending: false });

        if (error) {
          console.error(`Erro ao buscar aparições (lote ${page + 1}):`, error);
          break;
        }

        if (data && data.length > 0) {
          allData.push(...data);
          hasMore = data.length === pageSize;
        } else {
          hasMore = false;
        }
        page++;
      }

      console.log(`✅ DashboardFornecedor: ${allData.length} aparições carregadas em ${page} lotes`);
      setAllAparicoes(allData);
      setIsLoadingAparicoes(false);
    };

    fetchAllAparicoes();
  }, []);

  // Buscar todos os fornecedores para fazer join e pegar nomes
  const { data: fornecedoresData, isLoading: isLoadingFornecedores } = useList<UsuarioFornecedor>({
    resource: "usuario_fornecedor",
    pagination: {
      mode: "off",
    },
  });

  // Calcular total de fornecedores distintos (baseado em CNPJ único)
  const totalFornecedoresPesquisados = useMemo(() => {
    if (!allAparicoes || allAparicoes.length === 0) return 0;
    
    const cnpjsUnicos = new Set<string>();
    allAparicoes.forEach((aparicao) => {
      const cnpjKey = `${aparicao.cnpj_basico}-${aparicao.cnpj_ordem}-${aparicao.cnpj_dv}`;
      cnpjsUnicos.add(cnpjKey);
    });
    
    return cnpjsUnicos.size;
  }, [allAparicoes]);

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
            aparicoes={allAparicoes}
            fornecedores={fornecedoresData?.data || []}
            isLoading={isLoading}
          />
        </Card>
      </Space>
    </div>
  );
};

