import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@solana/web3.js': path.resolve(__dirname, 'node_modules/@solana/web3.js/lib/index.browser.esm.js'),
    },
  },
  optimizeDeps: {
    include: [
      '@solana/web3.js',
      '@solana/wallet-adapter-base',
      '@solana/wallet-adapter-react',
      '@coral-xyz/anchor',
    ],
  },
  ssr: {
    noExternal: ['@coral-xyz/anchor'],
  },
})
