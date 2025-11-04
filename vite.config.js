import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Optimize build output
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "ui-vendor": ["framer-motion", "react-icons"],
          "chart-vendor": ["chart.js", "react-chartjs-2"],
          "map-vendor": ["leaflet", "react-leaflet"],
        },
      },
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Enable source maps for debugging (optional)
    sourcemap: false,
  },
  // Preview server config
  preview: {
    port: 4173,
    host: true,
  },
  // Dev server config
  server: {
    port: 5173,
    host: true,
    open: true,
  },
});
