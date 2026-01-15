import { Refine } from "@refinedev/core";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";
import {
  ErrorComponent,
  ThemedLayout,
  ThemedSider,
  ThemedTitle,
  useNotificationProvider,
} from "@refinedev/antd";
import { dataProvider } from "@refinedev/supabase";
import routerProvider, {
  DocumentTitleHandler,
  UnsavedChangesNotifier,
} from "@refinedev/react-router-v6";
import { BrowserRouter, Outlet, Route, Routes } from "react-router-dom";
import { ConfigProvider, App as AntdApp } from "antd";
import { supabaseClient } from "./utils/supabaseClient";
import "@refinedev/antd/dist/reset.css";

// Importar páginas
import { DashboardComprador } from "./pages/dashboard-comprador";
import { DashboardFornecedor } from "./pages/dashboard-fornecedor";
import { CompradoresList } from "./pages/compradores/list";
import { CompradoresShow } from "./pages/compradores/show";
import { FornecedoresList } from "./pages/fornecedores/list";
import { FornecedoresShow } from "./pages/fornecedores/show";
import { ConsultasList } from "./pages/consultas/list";
import { ConsultasShow } from "./pages/consultas/show";
import { AparicoesList } from "./pages/aparicoes/list";
import { AparicoesShow } from "./pages/aparicoes/show";

// Recursos Read-Only (sem create, edit, delete)
const resources = [
  {
    name: "dashboard-comprador",
    list: "/dashboard-comprador",
    meta: {
      label: "Dashboard Comprador",
      icon: "DashboardOutlined",
    },
  },
  {
    name: "usuario_comprador",
    list: "/compradores",
    show: "/compradores/show/:id",
    meta: {
      label: "Compradores",
      parent: "dashboard-comprador",
      canDelete: false,
    },
  },
  {
    name: "consultas",
    list: "/consultas",
    show: "/consultas/show/:id",
    meta: {
      label: "Consultas",
      parent: "dashboard-comprador",
      canDelete: false,
    },
  },
  {
    name: "dashboard-fornecedor",
    list: "/dashboard-fornecedor",
    meta: {
      label: "Dashboard Fornecedor",
      icon: "ShopOutlined",
    },
  },
  {
    name: "usuario_fornecedor",
    list: "/fornecedores",
    show: "/fornecedores/show/:id",
    meta: {
      label: "Fornecedores",
      parent: "dashboard-fornecedor",
      canDelete: false,
    },
  },
  {
    name: "aparicoes",
    list: "/aparicoes",
    show: "/aparicoes/show/:id",
    meta: {
      label: "Aparições",
      parent: "dashboard-fornecedor",
      canDelete: false,
    },
  },
];

// Suprimir warnings do Refine/Ant Design (vêm de componentes internos)
// Executar ANTES do React renderizar para capturar todos os warnings
if (import.meta.env.DEV && typeof window !== 'undefined') {
  const originalWarn = console.warn;
  console.warn = (...args: any[]) => {
    const message = args[0];
    // Suprimir warnings específicos do Refine/Ant Design
    if (
      typeof message === 'string' &&
      (
        (message.includes('useForm') && message.includes('not connected')) ||
        (message.includes('[antd: Menu]') && message.includes('children is deprecated'))
      )
    ) {
      return; // Suprimir apenas estes warnings específicos
    }
    originalWarn.apply(console, args);
  };
}

function App() {
  return (
    <BrowserRouter>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: "#1890ff", // Azul
          },
        }}
      >
        <RefineKbarProvider>
          <AntdApp>
            <Refine
              dataProvider={dataProvider(supabaseClient)}
              routerProvider={routerProvider}
              resources={resources}
              notificationProvider={useNotificationProvider}
              options={{
                syncWithLocation: true,
                warnWhenUnsavedChanges: true,
                useNewQueryKeys: true,
                projectId: "busca-fornecedor-admin",
              }}
            >
              <Routes>
                <Route
                  element={
                    <ThemedLayout
                      Sider={() => (
                        <ThemedSider
                          Title={({ collapsed }) => (
                            <ThemedTitle
                              collapsed={collapsed}
                              text="BuscaFornecedor"
                            />
                          )}
                        />
                      )}
                    >
                      <Outlet />
                    </ThemedLayout>
                  }
                >
                  <Route index element={<DashboardComprador />} />
                  
                  {/* Dashboard Comprador */}
                  <Route path="/dashboard-comprador" element={<DashboardComprador />} />
                  
                  {/* Dashboard Fornecedor */}
                  <Route path="/dashboard-fornecedor" element={<DashboardFornecedor />} />
                  
                  {/* Compradores */}
                  <Route path="/compradores" element={<CompradoresList />} />
                  <Route path="/compradores/show/:id" element={<CompradoresShow />} />
                  
                  {/* Fornecedores */}
                  <Route path="/fornecedores" element={<FornecedoresList />} />
                  <Route path="/fornecedores/show/:id" element={<FornecedoresShow />} />
                  
                  {/* Consultas */}
                  <Route path="/consultas" element={<ConsultasList />} />
                  <Route path="/consultas/show/:id" element={<ConsultasShow />} />
                  
                  {/* Aparições */}
                  <Route path="/aparicoes" element={<AparicoesList />} />
                  <Route path="/aparicoes/show/:id" element={<AparicoesShow />} />
                  
                  <Route path="*" element={<ErrorComponent />} />
                </Route>
              </Routes>
              <RefineKbar />
              <UnsavedChangesNotifier />
              <DocumentTitleHandler />
            </Refine>
          </AntdApp>
        </RefineKbarProvider>
      </ConfigProvider>
    </BrowserRouter>
  );
}

export default App;

