// Makes Vitest's global test API (describe, it, expect, vi, ...) available
// to TypeScript project-wide, matching `globals: true` in vitest.config.ts.
// Uses a reference directive rather than tsconfig "types" so the app's other
// ambient type packages (node, google.accounts) are not excluded.
/// <reference types="vitest/globals" />
