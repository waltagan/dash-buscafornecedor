import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
  preview: {
    host: "0.0.0.0",
    port: parseInt(process.env.PORT || "5173"),
    allowedHosts: [
      "dash-buscafornecedor-buscafornecedor.up.railway.app",
      ".railway.app",
      ".up.railway.app",
    ],
  },
});

