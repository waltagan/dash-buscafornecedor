import { useTable, ShowButton } from "@refinedev/antd";
import { Table, Space, Tag, Card } from "antd";
import { UsuarioFornecedor } from "../../types/database";
import { useState, useEffect, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";

export const FornecedoresList = () => {
  const [nomesFornecedores, setNomesFornecedores] = useState<Map<string, string>>(new Map());
  const [isLoadingNomes, setIsLoadingNomes] = useState(false);

  const { tableProps } = useTable<UsuarioFornecedor>({
    resource: "usuario_fornecedor",
    meta: {
      select: "*",
    },
  });

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

  // Buscar nomes dos fornecedores da tabela cnpj_db.empresas
  useEffect(() => {
    const fetchNomes = async () => {
      if (!tableProps.dataSource || tableProps.dataSource.length === 0) return;

      const todosCnpjs = [...new Set(
        tableProps.dataSource
          .map(f => f.cnpj_basico?.trim())
          .filter((cnpj): cnpj is string => !!cnpj)
      )];

      if (todosCnpjs.length === 0) return;

      // Verificar quais CNPJs ainda não temos nomes
      const cnpjsParaBuscar = todosCnpjs.filter(cnpj => !nomesFornecedores.has(cnpj));
      
      if (cnpjsParaBuscar.length === 0) return; // Já temos todos os nomes

      console.log(`🔍 Buscando nomes para ${cnpjsParaBuscar.length} fornecedores (de ${todosCnpjs.length} totais)...`);
      setIsLoadingNomes(true);

      try {
        const cnpjDbClient = createCnpjDbClient();
        if (!cnpjDbClient) {
          console.error("❌ Não foi possível criar cliente para cnpj_db");
          return;
        }

        // Buscar todos de uma vez (Supabase suporta até 1000 por query, vamos fazer em lotes)
        const batchSize = 1000;
        const newNames = new Map<string, string>();

        for (let i = 0; i < cnpjsParaBuscar.length; i += batchSize) {
          const batch = cnpjsParaBuscar.slice(i, i + batchSize);
          console.log(`  📦 Buscando lote ${Math.floor(i / batchSize) + 1}/${Math.ceil(cnpjsParaBuscar.length / batchSize)} (${batch.length} CNPJs)`);

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
                newNames.set(String(emp.cnpj_basico).trim(), emp.razao_social);
              }
            });
            console.log(`  ✅ ${data.length} nomes encontrados neste lote`);
          }
        }

        console.log(`✅ ${newNames.size} novos nomes carregados`);
        // Adicionar novos nomes ao mapa existente
        setNomesFornecedores(prev => {
          const updated = new Map(prev);
          newNames.forEach((value, key) => updated.set(key, value));
          return updated;
        });
      } catch (err) {
        console.error("❌ Erro ao buscar nomes:", err);
      } finally {
        setIsLoadingNomes(false);
      }
    };

    fetchNomes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableProps.dataSource]);

  // Enriquecer dados com nomes da razão social
  const dataSourceEnriquecido = useMemo(() => {
    if (!tableProps.dataSource) return [];
    
    return tableProps.dataSource.map(fornecedor => ({
      ...fornecedor,
      nomeExibicao: nomesFornecedores.get(fornecedor.cnpj_basico?.trim() || "") || fornecedor.nome || "-",
    }));
  }, [tableProps.dataSource, nomesFornecedores]);

  return (
    <Card title="Fornecedores" style={{ margin: "24px" }}>
      <Table
        {...tableProps}
        dataSource={dataSourceEnriquecido}
        loading={tableProps.loading || isLoadingNomes}
        rowKey="id"
        pagination={{
          ...tableProps.pagination,
          showSizeChanger: true,
          showTotal: (total) => `Total: ${total} fornecedores`,
        }}
      >
        <Table.Column
          title="Nome / Razão Social"
          sorter
          render={(_, record: UsuarioFornecedor & { nomeExibicao?: string }) => {
            return record.nomeExibicao || "-";
          }}
        />
        <Table.Column
          title="CNPJ"
          render={(_, record: UsuarioFornecedor) => {
            const cnpj = record.cnpj || 
              `${record.cnpj_basico}/${record.cnpj_ordem}-${record.cnpj_dv}`;
            return cnpj;
          }}
        />
        <Table.Column
          dataIndex="telefone"
          title="Telefone"
          render={(value) => value || "-"}
        />
        <Table.Column
          dataIndex="plano_categoria"
          title="Plano"
          sorter
          render={(value) => <Tag color="blue">{value}</Tag>}
        />
        <Table.Column
          dataIndex="assinatura_ativa"
          title="Ativo"
          render={(value) => (
            <Tag color={value ? "green" : "red"}>
              {value ? "Sim" : "Não"}
            </Tag>
          )}
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
          render={(_, record: UsuarioFornecedor) => (
            <Space>
              <ShowButton 
                hideText 
                size="small" 
                recordItemId={record.id}
                resource="usuario_fornecedor"
              />
            </Space>
          )}
        />
      </Table>
    </Card>
  );
};

