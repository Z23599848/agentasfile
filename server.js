import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const distDir = path.join(__dirname, 'dist');
const dataDir = path.join(__dirname, 'public');

app.use(express.json({ limit: '1mb' }));

app.get(['/registry.json', '/mcp_servers.json'], (req, res, next) => {
  const filename = path.basename(req.path);
  const writablePath = path.join(dataDir, filename);
  const bundledPath = path.join(distDir, filename);
  const filePath = fs.existsSync(writablePath) ? writablePath : bundledPath;

  if (!fs.existsSync(filePath)) {
    next();
    return;
  }

  res.sendFile(filePath);
});

app.post('/api/save', (req, res) => saveJsonFile(res, 'registry.json', req.body));
app.post('/api/save-mcp', (req, res) => saveJsonFile(res, 'mcp_servers.json', req.body));

app.use(express.static(distDir));

app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Agent Registry running at http://localhost:${PORT}`);
});

function saveJsonFile(res, filename, data) {
  try {
    fs.mkdirSync(dataDir, { recursive: true });
    const filePath = path.join(dataDir, filename);
    const tempPath = `${filePath}.tmp`;

    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2));
    fs.renameSync(tempPath, filePath);
    res.json({ message: 'Saved successfully' });
  } catch (err) {
    console.error(`Save error for ${filename}:`, err);
    res.status(500).json({ error: `Failed to save ${filename}` });
  }
}
