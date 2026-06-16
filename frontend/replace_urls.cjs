const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if(file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./src');
let count = 0;
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('http://127.0.0.1:8000')) {
    // Special case for the google redirect
    content = content.replace(
      'href="http://127.0.0.1:8000/api/auth/google/redirect"',
      'href={`${import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api"}/auth/google/redirect`}'
    );
    
    // General case
    content = content.replace(
      /http:\/\/127\.0\.0\.1:8000/g,
      "${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'}"
    );
    
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated', file);
    count++;
  }
}
console.log('Total files updated:', count);
