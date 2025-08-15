#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Extract routes from App.tsx
const appFile = fs.readFileSync('src/App.tsx', 'utf8');

// Extract all lazy import paths
const lazyImports = [];
const lazyRegex = /lazy\(\(\) => import\(['"]([^'"]+)['"]/g;
let match;
while ((match = lazyRegex.exec(appFile)) !== null) {
  lazyImports.push(match[1]);
}

// Extract routes from FinalUI2
const finalUI2File = fs.readFileSync('src/pages/finalui2/index.tsx', 'utf8');
const finalUI2LazyRegex = /lazy\(\(\) => import\(['"]([^'"]+)['"]/g;
while ((match = finalUI2LazyRegex.exec(finalUI2File)) !== null) {
  lazyImports.push(match[1]);
}

// Check each import path
const missingFiles = [];
const existingFiles = [];

lazyImports.forEach(importPath => {
  // Convert import path to file path
  let filePath = importPath.replace('@/', 'src/');
  
  // Check for .tsx, .ts, .jsx, .js extensions
  const extensions = ['.tsx', '.ts', '.jsx', '.js', '/index.tsx', '/index.ts'];
  let found = false;
  
  for (const ext of extensions) {
    const fullPath = filePath + ext;
    if (fs.existsSync(fullPath)) {
      existingFiles.push({ import: importPath, file: fullPath });
      found = true;
      break;
    }
  }
  
  if (!found) {
    missingFiles.push(importPath);
  }
});

// Extract all route paths from App.tsx
const routePaths = [];
const routeRegex = /path:\s*['"]([^'"]+)['"]/g;
while ((match = routeRegex.exec(appFile)) !== null) {
  routePaths.push(match[1]);
}

// Extract route paths from FinalUI2
while ((match = routeRegex.exec(finalUI2File)) !== null) {
  routePaths.push(match[1]);
}

// Report results
console.log('=== ROUTE CHECKING REPORT ===\n');

console.log(`Total lazy imports found: ${lazyImports.length}`);
console.log(`Existing files: ${existingFiles.length}`);
console.log(`Missing files: ${missingFiles.length}\n`);

if (missingFiles.length > 0) {
  console.log('❌ MISSING FILES:');
  missingFiles.forEach(file => {
    console.log(`  - ${file}`);
  });
  console.log();
}

console.log(`\n📍 Total routes defined: ${routePaths.length}`);
console.log('\n🚀 Sample routes:');
routePaths.slice(0, 20).forEach(route => {
  console.log(`  - ${route}`);
});

// Check for duplicate routes
const duplicates = routePaths.filter((item, index) => routePaths.indexOf(item) !== index);
if (duplicates.length > 0) {
  console.log('\n⚠️  DUPLICATE ROUTES:');
  [...new Set(duplicates)].forEach(route => {
    console.log(`  - ${route}`);
  });
}

// List all available page components
console.log('\n📂 Available page components:');
const pagesDir = 'src/pages';
function listPages(dir, indent = '') {
  const items = fs.readdirSync(dir);
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stats = fs.statSync(fullPath);
    if (stats.isDirectory()) {
      console.log(`${indent}📁 ${item}/`);
      if (item !== '__tests__') {
        listPages(fullPath, indent + '  ');
      }
    } else if (item.endsWith('.tsx') || item.endsWith('.jsx')) {
      console.log(`${indent}📄 ${item}`);
    }
  });
}
listPages(pagesDir, '  ');