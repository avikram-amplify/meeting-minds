import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // process.env carries Docker Compose injected vars; loadEnv reads .env files.
  // Merge with process.env taking priority so runtime config wins over file config.
  const merged = { ...env, ...process.env };
  const backendTarget = merged.FRONTEND_PROXY_TARGET || "http://backend:8000";
  const publicApiBaseUrl = merged.FRONTEND_API_BASE_URL || "/api/v1";
  const publicWsBaseUrl = merged.FRONTEND_WS_BASE_URL || "/ws/v1/chat";

  return {
    plugins: [react()],
    test: {
      environment: "node",
      globals: false,
      include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    },
    server: {
      host: "::",
      port: Number(merged.FRONTEND_PORT || 3000),
      allowedHosts: "all",
      hmr: {
        host: "127.0.0.1",
        port: Number(merged.FRONTEND_PORT || 3000),
      },
      proxy: {
        "/api": {
          target: backendTarget,
          changeOrigin: true,
        },
        "/ws": {
          target: backendTarget,
          changeOrigin: true,
          ws: true,
        },
      },
    },
    define: {
      __API_BASE_URL__: JSON.stringify(publicApiBaseUrl),
      __WS_BASE_URL__: JSON.stringify(publicWsBaseUrl),
    },
  };
});
