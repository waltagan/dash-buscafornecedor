import { useList } from "@refinedev/core";
import { Card, Row, Col, Statistic, Radio, Space, Spin, Table, Typography, Tooltip } from "antd";
import { UserOutlined, SearchOutlined } from "@ant-design/icons";
import { Line, Column } from "@ant-design/charts";
import { useState, useMemo } from "react";
import { CompradoresTable } from "./CompradoresTable";
import { FornecedoresTable } from "./FornecedoresTable";
import { UsuarioComprador, Consultas, UsuarioFornecedor, Aparicoes } from "../../types/database";

const { Text } = Typography;

type TimeFilter = "daily" | "weekly" | "monthly";

export const DashboardComprador = () => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("monthly");

  // Buscar total de compradores
  const { data: compradoresData, isLoading: isLoadingCompradores, error: compradoresError } = useList<UsuarioComprador>({
    resource: "usuario_comprador",
    pagination: {
      pageSize: 1,
    },
  });

  // Debug: Log erros
  if (compradoresError) {
    console.error("❌ Erro ao buscar compradores:", compradoresError);
  } else if (compradoresData) {
    console.log("✅ Compradores carregados:", {
      total: compradoresData.total,
      count: compradoresData.data?.length,
    });
  }

  // Buscar total de consultas
  const { data: consultasData, isLoading: isLoadingConsultas } = useList<Consultas>({
    resource: "consultas",
    pagination: {
      pageSize: 1,
    },
  });

  // Buscar dados para gráficos
  const { data: compradoresAll, isLoading: isLoadingCompradoresChart, error: compradoresAllError } = useList<UsuarioComprador>({
    resource: "usuario_comprador",
    pagination: {
      mode: "off",
    },
  });

  // Debug: Log erros
  if (compradoresAllError) {
    console.error("❌ Erro ao buscar todos os compradores:", compradoresAllError);
  } else if (compradoresAll) {
    console.log("✅ Todos os compradores carregados:", compradoresAll.data?.length || 0);
  }

  const { data: consultasAll, isLoading: isLoadingConsultasChart } = useList<Consultas>({
    resource: "consultas",
    pagination: {
      mode: "off",
    },
  });

  // Buscar dados de fornecedores para gráfico
  const { data: fornecedoresAll, isLoading: isLoadingFornecedoresChart } = useList<UsuarioFornecedor>({
    resource: "usuario_fornecedor",
    pagination: {
      mode: "off",
    },
  });

  // Buscar últimas 5 consultas
  const { data: ultimasConsultas, isLoading: isLoadingUltimasConsultas } = useList<Consultas>({
    resource: "consultas",
    pagination: {
      pageSize: 5,
      current: 1,
    },
    sorters: [
      {
        field: "created_at",
        order: "desc",
      },
    ],
  });

  // Buscar aparições para mostrar fornecedores encontrados
  const { isLoading: isLoadingAparicoes } = useList<Aparicoes>({
    resource: "aparicoes",
    pagination: {
      mode: "off",
    },
  });

  // Buscar todos compradores para lookup de nomes
  const { data: todosCompradores } = useList<UsuarioComprador>({
    resource: "usuario_comprador",
    pagination: {
      mode: "off",
    },
  });

  // Calcular KPIs
  const totalCompradores = compradoresData?.total || 0;
  const totalConsultas = consultasData?.total || 0;

  // Processar dados para gráficos
  const novosCompradoresData = useMemo(() => {
    if (!compradoresAll?.data) return [];

    const data = compradoresAll.data.map((item) => ({
      date: new Date(item.created_at).toISOString().split("T")[0],
      count: 1,
    }));

    // Agrupar por período
    const grouped: Record<string, number> = {};
    data.forEach((item) => {
      let key = "";
      const date = new Date(item.date);

      if (timeFilter === "daily") {
        key = date.toISOString().split("T")[0];
      } else if (timeFilter === "weekly") {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split("T")[0];
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      }

      grouped[key] = (grouped[key] || 0) + item.count;
    });

    return Object.entries(grouped)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [compradoresAll, timeFilter]);

  const volumeConsultasData = useMemo(() => {
    if (!consultasAll?.data) return [];

    const data = consultasAll.data.map((item) => ({
      date: new Date(item.created_at).toISOString().split("T")[0],
      count: 1,
    }));

    // Agrupar por período
    const grouped: Record<string, number> = {};
    data.forEach((item) => {
      let key = "";
      const date = new Date(item.date);

      if (timeFilter === "daily") {
        key = date.toISOString().split("T")[0];
      } else if (timeFilter === "weekly") {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split("T")[0];
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      }

      grouped[key] = (grouped[key] || 0) + item.count;
    });

    return Object.entries(grouped)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [consultasAll, timeFilter]);

  // Processar dados de novos fornecedores (mesmo padrão de compradores)
  const novosFornecedoresData = useMemo(() => {
    if (!fornecedoresAll?.data) return [];

    const data = fornecedoresAll.data.map((item) => ({
      date: new Date(item.created_at).toISOString().split("T")[0],
      count: 1,
    }));

    // Agrupar por período
    const grouped: Record<string, number> = {};
    data.forEach((item) => {
      let key = "";
      const date = new Date(item.date);

      if (timeFilter === "daily") {
        key = date.toISOString().split("T")[0];
      } else if (timeFilter === "weekly") {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split("T")[0];
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      }

      grouped[key] = (grouped[key] || 0) + item.count;
    });

    return Object.entries(grouped)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [fornecedoresAll, timeFilter]);

  const novosCompradoresConfig = {
    data: novosCompradoresData,
    xField: "date",
    yField: "count",
    point: {
      size: 5,
      shape: "diamond",
    },
    label: {
      style: {
        fill: "#aaa",
      },
    },
    smooth: true,
    color: "#1890ff",
  };

  const volumeConsultasConfig = {
    data: volumeConsultasData,
    xField: "date",
    yField: "count",
    color: "#52c41a",
    columnStyle: {
      radius: [4, 4, 0, 0],
    },
  };

  const novosFornecedoresConfig = {
    data: novosFornecedoresData,
    xField: "date",
    yField: "count",
    point: {
      size: 5,
      shape: "diamond",
    },
    label: {
      style: {
        fill: "#aaa",
      },
    },
    smooth: true,
    color: "#fa8c16", // Laranja para diferenciar de compradores
  };

  // Criar mapa de compradores para lookup
  const compradoresMap = useMemo(() => {
    const map = new Map<string, UsuarioComprador>();
    todosCompradores?.data?.forEach((c) => {
      map.set(c.id, c);
    });
    return map;
  }, [todosCompradores]);


  // Função para renderizar JSON de forma legível
  const renderJson = (value: unknown, maxLength: number = 100) => {
    if (!value) return "-";
    
    try {
      const jsonString = typeof value === "string" ? value : JSON.stringify(value, null, 2);
      
      // Extrair campos principais se for um objeto
      if (typeof value === "object" && value !== null) {
        const obj = value as Record<string, any>;
        const principais = Object.entries(obj)
          .slice(0, 3)
          .map(([k, v]) => `${k}: ${String(v).substring(0, 30)}`)
          .join(", ");
        
        return (
          <Tooltip title={<pre style={{ maxHeight: "300px", overflow: "auto" }}>{jsonString}</pre>}>
            <Text code style={{ fontSize: "12px", cursor: "pointer" }}>
              {principais.substring(0, maxLength)}...
            </Text>
          </Tooltip>
        );
      }
      
      if (jsonString.length <= maxLength) {
        return <Text code style={{ fontSize: "12px" }}>{jsonString}</Text>;
      }
      
      return (
        <Tooltip title={<pre style={{ maxHeight: "300px", overflow: "auto" }}>{jsonString}</pre>}>
          <Text code style={{ fontSize: "12px", cursor: "pointer" }}>
            {jsonString.substring(0, maxLength)}...
          </Text>
        </Tooltip>
      );
    } catch {
      return <Text code style={{ fontSize: "12px" }}>{String(value).substring(0, maxLength)}</Text>;
    }
  };

  // Processar dados das últimas consultas
  const consultasProcessadas = useMemo(() => {
    if (!ultimasConsultas?.data) return [];

    return ultimasConsultas.data.map((consulta) => {
      const comprador = compradoresMap.get(consulta.comprador || "");
      
      return {
        id: consulta.id,
        comprador: comprador?.nome || "N/A",
        empresa: comprador?.empresa_nome || "N/A",
        parametros: consulta.parametros,
        resultados: consulta.resultados,
        createdAt: consulta.created_at,
      };
    });
  }, [ultimasConsultas, compradoresMap]);


  return (
    <div style={{ padding: "24px" }}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {/* KPIs */}
        <Row gutter={16}>
          <Col xs={24} sm={12} lg={12}>
            <Card>
              <Statistic
                title="Total de Compradores Cadastrados"
                value={totalCompradores}
                prefix={<UserOutlined />}
                loading={isLoadingCompradores}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={12}>
            <Card>
              <Statistic
                title="Total Geral de Consultas Realizadas"
                value={totalConsultas}
                prefix={<SearchOutlined />}
                loading={isLoadingConsultas}
              />
            </Card>
          </Col>
        </Row>

        {/* Filtro Temporal */}
        <Card>
          <Space>
            <span>Período:</span>
            <Radio.Group
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              buttonStyle="solid"
            >
              <Radio.Button value="daily">Diária</Radio.Button>
              <Radio.Button value="weekly">Semanal</Radio.Button>
              <Radio.Button value="monthly">Mensal</Radio.Button>
            </Radio.Group>
          </Space>
        </Card>

        {/* Gráficos - Linha 1 */}
        <Row gutter={16}>
          <Col xs={24} lg={12}>
            <Card title="Novos Compradores" loading={isLoadingCompradoresChart}>
              {isLoadingCompradoresChart ? (
                <div style={{ textAlign: "center", padding: "40px" }}>
                  <Spin />
                </div>
              ) : (
                <Line {...novosCompradoresConfig} height={300} />
              )}
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="Novos Fornecedores" loading={isLoadingFornecedoresChart}>
              {isLoadingFornecedoresChart ? (
                <div style={{ textAlign: "center", padding: "40px" }}>
                  <Spin />
                </div>
              ) : (
                <Line {...novosFornecedoresConfig} height={300} />
              )}
            </Card>
          </Col>
        </Row>

        {/* Gráficos - Linha 2 */}
        <Row gutter={16}>
          <Col xs={24} lg={12}>
            <Card title="Volume de Consultas" loading={isLoadingConsultasChart}>
              {isLoadingConsultasChart ? (
                <div style={{ textAlign: "center", padding: "40px" }}>
                  <Spin />
                </div>
              ) : (
                <Column {...volumeConsultasConfig} height={300} />
              )}
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="Últimas 5 Consultas" loading={isLoadingUltimasConsultas || isLoadingAparicoes}>
              {isLoadingUltimasConsultas || isLoadingAparicoes ? (
                <div style={{ textAlign: "center", padding: "40px" }}>
                  <Spin />
                </div>
              ) : (
                <Table
                  dataSource={consultasProcessadas}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  scroll={{ x: "max-content", y: 300 }}
                >
                  <Table.Column
                    title="Comprador"
                    dataIndex="comprador"
                    width={150}
                    render={(value) => <Text strong>{value}</Text>}
                  />
                  <Table.Column
                    title="Empresa"
                    dataIndex="empresa"
                    width={150}
                  />
                  <Table.Column
                    title="Parâmetros"
                    dataIndex="parametros"
                    width={250}
                    render={(value) => renderJson(value, 80)}
                  />
                  <Table.Column
                    title="Resultados"
                    dataIndex="resultados"
                    width={250}
                    render={(value) => renderJson(value, 80)}
                  />
                  <Table.Column
                    title="Data"
                    dataIndex="createdAt"
                    width={120}
                    render={(value) => new Date(value).toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  />
                </Table>
              )}
            </Card>
          </Col>
        </Row>

        {/* Tabela de Compradores com Drill-down */}
        <Card title="Compradores">
          <CompradoresTable />
        </Card>

        {/* Tabela de Fornecedores com Drill-down */}
        <Card title="Fornecedores">
          <FornecedoresTable />
        </Card>
      </Space>
    </div>
  );
};

