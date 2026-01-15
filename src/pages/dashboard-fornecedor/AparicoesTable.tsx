import { Table, Space, Tag, Spin } from "antd";
import { useList } from "@refinedev/core";
import { useState, useMemo } from "react";
import { Aparicoes, UsuarioFornecedor, Consultas } from "../../types/database";
import { ShowButton } from "@refinedev/antd";

interface AparicoesAgregadas {
  cnpjKey: string;
  cnpjBasico: string;
  cnpjOrdem: string;
  cnpjDv: string;
  nomeFornecedor: string;
  totalAparicoes: number;
  score0_10: number;
  score10_25: number;
  score25_50: number;
  score50_70: number;
  score70_plus: number;
}

interface AparicoesTableProps {
  aparicoes: Aparicoes[];
  fornecedores: UsuarioFornecedor[];
  isLoading: boolean;
}

export const AparicoesTable = ({ aparicoes, fornecedores, isLoading }: AparicoesTableProps) => {
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);

  // Criar mapa de fornecedores por CNPJ para lookup rápido
  const fornecedoresMap = useMemo(() => {
    const map = new Map<string, UsuarioFornecedor>();
    fornecedores.forEach((fornecedor) => {
      const cnpjKey = `${fornecedor.cnpj_basico}-${fornecedor.cnpj_ordem}-${fornecedor.cnpj_dv}`;
      map.set(cnpjKey, fornecedor);
    });
    return map;
  }, [fornecedores]);

  // Agregar aparições por fornecedor
  const aparicoesAgregadas = useMemo(() => {
    if (!aparicoes || aparicoes.length === 0) return [];

    const agregado = new Map<string, {
      cnpjBasico: string;
      cnpjOrdem: string;
      cnpjDv: string;
      aparicoes: Aparicoes[];
    }>();

    aparicoes.forEach((aparicao) => {
      const cnpjKey = `${aparicao.cnpj_basico}-${aparicao.cnpj_ordem}-${aparicao.cnpj_dv}`;
      
      if (!agregado.has(cnpjKey)) {
        agregado.set(cnpjKey, {
          cnpjBasico: aparicao.cnpj_basico,
          cnpjOrdem: aparicao.cnpj_ordem,
          cnpjDv: aparicao.cnpj_dv,
          aparicoes: [],
        });
      }
      
      agregado.get(cnpjKey)!.aparicoes.push(aparicao);
    });

    // Converter para array e calcular buckets de score
    const resultado: AparicoesAgregadas[] = Array.from(agregado.entries()).map(([cnpjKey, dados]) => {
      const fornecedor = fornecedoresMap.get(cnpjKey);
      const nomeFornecedor = fornecedor?.nome || 
        `${dados.cnpjBasico}/${dados.cnpjOrdem}-${dados.cnpjDv}`;

      // Calcular buckets de score
      let score0_10 = 0;
      let score10_25 = 0;
      let score25_50 = 0;
      let score50_70 = 0;
      let score70_plus = 0;

      dados.aparicoes.forEach((aparicao) => {
        const nota = aparicao.nota ?? 0;
        if (nota >= 0 && nota <= 10) score0_10++;
        else if (nota > 10 && nota <= 25) score10_25++;
        else if (nota > 25 && nota <= 50) score25_50++;
        else if (nota > 50 && nota <= 70) score50_70++;
        else if (nota > 70) score70_plus++;
      });

      return {
        cnpjKey,
        cnpjBasico: dados.cnpjBasico,
        cnpjOrdem: dados.cnpjOrdem,
        cnpjDv: dados.cnpjDv,
        nomeFornecedor,
        totalAparicoes: dados.aparicoes.length,
        score0_10,
        score10_25,
        score25_50,
        score50_70,
        score70_plus,
      };
    });

    // Ordenar por total de aparições (decrescente)
    return resultado.sort((a, b) => b.totalAparicoes - a.totalAparicoes);
  }, [aparicoes, fornecedoresMap]);

  // Função para buscar consultas de um fornecedor (drill-down)
  const ConsultasSubTable = ({ cnpjBasico, cnpjOrdem, cnpjDv }: { 
    cnpjBasico: string; 
    cnpjOrdem: string; 
    cnpjDv: string;
  }) => {
    // Buscar aparições deste fornecedor
    const aparicoesFornecedor = aparicoes.filter(
      (a) => a.cnpj_basico === cnpjBasico && 
             a.cnpj_ordem === cnpjOrdem && 
             a.cnpj_dv === cnpjDv
    );

    // Buscar consultas relacionadas - usar consulta_id diretamente
    const consultaIds = [...new Set(aparicoesFornecedor.map((a) => a.consulta_id))];
    
    // Buscar todas as consultas e filtrar no frontend (mais confiável)
    const { data: allConsultas, isLoading: isLoadingConsultas } = useList<Consultas>({
      resource: "consultas",
      pagination: {
        mode: "off",
      },
      meta: {
        select: "*",
      },
    });

    // Filtrar consultas no frontend
    const consultasFiltradas = useMemo(() => {
      if (!allConsultas?.data || consultaIds.length === 0) return [];
      return allConsultas.data
        .filter((consulta) => consultaIds.includes(consulta.id))
        .sort((a, b) => {
          const dateA = new Date(a.created_at).getTime();
          const dateB = new Date(b.created_at).getTime();
          return dateB - dateA; // Mais recente primeiro
        });
    }, [allConsultas, consultaIds]);

    if (isLoadingConsultas) {
      return <div style={{ padding: "16px", textAlign: "center" }}><Spin /> Carregando...</div>;
    }

    if (!consultasFiltradas || consultasFiltradas.length === 0) {
      return <div style={{ padding: "16px", color: "#999" }}>Nenhuma consulta encontrada</div>;
    }

    return (
      <Table
        dataSource={consultasFiltradas}
        rowKey="id"
        pagination={false}
        size="small"
        columns={[
          {
            title: "ID",
            dataIndex: "id",
            render: (value) => <span style={{ fontFamily: "monospace", fontSize: "12px" }}>{value.substring(0, 8)}...</span>,
          },
          {
            title: "Comprador ID",
            dataIndex: "comprador",
            render: (value) => value ? <span style={{ fontFamily: "monospace", fontSize: "12px" }}>{value.substring(0, 8)}...</span> : "-",
          },
          {
            title: "Status",
            dataIndex: "status",
            render: (value) => (
              <Tag color={value === "concluida" ? "green" : "orange"}>
                {value || "Pendente"}
              </Tag>
            ),
          },
          {
            title: "Data",
            dataIndex: "created_at",
            render: (value) =>
              value ? new Date(value).toLocaleString("pt-BR") : "-",
          },
          {
            title: "Ações",
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

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Table
      dataSource={aparicoesAgregadas}
      rowKey="cnpjKey"
      loading={isLoading}
      expandable={{
        expandedRowKeys,
        onExpandedRowsChange: setExpandedRowKeys,
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
        dataIndex="nomeFornecedor"
        title="Nome do Fornecedor"
        sorter={(a: AparicoesAgregadas, b: AparicoesAgregadas) => 
          a.nomeFornecedor.localeCompare(b.nomeFornecedor)
        }
        render={(value, record: AparicoesAgregadas) => (
          <div>
            <div style={{ fontWeight: 500 }}>{value}</div>
            <div style={{ fontSize: "12px", color: "#999" }}>
              {record.cnpjBasico}/{record.cnpjOrdem}-{record.cnpjDv}
            </div>
          </div>
        )}
      />
      <Table.Column
        dataIndex="totalAparicoes"
        title="Total Aparições"
        sorter={(a: AparicoesAgregadas, b: AparicoesAgregadas) => 
          a.totalAparicoes - b.totalAparicoes
        }
        defaultSortOrder="descend"
        render={(value) => <Tag color="blue">{value}</Tag>}
      />
      <Table.Column
        title="Score 0-10"
        dataIndex="score0_10"
        sorter={(a: AparicoesAgregadas, b: AparicoesAgregadas) => 
          a.score0_10 - b.score0_10
        }
        render={(value) => value > 0 ? <Tag color="red">{value}</Tag> : "-"}
      />
      <Table.Column
        title="Score 10-25"
        dataIndex="score10_25"
        sorter={(a: AparicoesAgregadas, b: AparicoesAgregadas) => 
          a.score10_25 - b.score10_25
        }
        render={(value) => value > 0 ? <Tag color="orange">{value}</Tag> : "-"}
      />
      <Table.Column
        title="Score 25-50"
        dataIndex="score25_50"
        sorter={(a: AparicoesAgregadas, b: AparicoesAgregadas) => 
          a.score25_50 - b.score25_50
        }
        render={(value) => value > 0 ? <Tag color="gold">{value}</Tag> : "-"}
      />
      <Table.Column
        title="Score 50-70"
        dataIndex="score50_70"
        sorter={(a: AparicoesAgregadas, b: AparicoesAgregadas) => 
          a.score50_70 - b.score50_70
        }
        render={(value) => value > 0 ? <Tag color="cyan">{value}</Tag> : "-"}
      />
      <Table.Column
        title="Score 70+"
        dataIndex="score70_plus"
        sorter={(a: AparicoesAgregadas, b: AparicoesAgregadas) => 
          a.score70_plus - b.score70_plus
        }
        render={(value) => value > 0 ? <Tag color="green">{value}</Tag> : "-"}
      />
    </Table>
  );
};

