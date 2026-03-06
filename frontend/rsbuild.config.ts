import path from "node:path";
import { defineConfig, loadEnv } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";

const host = process.env.TAURI_DEV_HOST;
const { publicVars } = loadEnv({ prefixes: ["PUBLIC_"] });

export default defineConfig({
  plugins: [pluginReact()],
  html: {
    template: "./index.html",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  source: {
    entry: {
      index: "./src/main.tsx",
    },
    define: publicVars,
  },
  output: {
    distPath: {
      root: "dist",
    },
  },
  server: {
    host: host || "0.0.0.0",
    port: 1420,
    strictPort: true,
  },
});
