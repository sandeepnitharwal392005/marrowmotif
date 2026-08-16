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

let modifiedCount = 0;
files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  let newContent = content;
  
  if (file.includes('search.js') || file.includes('rename.js')) return;
  
  if (/morrowotif/i.test(newContent)) {
    newContent = newContent.replace(/Morrowotif/g, 'Marrowotif');
    newContent = newContent.replace(/morrowotif/g, 'marrowotif');
    newContent = newContent.replace(/MORROWOTIF/g, 'MARROWOTIF');
    
    if (newContent !== content) {
      fs.writeFileSync(file, newContent, 'utf8');
      modifiedCount++;
      console.log(`Updated ${file}`);
    }
  }
});
console.log(`Replaced branding in ${modifiedCount} files.`);
