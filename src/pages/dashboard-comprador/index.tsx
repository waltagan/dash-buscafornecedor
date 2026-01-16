import { useList } from "@refinedev/core";
import { Card, Row, Col, Statistic, Radio, Space, Spin, Table, Typography, Tooltip, Button, Modal, Tag } from "antd";
import { UserOutlined, SearchOutlined, EyeOutlined } from "@ant-design/icons";
import { Line, Column } from "@ant-design/charts";
import { useState, useMemo } from "react";
import { CompradoresTable } from "./CompradoresTable";
import { FornecedoresTable } from "./FornecedoresTable";
import { UsuarioComprador, Consultas, UsuarioFornecedor, Aparicoes } from "../../types/database";
import { createClient } from "@supabase/supabase-js";

const { Text } = Typography;

type TimeFilter = "daily" | "weekly" | "monthly";

// Interface para fornecedores com nota alta
interface FornecedorNotaAlta {
  cnpjBasico: string;
  cnpjOrdem: string;
  cnpjDv: string;
  nota: number;
  nomeFornecedor: string;
  site: string;
  totalAparicoes: number;
  score0_10: number;
  score11_25: number;
  score26_50: number;
  score51_69: number;
  score70_90: number;
  score90_100: number;
}

export const DashboardComprador = () => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("monthly");
  const [modalFornecedoresVisible, setModalFornecedoresVisible] = useState(false);
  const [fornecedoresNotaAlta, setFornecedoresNotaAlta] = useState<FornecedorNotaAlta[]>([]);
  const [loadingFornecedores, setLoadingFornecedores] = useState(false);

  // Função auxiliar para criar cliente Supabase para cnpj_db
  const createCnpjDbClient = () => {
    const connectionString = import.meta.env.VITE_SUPABASE_CONNECTION_STRING || import.meta.env.SUPABASE_CONNECTION_STRING || "";
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
    const supabaseServiceRole = import.meta.env.VITE_SUPABASE_SERVICE_ROLE || import.meta.env.VITE_SERVICE_ROLE || "";

    let finalSupabaseUrl = supabaseUrl;
    let finalSupabaseAnonKey = supabaseAnonKey || supabaseServiceRole;

    if (connectionString && !supabaseUrl) {
      try {
        const url = new URL(connectionString.replace(/^postgresql:/, "postgres:"));
        const username = url.username;
        if (username.startsWith("postgres.")) {
          const projectRef = username.replace("postgres.", "");
          finalSupabaseUrl = `https://${projectRef}.supabase.co`;
        }
      } catch (e) {
        console.error("Erro ao parsear connection string:", e);
      }
    }

    if (!finalSupabaseUrl || !finalSupabaseAnonKey) {
      console.error("❌ Variáveis de ambiente não configuradas");
      return null;
    }

    return createClient(finalSupabaseUrl, finalSupabaseAnonKey, {
      db: {
        schema: "cnpj_db",
      },
    });
  };

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
      pageSize: 100000, // Garantir que todas as consultas sejam carregadas
      mode: "server",
    },
  });

  // Buscar dados de fornecedores para gráfico
  const { data: fornecedoresAll, isLoading: isLoadingFornecedoresChart } = useList<UsuarioFornecedor>({
    resource: "usuario_fornecedor",
    pagination: {
      mode: "off",
    },
  });

  // Buscar últimas 10 consultas
  const { data: ultimasConsultas, isLoading: isLoadingUltimasConsultas } = useList<Consultas>({
    resource: "consultas",
    pagination: {
      pageSize: 10,
      current: 1,
    },
    sorters: [
      {
        field: "created_at",
        order: "desc",
      },
    ],
  });

  // Buscar TODAS as aparições (sem limite) - ordenando por data mais recente
  const { data: aparicoesData, isLoading: isLoadingAparicoes } = useList<Aparicoes>({
    resource: "aparicoes",
    pagination: {
      pageSize: 100000, // Garantir que todas as aparições sejam carregadas
      mode: "server",
    },
    sorters: [
      {
        field: "created_at",
        order: "desc",
      },
    ],
  });

  // Log para debug: verificar se todas as aparições estão sendo carregadas
  console.log("📦 Aparições carregadas:", aparicoesData?.data?.length || 0, "de", aparicoesData?.total || 0);

  // Função para buscar fornecedores com nota > 60 para uma consulta
  const handleVerFornecedoresNotaAlta = async (consultaId: string) => {
    setLoadingFornecedores(true);
    setModalFornecedoresVisible(true);

    console.log("🔍 Buscando fornecedores com nota >= 60 para consulta:", consultaId);
    console.log("📦 Total de aparições carregadas:", aparicoesData?.data?.length || 0);
    
    // Debug: mostrar exemplos de consulta_id na tabela aparições
    const exemploConsultaIds = aparicoesData?.data?.slice(0, 5).map(a => a.consulta_id) || [];
    console.log("📋 Exemplos de consulta_id nas aparições:", exemploConsultaIds);
    console.log("🔑 ID da consulta selecionada:", consultaId);

    try {
      // Debug: mostrar algumas aparições dessa consulta
      const aparicoesDestaConsulta = aparicoesData?.data.filter(
        (a) => a.consulta_id === consultaId
      ) || [];
      console.log("📊 Aparições desta consulta:", aparicoesDestaConsulta.length);
      console.log("📊 Notas das aparições:", aparicoesDestaConsulta.map(a => ({ nota: a.nota, cnpj: a.cnpj_basico })));

      // Filtrar aparições dessa consulta com nota >= 60 (corrigido para >= ao invés de >)
      const aparicoesFiltradas = aparicoesData?.data.filter(
        (a) => a.consulta_id === consultaId && (a.nota ?? 0) >= 60
      ) || [];

      console.log("✅ Aparições com nota >= 60:", aparicoesFiltradas.length);

      if (aparicoesFiltradas.length === 0) {
        setFornecedoresNotaAlta([]);
        setLoadingFornecedores(false);
        return;
      }

      // Buscar nomes e sites dos fornecedores no cnpj_db
      const cnpjDbClient = createCnpjDbClient();
      const cnpjsBasicos = [...new Set(aparicoesFiltradas.map(a => a.cnpj_basico))];

      let nomesMap = new Map<string, string>();
      let sitesMap = new Map<string, string>();

      if (cnpjDbClient) {
        // Buscar nomes das empresas
        const { data: empresas } = await cnpjDbClient
          .from("empresas")
          .select("cnpj_basico, razao_social")
          .in("cnpj_basico", cnpjsBasicos);

        if (empresas) {
          empresas.forEach((emp: { cnpj_basico: string; razao_social: string }) => {
            nomesMap.set(String(emp.cnpj_basico).trim(), emp.razao_social);
          });
        }

        // Buscar sites dos estabelecimentos
        const { data: estabelecimentos } = await cnpjDbClient
          .from("estabelecimento")
          .select("cnpj_basico, cnpj_ordem, cnpj_dv, site")
          .in("cnpj_basico", cnpjsBasicos);

        if (estabelecimentos) {
          estabelecimentos.forEach((est: { cnpj_basico: string; cnpj_ordem: string; cnpj_dv: string; site: string }) => {
            if (est.site) {
              const cnpjKey = `${String(est.cnpj_basico).trim()}-${est.cnpj_ordem}-${est.cnpj_dv}`;
              sitesMap.set(cnpjKey, est.site);
            }
          });
        }
      }

      // Calcular estatísticas de TODAS as aparições de cada fornecedor
      const statsMap = new Map<string, {
        totalAparicoes: number;
        score0_10: number;
        score11_25: number;
        score26_50: number;
        score51_69: number;
        score70_90: number;
        score90_100: number;
      }>();

      // Processar TODAS as aparições para calcular estatísticas
      aparicoesData?.data?.forEach((aparicao) => {
        const cnpjKey = `${aparicao.cnpj_basico}-${aparicao.cnpj_ordem}-${aparicao.cnpj_dv}`;
        
        if (!statsMap.has(cnpjKey)) {
          statsMap.set(cnpjKey, {
            totalAparicoes: 0,
            score0_10: 0,
            score11_25: 0,
            score26_50: 0,
            score51_69: 0,
            score70_90: 0,
            score90_100: 0,
          });
        }

        const stats = statsMap.get(cnpjKey)!;
        stats.totalAparicoes++;

        const nota = aparicao.nota ?? 0;
        if (nota <= 10) stats.score0_10++;
        else if (nota <= 25) stats.score11_25++;
        else if (nota <= 50) stats.score26_50++;
        else if (nota <= 69) stats.score51_69++;
        else if (nota <= 90) stats.score70_90++;
        else stats.score90_100++;
      });

      // Montar lista de fornecedores
      const fornecedores: FornecedorNotaAlta[] = aparicoesFiltradas.map((a) => {
        const cnpjKey = `${a.cnpj_basico}-${a.cnpj_ordem}-${a.cnpj_dv}`;
        const stats = statsMap.get(cnpjKey) || {
          totalAparicoes: 0,
          score0_10: 0,
          score11_25: 0,
          score26_50: 0,
          score51_69: 0,
          score70_90: 0,
          score90_100: 0,
        };

        return {
          cnpjBasico: a.cnpj_basico,
          cnpjOrdem: a.cnpj_ordem,
          cnpjDv: a.cnpj_dv,
          nota: a.nota ?? 0,
          nomeFornecedor: nomesMap.get(String(a.cnpj_basico).trim()) || "-",
          site: sitesMap.get(cnpjKey) || "-",
          ...stats,
        };
      });

      // Ordenar por nota (maior primeiro)
      fornecedores.sort((a, b) => b.nota - a.nota);

      setFornecedoresNotaAlta(fornecedores);
    } catch (err) {
      console.error("Erro ao buscar fornecedores:", err);
      setFornecedoresNotaAlta([]);
    } finally {
      setLoadingFornecedores(false);
    }
  };

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

  // Processar dados das últimas 5 consultas (independente de ter nota alta ou não)
  const consultasProcessadas = useMemo(() => {
    if (!ultimasConsultas?.data) return [];

    // Debug: verificar se consulta específica está nas aparições
    const consultaDebug = "bca01b11-d042-4090-aaef-535be181de2f";
    const aparicoesDaConsultaDebug = aparicoesData?.data?.filter(a => a.consulta_id === consultaDebug) || [];
    console.log(`🔍 Debug: aparições da consulta ${consultaDebug}:`, aparicoesDaConsultaDebug.length);
    if (aparicoesDaConsultaDebug.length > 0) {
      console.log("📊 Notas encontradas:", aparicoesDaConsultaDebug.map(a => ({ nota: a.nota, cnpj: a.cnpj_basico })));
    }

    return ultimasConsultas.data.map((consulta) => {
      const comprador = compradoresMap.get(consulta.comprador || "");
      
      // Contar fornecedores com nota >= 60 para esta consulta
      const fornecedoresNotaAlta = aparicoesData?.data?.filter(
        (a) => a.consulta_id === consulta.id && (a.nota ?? 0) >= 60
      ).length || 0;

      // Debug para cada consulta
      if (consulta.id === consultaDebug) {
        console.log(`✅ Consulta ${consulta.id}: fornecedoresNotaAlta = ${fornecedoresNotaAlta}`);
      }
      
      return {
        id: consulta.id,
        comprador: comprador?.nome || "N/A",
        empresa: comprador?.empresa_nome || "N/A",
        parametros: consulta.parametros,
        resultados: consulta.resultados,
        createdAt: consulta.created_at,
        fornecedoresNotaAlta,
      };
    });
  }, [ultimasConsultas, compradoresMap, aparicoesData]);


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
            <Card title="Últimas 10 Consultas" loading={isLoadingUltimasConsultas || isLoadingAparicoes}>
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
                  <Table.Column
                    title="Nota ≥ 60"
                    width={120}
                    fixed="right"
                    render={(_, record: { id: string; fornecedoresNotaAlta: number }) => (
                      record.fornecedoresNotaAlta > 0 ? (
                        <Tooltip title={`Ver ${record.fornecedoresNotaAlta} fornecedor(es) com nota >= 60`}>
                          <Button
                            type="primary"
                            size="small"
                            icon={<EyeOutlined />}
                            onClick={() => handleVerFornecedoresNotaAlta(record.id)}
                          >
                            {record.fornecedoresNotaAlta} forn.
                          </Button>
                        </Tooltip>
                      ) : (
                        <Tag color="default">0</Tag>
                      )
                    )}
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

      {/* Modal de Fornecedores com Nota > 60 */}
      <Modal
        title={`Fornecedores com Nota ≥ 60`}
        open={modalFornecedoresVisible}
        onCancel={() => setModalFornecedoresVisible(false)}
        footer={[
          <Button key="close" onClick={() => setModalFornecedoresVisible(false)}>
            Fechar
          </Button>,
        ]}
        width={1400}
      >
        {loadingFornecedores ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <Spin />
            <p>Carregando fornecedores...</p>
          </div>
        ) : fornecedoresNotaAlta.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#999" }}>
            Nenhum fornecedor com nota maior ou igual a 60 nesta consulta.
          </div>
        ) : (
          <Table
            dataSource={fornecedoresNotaAlta}
            rowKey={(record) => `${record.cnpjBasico}-${record.cnpjOrdem}-${record.cnpjDv}`}
            pagination={false}
            size="small"
            scroll={{ x: "max-content" }}
          >
            <Table.Column
              title="Nome do Fornecedor"
              dataIndex="nomeFornecedor"
              width={200}
              render={(value) => <Text strong>{value || "-"}</Text>}
            />
            <Table.Column
              title="CNPJ"
              width={180}
              render={(_, record: FornecedorNotaAlta) => (
                <Text code>{`${record.cnpjBasico}/${record.cnpjOrdem}-${record.cnpjDv}`}</Text>
              )}
            />
            <Table.Column
              title="Site"
              dataIndex="site"
              width={180}
              render={(value: string) => {
                if (!value || value === "-") return <Text type="secondary">-</Text>;
                const url = value.startsWith("http") ? value : `https://${value}`;
                return (
                  <a 
                    href={url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ color: "#1890ff", wordBreak: "break-all" }}
                  >
                    {value}
                  </a>
                );
              }}
            />
            <Table.Column
              title="Nota Consulta"
              dataIndex="nota"
              width={100}
              render={(value: number) => {
                let color = "green";
                if (value <= 70) color = "cyan";
                else if (value <= 90) color = "blue";
                return <Tag color={color}>{value}</Tag>;
              }}
            />
            <Table.Column
              title="Total"
              dataIndex="totalAparicoes"
              width={70}
              render={(value) => <Tag color="purple">{value}</Tag>}
            />
            <Table.Column
              title="0-10"
              dataIndex="score0_10"
              width={60}
              render={(value) => <Tag color="red">{value}</Tag>}
            />
            <Table.Column
              title="11-25"
              dataIndex="score11_25"
              width={60}
              render={(value) => <Tag color="orange">{value}</Tag>}
            />
            <Table.Column
              title="26-50"
              dataIndex="score26_50"
              width={60}
              render={(value) => <Tag color="gold">{value}</Tag>}
            />
            <Table.Column
              title="51-69"
              dataIndex="score51_69"
              width={60}
              render={(value) => <Tag color="cyan">{value}</Tag>}
            />
            <Table.Column
              title="70-90"
              dataIndex="score70_90"
              width={60}
              render={(value) => <Tag color="blue">{value}</Tag>}
            />
            <Table.Column
              title="90-100"
              dataIndex="score90_100"
              width={70}
              render={(value) => <Tag color="green">{value}</Tag>}
            />
          </Table>
        )}
      </Modal>
    </div>
  );
};

