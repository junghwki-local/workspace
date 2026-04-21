import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": resolve(__dirname, "./src") } },
  server: { host: "0.0.0.0", port: 3002, allowedHosts: true },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
