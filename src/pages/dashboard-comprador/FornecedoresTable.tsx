import { Table, Space, Tag, Tooltip, Typography } from "antd";
import { useList } from "@refinedev/core";
import { useState, useMemo, useEffect } from "react";
import { Aparicoes, UsuarioFornecedor, Consultas, UsuarioComprador } from "../../types/database";
import { ShowButton } from "@refinedev/antd";
import { createClient } from "@supabase/supabase-js";

const { Text } = Typography;

interface FornecedorAgregado {
  cnpjKey: string;
  cnpjBasico: string;
  cnpjOrdem: string;
  cnpjDv: string;
  nomeFornecedor: string; // Razão social ou nome fantasia
  siteFornecedor: string; // Site da empresa
  cnpjFormatado: string; // CNPJ formatado
  totalAparicoes: number;
  score0_10: number;
  score11_25: number;
  score26_50: number;
  score51_69: number;
  score70_90: number;
  score90_100: number;
  possuiCadastro: boolean; // Se está cadastrado em usuario_fornecedor
  planoAtivo: boolean; // Se possui plano ativo
}

// Função para renderizar JSON truncado
const renderJson = (value: unknown, maxLength: number = 80) => {
  if (!value) return "-";
  
  try {
    const jsonString = JSON.stringify(value, null, 2);
    if (jsonString.length <= maxLength) {
      return <Text code style={{ fontSize: "12px" }}>{jsonString}</Text>;
    }
    
    const truncated = jsonString.substring(0, maxLength) + "...";
    return (
      <Tooltip title={<pre style={{ maxWidth: "500px", maxHeight: "300px", overflow: "auto" }}>{jsonString}</pre>}>
        <Text code style={{ fontSize: "12px", cursor: "pointer" }}>{truncated}</Text>
      </Tooltip>
    );
  } catch {
    return <Text type="secondary">-</Text>;
  }
};

