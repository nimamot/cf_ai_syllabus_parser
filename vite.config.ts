import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";

const resolvePath = (relative: string) =>
	path.resolve(fileURLToPath(new URL(".", import.meta.url)), relative);

export default defineConfig({
	plugins: [react(), cloudflare()],
	resolve: {
		alias: {
			canvas: resolvePath("src/worker/shims/canvas.ts"),
		},
	},
});
