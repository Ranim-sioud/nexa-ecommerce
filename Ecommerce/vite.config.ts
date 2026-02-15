import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";
import viteCompression from "vite-plugin-compression";

export default defineConfig({
  plugins: [
    react({
      // ✅ Optimise React pour la production
    }),
    
    visualizer({
      filename: "bundle-report.html",
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),

    viteCompression({
      algorithm: "gzip",
      ext: ".gz",
      threshold: 1024, // Seulement compresser > 1KB
    }),

    viteCompression({
      algorithm: "brotliCompress",
      ext: ".br",
      threshold: 1024,
    }),
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  build: {
    target: "es2020",
    outDir: "build",
    sourcemap: false,
    minify: "esbuild", // ✅ Utilise esbuild au lieu de terser
    cssMinify: true,

    chunkSizeWarningLimit: 1000,
    
    rollupOptions: {
      output: {
        manualChunks(id) {
         if (id.includes("node_modules")) {
       
           // Charts (très lourd → OK à isoler)
           if (id.includes("recharts")) {
             return "vendor-recharts";
           }
       
           // UI Radix / Chakra
            if (id.includes("@radix-ui") || id.includes("@chakra-ui")) {
              return "vendor-ui";
            }
        
            // Forms
            if (id.includes("react-hook-form") || id.includes("zod")) {
              return "vendor-forms";
            }
        
            // Icons
            if (id.includes("lucide-react") || id.includes("react-icons")) {
              return "vendor-icons";
            }
        
            // 🚨 TOUT LE RESTE (y compris React)
            return "vendor";
          }
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },    
  },

  server: {
    port: 3000,
    open: true,
  },
});