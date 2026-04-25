import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Serve static files from 'dist' directory
app.use(express.static(path.join(__dirname, 'dist')));

// Save API
app.post('/api/save', (req, res) => {
  try {
    const data = req.body;
    // In production, we assume the 'public' directory from dev is now where the registry.json lives
    // But since 'dist' is static, we should probably save to a mounted volume or the root public folder
    const filePath = path.resolve(__dirname, 'public/registry.json');
    
    // Ensure directory exists
    if (!fs.existsSync(path.dirname(filePath))) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    res.json({ message: 'Saved successfully' });
  } catch (err) {
    console.error('Save error:', err);
    res.status(500).json({ error: 'Failed to save data' });
  }
});

// Fallback to index.html for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Agent Registry running at http://localhost:${PORT}`);
});
