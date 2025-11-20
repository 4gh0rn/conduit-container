import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: Number(process.env.FRONTEND_DEV_PORT || 5173),
    proxy: {
      "/api": {
        target: process.env.FRONTEND_API_URL?.replace('/api', '') || `http://backend:${process.env.BACKEND_PORT || 8000}`,
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: "0.0.0.0",
    port: Number(process.env.FRONTEND_PORT_INTERNAL || process.env.FRONTEND_DEV_PORT || 4173),
    proxy: {
      "/api": {
        target: process.env.FRONTEND_API_URL?.replace('/api', '') || `http://backend:${process.env.BACKEND_PORT || 8000}`,
        changeOrigin: true,
      },
    },
  },
});

