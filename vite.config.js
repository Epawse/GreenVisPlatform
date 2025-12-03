import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    nodePolyfills({
      // Enable polyfills for Node.js globals and modules
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      protocolImports: true,
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 8080,
    // 关闭 HMR 的文件系统监听，减少性能开销
    hmr: {
      overlay: false, // 关闭错误覆盖层，减少 DOM 操作
    },
    // 预构建优化
    warmup: {
      clientFiles: ["./src/views/Map.vue"],
    },
    proxy: {
      "/geoserver": {
        target: "http://localhost:8080",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/geoserver/, ""),
      },
    },
  },
  // 优化依赖预构建
  optimizeDeps: {
    include: [
      "vue",
      "vue-router",
      "element-plus",
      "ol",
      "ol/layer",
      "ol/source",
      "ol/interaction",
      "d3",
    ],
    // 排除大型资源
    exclude: ["vue-demi"],
  },
  // esbuild 优化
  esbuild: {
    // 开发模式下保持快速构建
    target: "esnext",
    // 移除 console 和 debugger (生产环境)
    drop: process.env.NODE_ENV === "production" ? ["console", "debugger"] : [],
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    // 提高 chunk 大小警告限制
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor chunks for better caching
          openlayers: ["ol"],
          "element-plus": ["element-plus"],
          vue: ["vue", "vue-router", "vuex"],
        },
      },
    },
  },
});
