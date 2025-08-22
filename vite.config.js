import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// IMPORTANT: Set base to repo name for GitHub Pages under a project site
export default defineConfig({
  base: '/Dynamic-Tintz-All-In-One/',
  plugins: [react()],
  server: { port: 5173, host: true },
})
