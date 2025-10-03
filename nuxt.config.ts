// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ["~/assets/app.css"],
  ssr: false,

  // Enables the development server to be discoverable by other devices when running on iOS physical devices
  devServer: {
    host: '127.0.0.1',
  },

  vite: {
    // Better support for Tauri CLI output
    clearScreen: false,
    // Enable environment variables
    // Additional environment variables can be found at
    // https://v2.tauri.app/reference/environment-variables/
    envPrefix: ['VITE_', 'TAURI_'],
    plugins: [tailwindcss()],
    server: {
      // Tauri requires a consistent port
      strictPort: true,
    },
  },

  // Avoids error [unhandledRejection] EMFILE: too many open files, watch
  ignore: ['**/src-tauri/**'],

  modules: ['@nuxt/icon'],
})