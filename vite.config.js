import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Writes dist/.vite/manifest.json. HubDeploy never publishes hidden
  // folders, so https://<subdomain>.eparedes.dev/.vite/manifest.json must answer 404.
  build: { manifest: true },
})
