import { defineConfig } from "vitest/config";
import path from "path";

// Unit tests target the pure calculation libraries (no DOM needed), so we run
// in the lightweight `node` environment. Test files live next to the code they
// cover under client/src/lib/__tests__.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./client/src"),
    },
  },
  test: {
    environment: "node",
    include: ["client/src/**/*.test.ts"],
  },
});
