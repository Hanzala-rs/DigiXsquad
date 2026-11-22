import { defineConfig } from 'orval';

const input = '../contract/openapi.yaml';

export default defineConfig({
  // Typed fetch functions + models
  api: {
    input,
    output: {
      mode: 'split',
      target: 'src/generated/endpoints.ts',
      schemas: 'src/generated/model',
      client: 'fetch',
      clean: true,
      override: {
        mutator: { path: 'src/fetcher.ts', name: 'apiFetch' },
      },
    },
  },
  // Zod schemas for forms (React Hook Form) and MSW mocks
  zod: {
    input,
    output: {
      mode: 'single',
      target: 'src/generated/zod.ts',
      client: 'zod',
    },
  },
});
