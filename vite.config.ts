import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/",
  define: {
    "process.env": {},
  },
  build: {
    // outDir: "dist",
    outDir: "../bosch-buderus-wp.github.io/assets/metrics",
    emptyOutDir: true,
    minify: "terser",
    lib: {
      entry: "./src/main.tsx",
      formats: ["es"],
      fileName: () => "app.js",
    },
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith(".css")) {
            return "app.css";
          }
          return "[name][extname]";
        },
        manualChunks: undefined,
      },
    },
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
});
