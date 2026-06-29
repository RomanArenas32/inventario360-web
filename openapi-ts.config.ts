import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: 'http://localhost:3001/api/docs-json',
  output: {
    path: 'lib/client',
    postProcess: ['prettier'],
  },
  plugins: [
    '@hey-api/client-fetch',
    '@hey-api/schemas',
    '@hey-api/sdk',
    {
      name: '@hey-api/typescript',
      enums: 'javascript',
    },
  ],
});
