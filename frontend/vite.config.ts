/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { fileURLToPath } from "url";
import { readFileSync } from "fs";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Same monorepo version used in the backend's Sentry release tag and in
// CHANGELOG.md, so a Sentry event on either side can be tied to the exact
// release it came from.
const rootPackageJson = JSON.parse(
  readFileSync(path.resolve(__dirname, "../package.json"), "utf-8"),
);
const appVersion: string = rootPackageJson.version;

// https://vite.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  plugins: [
    react(),
    tailwindcss(),
    // Uploads source maps for readable stack traces in Sentry. Entirely
    // opt-in via SENTRY_AUTH_TOKEN (a build-time secret, distinct from the
    // runtime VITE_SENTRY_DSN) — without it this is skipped and the build
    // is unaffected, same "fails safe" pattern as the DSN check elsewhere.
    ...(process.env.SENTRY_AUTH_TOKEN
      ? [
          sentryVitePlugin({
            org: process.env.SENTRY_ORG,
            project: process.env.SENTRY_PROJECT,
            authToken: process.env.SENTRY_AUTH_TOKEN,
            sourcemaps: { filesToDeleteAfterUpload: ["**/*.js.map"] },
          }),
        ]
      : []),
  ],
  build: {
    // Only needed for the Sentry upload above; deleted after upload via
    // filesToDeleteAfterUpload so they're never actually served in prod.
    sourcemap: Boolean(process.env.SENTRY_AUTH_TOKEN),
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return;
          }
          if (id.includes("recharts")) {
            return "charts";
          }
          if (id.includes("@tanstack/react-query")) {
            return "query";
          }
          if (id.includes("react-router-dom")) {
            return "router";
          }
          if (id.includes("react-dom") || id.includes("/react/")) {
            return "react-vendor";
          }
          if (id.includes("lucide-react")) {
            return "icons";
          }
        }
      }
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },
  test: {
    projects: [{
      extends: true,
      plugins: [
      // The plugin will run tests for the stories defined in your Storybook config
      // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
      storybookTest({
        configDir: path.join(__dirname, '.storybook')
      })],
      test: {
        name: 'storybook',
        browser: {
          enabled: true,
          headless: true,
          provider: playwright({}),
          instances: [{
            browser: 'chromium'
          }]
        }
      }
    }]
  }
});