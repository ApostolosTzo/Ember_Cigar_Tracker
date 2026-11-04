import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

// Relative base keeps the app working from a domain root *and* from a
// sub-path (e.g. a GitHub Pages project site at /repo-name/).
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
})
