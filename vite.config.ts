import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';
import pug from 'pug';
import { fileURLToPath } from 'url';
import type { IncomingMessage, ServerResponse } from 'http';

const rootDir = fileURLToPath(new URL('.', import.meta.url));
const publicDir = path.resolve(rootDir, 'public');

export default defineConfig({
  server: {
    port: 3000,
    host: true
  },
  plugins: [
    {
      name: 'pug-compiler',
      handleHotUpdate({ file, server }) {
        if (!file.endsWith('.pug')) return;

        try {
          const html = pug.renderFile(file, { pretty: true });
          const outPath = path.resolve(path.dirname(file), 'index.html');
          fs.writeFileSync(outPath, html);
          server.ws.send({ type: 'full-reload' });
        } catch (err) {
          console.error('Pug compilation error:', err);
        }
      }
    },
    {
      name: 'save-registry',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/api/save' && req.method === 'POST') {
            saveJsonRequest(req, res, 'registry.json');
            return;
          }

          if (req.url === '/api/save-mcp' && req.method === 'POST') {
            saveJsonRequest(req, res, 'mcp_servers.json');
            return;
          }

          next();
        });
      }
    }
  ]
});

function saveJsonRequest(req: IncomingMessage, res: ServerResponse, filename: string) {
  let body = '';

  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', () => {
    try {
      const data = JSON.parse(body);
      fs.mkdirSync(publicDir, { recursive: true });
      const filePath = path.resolve(publicDir, filename);
      const tempPath = `${filePath}.tmp`;

      fs.writeFileSync(tempPath, JSON.stringify(data, null, 2));
      fs.renameSync(tempPath, filePath);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ message: 'Saved successfully' }));
    } catch (err) {
      console.error(`Failed to save ${filename}:`, err);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: `Failed to save ${filename}` }));
    }
  });
}
