const fs = require('fs');
const path = require('path');

const walk = (dir, ext) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.next') && !file.includes('dist') && !file.includes('.git')) {
        results = results.concat(walk(file, ext));
      }
    } else {
      if (ext.some(e => file.endsWith(e))) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(__dirname, ['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.env', '.html']);
const regex = /morrowotif/i;

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  if (regex.test(content)) {
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      if (regex.test(line)) {
        console.log(`${file}:${index + 1}: ${line.trim()}`);
      }
    });
  }
});
