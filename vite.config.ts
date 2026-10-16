import { defineConfig, loadEnv, type ViteDevServer } from 'vite';
import react from '@vitejs/plugin-react';
import { handleApiRequest } from './server/api.ts';

export default defineConfig(({ mode }) => {
  const apiKey =
    process.env.MASSIVE_API_KEY ?? loadEnv(mode, process.cwd(), '').MASSIVE_API_KEY ?? '';
  const api = (server: Pick<ViteDevServer, 'middlewares'>) => {
    server.middlewares.use('/api', (req, res) => {
      req.url = `/api${req.url ?? ''}`;
      void handleApiRequest(req, res, apiKey);
    });
  };
  return {
    plugins: [react(), { name: 'research-api', configureServer: api, configurePreviewServer: api }],
  };
});
