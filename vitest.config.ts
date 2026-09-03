import { defineConfig } from 'vitest/config'

export default defineConfig({
  // The root tsconfig extends the generated `.nuxt/tsconfig.json`, which only
  // exists after `nuxi prepare`. Passing a raw tsconfig string makes esbuild skip
  // tsconfig discovery so the suite runs on a fresh clone.
  esbuild: {
    tsconfigRaw: JSON.stringify({
      compilerOptions: { target: 'esnext', useDefineForClassFields: true },
    }),
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    testTimeout: 20_000,
  },
})
