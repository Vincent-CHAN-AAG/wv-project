import { defineConfig, loadEnv } from "vite";
import path from "path";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname, ".."), "VITE_");
  const backendUrl = env.VITE_BACKEND_URL || "http://localhost:8080";
  const previewBase = env.VITE_PREVIEW_BASE || "/";
  const previewPrefix = previewBase === "/" ? "" : previewBase.replace(/\/$/, "");
  const apiPrefix = `${previewPrefix}/api`;
  const authPrefix = `${previewPrefix}/auth`;
  const previewCredentialsPlugin = {
    name: "web-vibe-preview-credentials",
    transformIndexHtml: {
      order: "post" as const,
      handler(html: string) {
        if (previewBase === "/") return html;
        return html.replace(
          /<script type="module"(?![^>]*\bcrossorigin=)/g,
          '<script type="module" crossorigin="use-credentials"',
        );
      },
    },
  };

  return {
    base: previewBase,
    plugins: [react(), previewCredentialsPlugin],
    server: {
      host: true,
      allowedHosts: ["frontend-app"],
      strictPort: true,
      hmr: {
        overlay: false,
      },
      proxy: {
        [apiPrefix]: {
          target: backendUrl,
          changeOrigin: true,
          rewrite: (requestPath) => requestPath.slice(apiPrefix.length) || "/",
        },
        [authPrefix]: {
          target: backendUrl,
          changeOrigin: true,
          rewrite: (requestPath) => requestPath.slice(previewPrefix.length) || "/",
        },
      },
    },
  };
});
