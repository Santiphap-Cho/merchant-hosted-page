import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";
import path from "path";

const monorepoRoot = path.resolve(__dirname, "../..");

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, monorepoRoot, "");

  const apiPort = env.API_PORT || "3001";
  const webPort = Number(env.WEB_PORT) || 5173;
  const apiUrl =
    process.env.VITE_API_URL ||
    env.VITE_API_URL ||
    (process.env.VERCEL === "1"
      ? "https://merchant-hosted-page-api-zeta.vercel.app"
      : `http://localhost:${apiPort}`);
  const useHttps = env.WEB_HTTPS !== "false";

  return {
    plugins: [react(), ...(useHttps ? [basicSsl()] : [])],
    envDir: monorepoRoot,
    define: {
      "import.meta.env.VITE_API_URL": JSON.stringify(apiUrl),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      https: useHttps,
      port: webPort,
      strictPort: true,
    },
  };
});