export const FornecedoresTable = () => {
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);
  const [nomesFornecedores, setNomesFornecedores] = useState<Map<string, string>>(new Map());
  const [sitesFornecedores, setSitesFornecedores] = useState<Map<string, string>>(new Map());
  const [isLoadingNomes, setIsLoadingNomes] = useState(false);
  const [isLoadingSites, setIsLoadingSites] = useState(false);

  // Função auxiliar para criar cliente Supabase para cnpj_db
  const createCnpjDbClient = () => {
    const connectionString = import.meta.env.VITE_SUPABASE_CONNECTION_STRING || import.meta.env.SUPABASE_CONNECTION_STRING || "";
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
    const supabaseServiceRole = import.meta.env.VITE_SUPABASE_SERVICE_ROLE || import.meta.env.VITE_SERVICE_ROLE || "";

    let finalSupabaseUrl = supabaseUrl;
    let finalSupabaseAnonKey = supabaseAnonKey || supabaseServiceRole;

    // Se usar connection string, extrair project ref
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

  // Buscar todas as aparições
  const { data: aparicoesData, isLoading: isLoadingAparicoes } = useList<Aparicoes>({
    resource: "aparicoes",
    pagination: {
      mode: "off",
    },
    meta: {
      select: "*",
    },
  });

  // Buscar todos os fornecedores para pegar nomes e dados de cadastro/plano
  const { data: fornecedoresData, isLoading: isLoadingFornecedores } = useList<UsuarioFornecedor>({
    resource: "usuario_fornecedor",
    pagination: {
      mode: "off",
    },
    meta: {
      select: "*, cnpj_basico, assinatura_ativa, plano_categoria",
    },
  });

  // Buscar todos os compradores para pegar nomes e empresas
  const { data: compradoresData, isLoading: isLoadingCompradores } = useList<UsuarioComprador>({
    resource: "usuario_comprador",
    pagination: {
      mode: "off",
    },
    meta: {
      select: "*",
    },
  });

  // Buscar todas as consultas
  const { data: consultasData, isLoading: isLoadingConsultas } = useList<Consultas>({
    resource: "consultas",
    pagination: {
      mode: "off",
    },
    meta: {
      select: "*",
    },
  });

  // Criar mapa de fornecedores por CNPJ completo
  const fornecedoresMap = useMemo(() => {
    const map = new Map<string, UsuarioFornecedor>();
    fornecedoresData?.data.forEach((fornecedor) => {
      const cnpjKey = `${fornecedor.cnpj_basico}-${fornecedor.cnpj_ordem}-${fornecedor.cnpj_dv}`;
      map.set(cnpjKey, fornecedor);
    });
    return map;
  }, [fornecedoresData]);

  // Criar mapa adicional por cnpj_basico (para verificar cadastro/plano)
  const fornecedoresPorCnpjBasico = useMemo(() => {
    const map = new Map<string, UsuarioFornecedor[]>();
    fornecedoresData?.data.forEach((fornecedor) => {
      const cnpjBasico = fornecedor.cnpj_basico.trim();
      if (!map.has(cnpjBasico)) {
        map.set(cnpjBasico, []);
      }
      map.get(cnpjBasico)!.push(fornecedor);
    });
    return map;
  }, [fornecedoresData]);

  // Criar mapa de compradores por ID
  const compradoresMap = useMemo(() => {
    const map = new Map<string, UsuarioComprador>();
    compradoresData?.data.forEach((comprador) => {
      map.set(comprador.id, comprador);
    });
    return map;
  }, [compradoresData]);

  // Agregar aparições por fornecedor - SEM BUSCAR NOMES AINDA
  const fornecedoresAgregados = useMemo(() => {
    if (!aparicoesData?.data || aparicoesData.data.length === 0) return [];

    const agregado = new Map<string, {
      cnpjBasico: string;
      cnpjOrdem: string;
      cnpjDv: string;
      aparicoes: Aparicoes[];
    }>();

    aparicoesData.data.forEach((aparicao) => {
      const cnpjKey = `${aparicao.cnpj_basico}-${aparicao.cnpj_ordem}-${aparicao.cnpj_dv}`;
      
      if (!agregado.has(cnpjKey)) {
        agregado.set(cnpjKey, {
          cnpjBasico: String(aparicao.cnpj_basico).trim(),
          cnpjOrdem: aparicao.cnpj_ordem,
          cnpjDv: aparicao.cnpj_dv,
          aparicoes: [],
        });
      }
      
      agregado.get(cnpjKey)!.aparicoes.push(aparicao);
    });

    // Converter para array e calcular buckets
    const resultado: FornecedorAgregado[] = Array.from(agregado.entries()).map(([cnpjKey, dados]) => {
      const fornecedor = fornecedoresMap.get(cnpjKey);
      const cnpjFormatado = fornecedor?.cnpj || `${dados.cnpjBasico}/${dados.cnpjOrdem}-${dados.cnpjDv}`;

      // Verificar cadastro e plano ativo
      const fornecedoresCnpj = fornecedoresPorCnpjBasico.get(dados.cnpjBasico) || [];
      const possuiCadastro = fornecedoresCnpj.length > 0;
      const planoAtivo = fornecedoresCnpj.some(f => f.assinatura_ativa === true);

      // Calcular buckets de score
      let score0_10 = 0, score11_25 = 0, score26_50 = 0, score51_69 = 0, score70_90 = 0, score90_100 = 0;

      dados.aparicoes.forEach((aparicao) => {
        const nota = aparicao.nota ?? 0;
        if (nota <= 10) score0_10++;
        else if (nota <= 25) score11_25++;
        else if (nota <= 50) score26_50++;
        else if (nota <= 69) score51_69++;
        else if (nota <= 90) score70_90++;
        else score90_100++;
      });

      return {
        cnpjKey,
        cnpjBasico: dados.cnpjBasico,
        cnpjOrdem: dados.cnpjOrdem,
        cnpjDv: dados.cnpjDv,
        nomeFornecedor: fornecedor?.nome || "-",
        siteFornecedor: "-", // Será preenchido depois pelo enriquecimento
        cnpjFormatado,
        totalAparicoes: dados.aparicoes.length,
        score0_10, score11_25, score26_50, score51_69, score70_90, score90_100,
        possuiCadastro,
        planoAtivo,
      };
    });

    return resultado.sort((a, b) => b.totalAparicoes - a.totalAparicoes);
  }, [aparicoesData, fornecedoresMap]);

  // Buscar TODOS os nomes de uma vez (solução simples e direta)
  useEffect(() => {
    const fetchTodosNomes = async () => {
      if (!fornecedoresAgregados || fornecedoresAgregados.length === 0) return;
      if (nomesFornecedores.size > 0) return; // Já buscamos

      const todosCnpjs = fornecedoresAgregados.map(f => f.cnpjBasico);
      
      console.log(`🔍 Buscando nomes para TODOS os ${todosCnpjs.length} fornecedores...`);
      setIsLoadingNomes(true);

      try {
        const cnpjDbClient = createCnpjDbClient();
        if (!cnpjDbClient) {
          console.error("❌ Não foi possível criar cliente para cnpj_db");
          return;
        }

        // Buscar todos de uma vez (Supabase suporta até 1000 por query, vamos fazer em lotes)
        const batchSize = 1000;
        const allNames = new Map<string, string>();

        for (let i = 0; i < todosCnpjs.length; i += batchSize) {
          const batch = todosCnpjs.slice(i, i + batchSize);
          console.log(`  📦 Buscando lote ${Math.floor(i / batchSize) + 1}/${Math.ceil(todosCnpjs.length / batchSize)} (${batch.length} CNPJs)`);

          const { data, error } = await cnpjDbClient
            .from("empresas")
            .select("cnpj_basico, razao_social")
            .in("cnpj_basico", batch);

          if (error) {
            console.error(`  ❌ Erro no lote ${Math.floor(i / batchSize) + 1}:`, error);
            continue;
          }

          if (data) {
            data.forEach(emp => {
              if (emp.razao_social) {
                allNames.set(String(emp.cnpj_basico).trim(), emp.razao_social);
              }
            });
            console.log(`  ✅ ${data.length} nomes encontrados neste lote`);
          }
        }

        console.log(`✅ Total de nomes carregados: ${allNames.size} de ${todosCnpjs.length}`);
        setNomesFornecedores(allNames);
      } catch (err) {
        console.error("❌ Erro ao buscar nomes:", err);
      } finally {
        setIsLoadingNomes(false);
      }
    };

    fetchTodosNomes();
  }, [fornecedoresAgregados]);

  // Buscar TODOS os sites de uma vez (da tabela estabelecimento)
  useEffect(() => {
    const fetchTodosSites = async () => {
      if (!fornecedoresAgregados || fornecedoresAgregados.length === 0) return;
      if (sitesFornecedores.size > 0) return; // Já buscamos

      // Precisamos dos CNPJs completos (basico + ordem + dv) para buscar na tabela estabelecimento
      const todosCnpjsCompletos = fornecedoresAgregados.map(f => ({
        cnpjBasico: f.cnpjBasico,
        cnpjOrdem: f.cnpjOrdem,
        cnpjDv: f.cnpjDv,
        cnpjKey: f.cnpjKey,
      }));
      
      console.log(`🔍 Buscando sites para TODOS os ${todosCnpjsCompletos.length} fornecedores...`);
      setIsLoadingSites(true);

      try {
        const cnpjDbClient = createCnpjDbClient();
        if (!cnpjDbClient) {
          console.error("❌ Não foi possível criar cliente para cnpj_db");
          return;
        }

        // Buscar todos de uma vez (Supabase suporta até 1000 por query, vamos fazer em lotes)
        const batchSize = 500;
        const allSites = new Map<string, string>();

        for (let i = 0; i < todosCnpjsCompletos.length; i += batchSize) {
          const batch = todosCnpjsCompletos.slice(i, i + batchSize);
          console.log(`  📦 Buscando sites lote ${Math.floor(i / batchSize) + 1}/${Math.ceil(todosCnpjsCompletos.length / batchSize)} (${batch.length} CNPJs)`);

          // Buscar por cnpj_basico, cnpj_ordem e cnpj_dv na tabela estabelecimento
          const cnpjsBasicos = [...new Set(batch.map(c => c.cnpjBasico))];
          
          const { data, error } = await cnpjDbClient
            .from("estabelecimento")
            .select("cnpj_basico, cnpj_ordem, cnpj_dv, site")
            .in("cnpj_basico", cnpjsBasicos);

          if (error) {
            console.error(`  ❌ Erro no lote ${Math.floor(i / batchSize) + 1}:`, error);
            continue;
          }

          if (data) {
            data.forEach(est => {
              if (est.site) {
                const cnpjKey = `${String(est.cnpj_basico).trim()}-${est.cnpj_ordem}-${est.cnpj_dv}`;
                allSites.set(cnpjKey, est.site);
              }
            });
            console.log(`  ✅ ${data.length} estabelecimentos encontrados neste lote`);
          }
        }

        console.log(`✅ Total de sites carregados: ${allSites.size} de ${todosCnpjsCompletos.length}`);
        setSitesFornecedores(allSites);
      } catch (err) {
        console.error("❌ Erro ao buscar sites:", err);
      } finally {
        setIsLoadingSites(false);
      }
    };

    fetchTodosSites();
  }, [fornecedoresAgregados]);

  // Enriquecer fornecedores com nomes e sites (apenas para visualização)
  const fornecedoresComNomes = useMemo(() => {
    return fornecedoresAgregados.map(f => ({
      ...f,
      nomeFornecedor: nomesFornecedores.get(f.cnpjBasico) || f.nomeFornecedor,
      siteFornecedor: sitesFornecedores.get(f.cnpjKey) || f.siteFornecedor,
    }));
  }, [fornecedoresAgregados, nomesFornecedores, sitesFornecedores]);

  // Função para renderizar sub-tabela de consultas
  const ConsultasSubTable = ({ cnpjBasico, cnpjOrdem, cnpjDv }: { 
    cnpjBasico: string; 
    cnpjOrdem: string; 
    cnpjDv: string;
  }) => {
    // Buscar aparições deste fornecedor
    const aparicoesFornecedor = aparicoesData?.data.filter(
      (a) => a.cnpj_basico === cnpjBasico && 
             a.cnpj_ordem === cnpjOrdem && 
             a.cnpj_dv === cnpjDv
    ) || [];

    // Criar mapa de consulta_id -> nota (para buscar a nota do fornecedor em cada consulta)
    const notasPorConsulta = useMemo(() => {
      const map = new Map<string, number | null>();
      aparicoesFornecedor.forEach((aparicao) => {
        map.set(aparicao.consulta_id, aparicao.nota);
      });
      return map;
    }, [aparicoesFornecedor]);

    // Buscar IDs de consultas relacionadas
    const consultaIds = [...new Set(aparicoesFornecedor.map((a) => a.consulta_id))];
    
    // Filtrar consultas no frontend
    const consultasFiltradas = useMemo(() => {
      if (!consultasData?.data || consultaIds.length === 0) return [];
      return consultasData.data
        .filter((consulta) => consultaIds.includes(consulta.id))
        .sort((a, b) => {
          const dateA = new Date(a.created_at).getTime();
          const dateB = new Date(b.created_at).getTime();
          return dateB - dateA; // Mais recente primeiro
        });
    }, [consultasData, consultaIds]);

    if (isLoadingConsultas) {
      return <div style={{ padding: "16px", textAlign: "center" }}>Carregando consultas...</div>;
    }

    if (!consultasFiltradas || consultasFiltradas.length === 0) {
      return <div style={{ padding: "16px", color: "#999" }}>Nenhuma consulta encontrada</div>;
    }

    // Função para definir cor da tag baseada na nota
    const getNotaColor = (nota: number | null | undefined): string => {
      if (nota === null || nota === undefined) return "default";
      if (nota <= 10) return "red";
      if (nota <= 25) return "orange";
      if (nota <= 50) return "gold";
      if (nota <= 69) return "cyan";
      if (nota <= 90) return "blue";
      return "green";
    };

    return (
      <Table
        dataSource={consultasFiltradas}
        rowKey="id"
        pagination={false}
        size="small"
        scroll={{ x: "max-content" }}
        columns={[
          {
            title: "Nota",
            key: "nota",
            width: 80,
            render: (_, record: Consultas) => {
              const nota = notasPorConsulta.get(record.id);
              if (nota === null || nota === undefined) {
                return <Tag color="default">-</Tag>;
              }
              return <Tag color={getNotaColor(nota)}>{nota}</Tag>;
            },
          },
          {
            title: "Comprador",
            dataIndex: "comprador",
            width: 200,
            render: (compradorId: string) => {
              if (!compradorId) return "-";
              const comprador = compradoresMap.get(compradorId);
              return comprador?.nome || compradorId.substring(0, 8) + "...";
            },
          },
          {
            title: "Empresa",
            dataIndex: "comprador",
            width: 200,
            render: (compradorId: string) => {
              if (!compradorId) return "-";
              const comprador = compradoresMap.get(compradorId);
              return comprador?.empresa_nome || "-";
            },
          },
          {
            title: "Parâmetros",
            dataIndex: "parametros",
            width: 300,
            render: (value) => renderJson(value, 100),
          },
          {
            title: "Data",
            dataIndex: "created_at",
            width: 150,
            render: (value) =>
              value ? new Date(value).toLocaleString("pt-BR") : "-",
          },
          {
            title: "Ações",
            width: 80,
            fixed: "right",
            render: (_, record: Consultas) => (
              <Space>
                <ShowButton
                  hideText
                  size="small"
                  recordItemId={record.id}
                  resource="consultas"
                />
              </Space>
            ),
          },
        ]}
      />
    );
  };

  const isLoading = isLoadingAparicoes || isLoadingFornecedores || isLoadingCompradores || isLoadingConsultas;

  if (isLoading) {
    return <div style={{ padding: "24px", textAlign: "center" }}>Carregando fornecedores...</div>;
  }

  if (!fornecedoresComNomes || fornecedoresComNomes.length === 0) {
    return (
      <div style={{ padding: "24px", textAlign: "center" }}>
        <p>Nenhum fornecedor encontrado</p>
      </div>
    );
  }

  return (
    <Table
      dataSource={fornecedoresComNomes}
      rowKey="cnpjKey"
      loading={isLoading || isLoadingNomes || isLoadingSites}
      expandable={{
        expandedRowKeys,
        onExpandedRowsChange: (keys) => setExpandedRowKeys(Array.from(keys)),
        expandedRowRender: (record) => (
          <ConsultasSubTable 
            cnpjBasico={record.cnpjBasico} 
            cnpjOrdem={record.cnpjOrdem} 
            cnpjDv={record.cnpjDv} 
          />
        ),
        rowExpandable: () => true,
      }}
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        showTotal: (total, range) => `${range[0]}-${range[1]} de ${total} fornecedores`,
      }}
    >
      <Table.Column
        title="Nome Fornecedor"
        dataIndex="nomeFornecedor"
        sorter={(a, b) => (a.nomeFornecedor || "").localeCompare(b.nomeFornecedor || "")}
        render={(value) => value || "-"}
      />
      <Table.Column
        title="CNPJ"
        dataIndex="cnpjFormatado"
        sorter={(a, b) => a.cnpjFormatado.localeCompare(b.cnpjFormatado)}
        render={(value) => <Text code>{value}</Text>}
      />
      <Table.Column
        title="Site"
        dataIndex="siteFornecedor"
        width={200}
        sorter={(a, b) => (a.siteFornecedor || "").localeCompare(b.siteFornecedor || "")}
        render={(value: string) => {
          if (!value || value === "-") return <Text type="secondary">-</Text>;
          // Formatar URL se não tiver protocolo
          const url = value.startsWith("http") ? value : `https://${value}`;
          return (
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ 
                color: "#1890ff",
                textDecoration: "none",
                wordBreak: "break-all"
              }}
            >
              {value}
            </a>
          );
        }}
      />
      <Table.Column
        title="Cadastrado"
        dataIndex="possuiCadastro"
        width={120}
        sorter={(a, b) => (a.possuiCadastro === b.possuiCadastro ? 0 : a.possuiCadastro ? -1 : 1)}
        render={(value: boolean) => (
          <Tag color={value ? "green" : "default"}>
            {value ? "Sim" : "Não"}
          </Tag>
        )}
      />
      <Table.Column
        title="Plano Ativo"
        dataIndex="planoAtivo"
        width={120}
        sorter={(a, b) => (a.planoAtivo === b.planoAtivo ? 0 : a.planoAtivo ? -1 : 1)}
        render={(value: boolean) => (
          <Tag color={value ? "blue" : "default"}>
            {value ? "Sim" : "Não"}
          </Tag>
        )}
      />
      <Table.Column
        title="Total Aparições"
        dataIndex="totalAparicoes"
        sorter={(a, b) => a.totalAparicoes - b.totalAparicoes}
        defaultSortOrder="descend"
      />
      <Table.Column
        title="Nota 0-10"
        dataIndex="score0_10"
        sorter={(a, b) => a.score0_10 - b.score0_10}
        render={(value) => <Tag color="red">{value}</Tag>}
      />
      <Table.Column
        title="Nota 11-25"
        dataIndex="score11_25"
        sorter={(a, b) => a.score11_25 - b.score11_25}
        render={(value) => <Tag color="orange">{value}</Tag>}
      />
      <Table.Column
        title="Nota 26-50"
        dataIndex="score26_50"
        sorter={(a, b) => a.score26_50 - b.score26_50}
        render={(value) => <Tag color="gold">{value}</Tag>}
      />
      <Table.Column
        title="Nota 51-69"
        dataIndex="score51_69"
        sorter={(a, b) => a.score51_69 - b.score51_69}
        render={(value) => <Tag color="cyan">{value}</Tag>}
      />
      <Table.Column
        title="Nota 70-90"
        dataIndex="score70_90"
        sorter={(a, b) => a.score70_90 - b.score70_90}
        render={(value) => <Tag color="blue">{value}</Tag>}
      />
      <Table.Column
        title="Nota 90-100"
        dataIndex="score90_100"
        sorter={(a, b) => a.score90_100 - b.score90_100}
        render={(value) => <Tag color="green">{value}</Tag>}
      />
    </Table>
  );
};

