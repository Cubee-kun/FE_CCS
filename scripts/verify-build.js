import fs from 'fs';
import path from 'path';

const distDir = path.join(process.cwd(), 'dist');

console.log('🔍 Verifying build output...\n');

// Check if dist exists
if (!fs.existsSync(distDir)) {
  console.error('❌ dist directory not found!');
  process.exit(1);
}

// Check for index.html
if (!fs.existsSync(path.join(distDir, 'index.html'))) {
  console.error('❌ index.html not found in dist!');
  process.exit(1);
}

// Check for assets
const assetsDir = path.join(distDir, 'assets');
if (!fs.existsSync(assetsDir)) {
  console.error('❌ assets directory not found!');
  process.exit(1);
}

console.log('✅ index.html found');
console.log('✅ assets directory found');

// List files in dist
const files = fs.readdirSync(distDir);
console.log('\n📦 Build output:');
files.forEach(file => {
  const stats = fs.statSync(path.join(distDir, file));
  console.log(`  - ${file} ${stats.isDirectory() ? '(dir)' : ''}`);
});

console.log('\n✅ Build verification complete!');
