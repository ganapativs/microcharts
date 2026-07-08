import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// The docs tests import the chart registry, which uses the app's `@/` alias.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
});
