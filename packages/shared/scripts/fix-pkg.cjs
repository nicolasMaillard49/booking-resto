// Génère les package.json "type" pour chaque dist/ afin que Node reconnaisse
// correctement le format CJS/ESM.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'dist');

fs.writeFileSync(
  path.join(root, 'cjs', 'package.json'),
  JSON.stringify({ type: 'commonjs' }) + '\n',
);

fs.writeFileSync(
  path.join(root, 'esm', 'package.json'),
  JSON.stringify({ type: 'module' }) + '\n',
);

console.log('dist type marker files written');
