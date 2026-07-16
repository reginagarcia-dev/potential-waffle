/// <reference types="vite/client" />

// Injected at build time via vite.config.ts's `define`, from the root
// package.json version — the same version tagged on Sentry events on the
// backend and tracked in CHANGELOG.md.
declare const __APP_VERSION__: string;
