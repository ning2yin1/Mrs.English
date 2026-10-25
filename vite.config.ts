import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
function offline(): Plugin {
  return {
    name: "mrs-offline",
    apply: "build",
    closeBundle() {
      const root = "dist";
      const walk = (dir: string): string[] =>
        readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
          e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)],
        );
      const shell = walk(root)
        .map((p) => p.slice(root.length + 1))
        .filter(
          (p) =>
            !p.startsWith("assets/photos/") &&
            !p.startsWith("assets/audio/") &&
            p !== "sw.js",
        );
      const version = createHash("sha256")
        .update(readFileSync("scripts/sw-template.js"))
        .update(
          shell
            .map((p) => p + readFileSync(join(root, p)).toString("base64"))
            .join(""),
        )
        .digest("hex")
        .slice(0, 12);
      const template = readFileSync("scripts/sw-template.js", "utf8")
        .replace("__VERSION__", version)
        .replace("__SHELL__", JSON.stringify(shell));
      writeFileSync("dist/sw.js", template);
    },
  };
}
export default defineConfig({
  base: "/Mrs.English/",
  plugins: [react(), offline()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("/data/")) return "curriculum";
          if (id.includes("node_modules")) return "vendor";
        },
      },
    },
  },
});
