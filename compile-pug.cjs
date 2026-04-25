const pug = require('pug');
const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, 'index.pug');
const outputFile = path.join(__dirname, 'index.html');

try {
  const html = pug.renderFile(inputFile, { pretty: true });
  fs.writeFileSync(outputFile, html);
  console.log('Successfully compiled index.pug to index.html');
} catch (err) {
  console.error('Pug compilation failed:', err);
  process.exit(1);
}
