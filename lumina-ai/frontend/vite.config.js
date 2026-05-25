import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/lumina-ai/',
  plugins: [react()],
  server: {
    port: 5173
  }
})
