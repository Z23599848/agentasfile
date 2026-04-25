import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';
import pug from 'pug';

export default defineConfig({
  server: {
    port: 3000,
    host: true
  },
  plugins: [
    {
      name: 'pug-compiler',
      handleHotUpdate({ file, server }) {
        if (file.endsWith('.pug')) {
          try {
            const html = pug.renderFile(file, { pretty: true });
            const outPath = path.resolve(path.dirname(file), 'index.html');
            fs.writeFileSync(outPath, html);
            server.ws.send({ type: 'full-reload' });
          } catch (err) {
            console.error('Pug compilation error:', err);
          }
        }
      }
    },
    {
      name: 'save-registry',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/api/save' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => {
              body += chunk.toString();
            });
            req.on('end', () => {
              try {
                const data = JSON.parse(body);
                const filePath = path.resolve(__dirname, 'public/registry.json');
                fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
                res.statusCode = 200;
                res.end(JSON.stringify({ message: 'Saved successfully' }));
              } catch (err) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: 'Failed to save data' }));
              }
            });
          } else {
            next();
          }
        });
      }
    }
  ]
});
