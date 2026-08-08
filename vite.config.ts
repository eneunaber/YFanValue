import { crx } from "@crxjs/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import manifest from "./src/manifest.ts";

export default defineConfig({
  plugins: [tailwindcss(), crx({ manifest })]
});
