import { useTable, ShowButton } from "@refinedev/antd";
import { Table, Space, Tag, Typography, Tooltip } from "antd";
import { UsuarioComprador, Consultas } from "../../types/database";
import { useList } from "@refinedev/core";
import { useState, useMemo } from "react";

const { Text } = Typography;

export const CompradoresTable = () => {
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);
  const [sortField, setSortField] = useState<string | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | undefined>(undefined);
  // Estado local para paginação quando há ordenação por estatísticas
  const [localPagination, setLocalPagination] = useState<{ current: number; pageSize: number }>({
    current: 1,
    pageSize: 10,
  });

  // Buscar todos os compradores quando necessário para ordenação completa
  const { data: todosCompradores } = useList<UsuarioComprador>({
    resource: "usuario_comprador",
    pagination: {
      mode: "off",
    },
    meta: {
      select: "*",
    },
  });

  // Buscar compradores paginados para uso normal
  const { tableProps } = useTable<UsuarioComprador>({
    resource: "usuario_comprador",
    meta: {
      select: "*",
    },
  });

  // Buscar todas as consultas para calcular estatísticas
  const { data: todasConsultas } = useList<Consultas>({
    resource: "consultas",
    pagination: {
      mode: "off",
    },
    meta: {
      select: "*",
    },
  });

  // Calcular estatísticas de consultas por comprador
  const estatisticasConsultas = useMemo(() => {
    if (!todasConsultas?.data) return new Map<string, { total: number; ultimos30Dias: number }>();

    const stats = new Map<string, { total: number; ultimos30Dias: number }>();
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - 30);

    todasConsultas.data.forEach((consulta) => {
      if (!consulta.comprador) return;

      const compradorId = consulta.comprador;
      
      // Inicializar se não existir
      if (!stats.has(compradorId)) {
        stats.set(compradorId, { total: 0, ultimos30Dias: 0 });
      }

      const estatistica = stats.get(compradorId)!;
      estatistica.total++;

      // Verificar se está nos últimos 30 dias
      if (consulta.created_at) {
        const dataConsulta = new Date(consulta.created_at);
        if (dataConsulta >= dataLimite) {
          estatistica.ultimos30Dias++;
        }
      }
    });

    return stats;
  }, [todasConsultas]);

  // Debug: Log detalhado
  console.log("🔍 Debug tabela compradores:", {
    isLoading: tableProps.loading,
    dataSource: tableProps.dataSource?.length || 0,
    pagination: tableProps.pagination,
    firstRecord: tableProps.dataSource?.[0],
  });

  // Função para buscar consultas de um comprador
  const ConsultasSubTable = ({ compradorId }: { compradorId: string }) => {
    const { data, isLoading } = useList<Consultas>({
      resource: "consultas",
      filters: [
        {
          field: "comprador",
          operator: "eq",
          value: compradorId,
        },
      ],
      meta: {
        select: "*",
      },
      sorters: [
        {
          field: "created_at",
          order: "desc",
        },
      ],
      pagination: {
        pageSize: 10,
      },
    });

    if (isLoading) {
      return <div style={{ padding: "16px", textAlign: "center" }}>Carregando...</div>;
    }

    if (!data?.data || data.data.length === 0) {
      return <div style={{ padding: "16px", color: "#999" }}>Nenhuma consulta encontrada</div>;
    }

    // Função para formatar JSON para exibição
    const formatJson = (value: unknown): string => {
      if (value === null || value === undefined) return "-";
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return String(value);
      }
    };

    // Função para renderizar JSON (com preview truncado)
    const renderJson = (value: unknown, maxLength: number = 100) => {
      if (value === null || value === undefined) return <Text type="secondary">-</Text>;
      
      const jsonString = formatJson(value);
      const isLong = jsonString.length > maxLength;
      const preview = isLong ? jsonString.substring(0, maxLength) + "..." : jsonString;
      
      return (
        <Tooltip 
          title={
            <pre style={{ 
              maxWidth: "500px", 
              maxHeight: "400px", 
              overflow: "auto",
              margin: 0,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word"
            }}>
              {jsonString}
            </pre>
          }
          overlayStyle={{ maxWidth: "600px" }}
        >
          <Text 
            code 
            style={{ 
              fontSize: "11px",
              display: "block",
              maxWidth: "300px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap"
            }}
          >
            {preview}
          </Text>
        </Tooltip>
      );
    };

    return (
      <Table
        dataSource={data.data}
        rowKey="id"
        pagination={false}
        size="small"
        scroll={{ x: "max-content" }}
        columns={[
          {
            title: "ID",
            dataIndex: "id",
            width: 100,
            render: (value) => <span style={{ fontFamily: "monospace", fontSize: "12px" }}>{value.substring(0, 8)}...</span>,
          },
          {
            title: "Status",
            dataIndex: "status",
            width: 100,
            render: (value) => (
              <Tag color={value === "concluida" ? "green" : "orange"}>
                {value || "Pendente"}
              </Tag>
            ),
          },
          {
            title: "Data",
            dataIndex: "created_at",
            width: 150,
            render: (value) =>
              value ? new Date(value).toLocaleString("pt-BR") : "-",
          },
          {
            title: "Parâmetros",
            dataIndex: "parametros",
            width: 200,
            render: (value) => renderJson(value, 80),
          },
          {
            title: "Resultados",
            dataIndex: "resultados",
            width: 200,
            render: (value) => renderJson(value, 80),
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

  // Determinar se deve usar todos os compradores (para ordenação por estatísticas)
  const ordenandoPorEstatisticas = sortField === "totalConsultas" || sortField === "consultas30Dias";
  const compradoresParaOrdenar = ordenandoPorEstatisticas && todosCompradores?.data 
    ? todosCompradores.data 
    : tableProps.dataSource || [];

  // Ordenar todos os compradores quando ordenando por estatísticas
  const compradoresOrdenados = useMemo(() => {
    if (!ordenandoPorEstatisticas || !sortField || !sortOrder) {
      return compradoresParaOrdenar;
    }

    const compradores = [...compradoresParaOrdenar];
    
    compradores.sort((a, b) => {
      const statsA = estatisticasConsultas.get(a.id) || { total: 0, ultimos30Dias: 0 };
      const statsB = estatisticasConsultas.get(b.id) || { total: 0, ultimos30Dias: 0 };
      
      let valueA: number;
      let valueB: number;
      
      if (sortField === "totalConsultas") {
        valueA = statsA.total;
        valueB = statsB.total;
      } else {
        valueA = statsA.ultimos30Dias;
        valueB = statsB.ultimos30Dias;
      }
      
      if (sortOrder === "asc") {
        return valueA - valueB;
      } else {
        return valueB - valueA;
      }
    });

    return compradores;
  }, [compradoresParaOrdenar, ordenandoPorEstatisticas, sortField, sortOrder, estatisticasConsultas]);

  // Aplicar paginação manual quando ordenando por estatísticas
  const dataSourceFinal = useMemo(() => {
    if (!ordenandoPorEstatisticas) {
      return tableProps.dataSource || [];
    }

    // Usar paginação local quando há ordenação por estatísticas
    const current = localPagination.current;
    const pageSize = localPagination.pageSize;
    const start = (current - 1) * pageSize;
    const end = start + pageSize;

    return compradoresOrdenados.slice(start, end);
  }, [ordenandoPorEstatisticas, compradoresOrdenados, localPagination, tableProps.dataSource]);

  // Garantir que os dados estão no formato correto
  const dataSource = dataSourceFinal;
  
  console.log("📊 Dados da tabela:", {
    dataSourceLength: dataSource.length,
    firstRecord: dataSource[0],
    ordenandoPorEstatisticas,
    sortField,
    sortOrder,
    totalCompradores: compradoresOrdenados.length,
  });

  // Se não houver dados, mostrar mensagem
  if (!tableProps.loading && (!dataSource || dataSource.length === 0)) {
    return (
      <div style={{ padding: "24px", textAlign: "center" }}>
        <p>Nenhum comprador encontrado</p>
      </div>
    );
  }

  // Handler para mudanças na tabela (incluindo ordenação)
  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    // Debug: Log do sorter recebido
    if (sorter) {
      console.log("🔍 Sorter recebido:", {
        field: sorter.field,
        order: sorter.order,
        columnKey: sorter.columnKey,
      });
    }

    // Verificar se é ordenação por colunas calculadas (que não existem no banco)
    const isOrdenacaoEstatisticas = sorter && 
      (sorter.field === "totalConsultas" || 
       sorter.field === "consultas30Dias" ||
       sorter.columnKey === "_calc_totalConsultas" ||
       sorter.columnKey === "_calc_consultas30Dias" ||
       sorter.columnKey === "totalConsultas" ||
       sorter.columnKey === "consultas30Dias");
    
    // Verificar se já estamos ordenando por estatísticas e apenas mudando página
    const isMudancaPaginaComOrdenacao = ordenandoPorEstatisticas && pagination && !isOrdenacaoEstatisticas;
    
    if (isOrdenacaoEstatisticas) {
      console.log("✅ Ordenação por estatísticas detectada - bloqueando query do servidor");
      // Atualizar estado de ordenação para colunas de estatísticas
      // Mapear o key de volta para o nome da coluna
      const field = sorter.columnKey === "_calc_totalConsultas" ? "totalConsultas"
        : sorter.columnKey === "_calc_consultas30Dias" ? "consultas30Dias"
        : sorter.field || sorter.columnKey;
      setSortField(field);
      setSortOrder(
        sorter.order === "ascend" ? "asc" 
        : sorter.order === "descend" ? "desc" 
        : undefined
      );
      // Resetar para página 1 quando ordenar (nova ordenação)
      setLocalPagination({
        current: 1,
        pageSize: pagination?.pageSize || localPagination.pageSize || 10,
      });
      // CRÍTICO: NÃO chamar tableProps.onChange quando ordenando por estatísticas
      // Isso evita que o Refine tente fazer query SQL com coluna inexistente
      // A ordenação será feita localmente através do useMemo
      return; // Não continuar - não chamar tableProps.onChange
    } else if (isMudancaPaginaComOrdenacao) {
      // Se já estamos ordenando por estatísticas e apenas mudando página, atualizar paginação local
      console.log("📄 Mudança de página com ordenação por estatísticas ativa", {
        current: pagination?.current,
        pageSize: pagination?.pageSize,
      });
      setLocalPagination({
        current: pagination?.current || 1,
        pageSize: pagination?.pageSize || localPagination.pageSize || 10,
      });
      // Não chamar tableProps.onChange para evitar query SQL
      return;
    } else {
      // Se não está ordenando por estatísticas, limpar estado e resetar paginação local
      setSortField(undefined);
      setSortOrder(undefined);
      setLocalPagination({ current: 1, pageSize: 10 });
    }

    // Chamar handler original do Refine para outras colunas e paginação
    if (tableProps.onChange) {
      tableProps.onChange(pagination, filters, sorter, { 
        currentDataSource: [],
        action: "paginate" as const
      });
    }
  };

  return (
    <Table
        dataSource={dataSource}
        loading={tableProps.loading || (ordenandoPorEstatisticas && !todosCompradores)}
        rowKey={(record) => record.id}
        expandable={{
          expandedRowKeys,
          onExpandedRowsChange: (keys) => setExpandedRowKeys(Array.from(keys)),
          expandedRowRender: (record) => (
            <ConsultasSubTable compradorId={record.id} />
          ),
          rowExpandable: () => true,
        }}
        pagination={(() => {
          const tablePagination = tableProps.pagination && typeof tableProps.pagination !== 'boolean' ? tableProps.pagination : null;
          
          if (ordenandoPorEstatisticas) {
            // Quando há ordenação por estatísticas, usar paginação local
            return {
              current: localPagination.current,
              pageSize: localPagination.pageSize,
              total: todosCompradores?.total || compradoresOrdenados.length,
              showSizeChanger: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} de ${total} compradores`,
              onChange: (page: number, pageSize?: number) => {
                console.log("📄 onChange pagination local:", { page, pageSize });
                setLocalPagination({
                  current: page,
                  pageSize: pageSize || localPagination.pageSize,
                });
              },
              onShowSizeChange: (current: number, size: number) => {
                console.log("📄 onShowSizeChange pagination local:", { current, size });
                setLocalPagination({
                  current: 1, // Resetar para primeira página ao mudar tamanho
                  pageSize: size,
                });
              },
            };
          }
          
          // Quando não há ordenação por estatísticas, usar paginação do Refine
          return {
            current: tablePagination?.current || 1,
            pageSize: tablePagination?.pageSize || 10,
            total: tablePagination?.total || 0,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} de ${total} compradores`,
            onChange: tablePagination?.onChange,
            onShowSizeChange: tablePagination?.onShowSizeChange,
          };
        })()}
        onChange={handleTableChange}
      >
        <Table.Column
          dataIndex="nome"
          title="Nome"
          sorter
          render={(value) => value || "-"}
        />
        <Table.Column
          dataIndex="empresa_nome"
          title="Empresa"
          sorter
          render={(value) => value || "-"}
        />
        <Table.Column
          dataIndex="telefone"
          title="Telefone"
          render={(value) => value || "-"}
        />
        <Table.Column
          dataIndex="tier_busca"
          title="Tier"
          sorter
          render={(value) => <Tag color="blue">{value}</Tag>}
        />
        <Table.Column
          title="Total Consultas"
          key="_calc_totalConsultas"
          sorter={{
            compare: (a: UsuarioComprador, b: UsuarioComprador) => {
              const statsA = estatisticasConsultas.get(a.id) || { total: 0, ultimos30Dias: 0 };
              const statsB = estatisticasConsultas.get(b.id) || { total: 0, ultimos30Dias: 0 };
              return statsA.total - statsB.total;
            },
            multiple: 1,
          }}
          render={(_, record: UsuarioComprador) => {
            const stats = estatisticasConsultas.get(record.id) || { total: 0, ultimos30Dias: 0 };
            return <Tag color="blue">{stats.total}</Tag>;
          }}
        />
        <Table.Column
          title="Consultas (30 dias)"
          key="_calc_consultas30Dias"
          sorter={{
            compare: (a: UsuarioComprador, b: UsuarioComprador) => {
              const statsA = estatisticasConsultas.get(a.id) || { total: 0, ultimos30Dias: 0 };
              const statsB = estatisticasConsultas.get(b.id) || { total: 0, ultimos30Dias: 0 };
              return statsA.ultimos30Dias - statsB.ultimos30Dias;
            },
            multiple: 2,
          }}
          render={(_, record: UsuarioComprador) => {
            const stats = estatisticasConsultas.get(record.id) || { total: 0, ultimos30Dias: 0 };
            return <Tag color={stats.ultimos30Dias > 0 ? "green" : "default"}>{stats.ultimos30Dias}</Tag>;
          }}
        />
        <Table.Column
          dataIndex="created_at"
          title="Data de Cadastro"
          sorter
          render={(value) =>
            value ? new Date(value).toLocaleDateString("pt-BR") : "-"
          }
        />
        <Table.Column
          title="Ações"
          render={(_, record: UsuarioComprador) => (
            <Space>
              <ShowButton 
                hideText 
                size="small" 
                recordItemId={record.id}
                resource="usuario_comprador"
              />
            </Space>
          )}
        />
    </Table>
  );
};

