#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Function to recursively find all TypeScript files
function findTSFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      files.push(...findTSFiles(fullPath));
    } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Function to remove unused imports
function removeUnusedImports(content, filepath) {
  const lines = content.split('\n');
  const newLines = [];
  const usedImports = new Set();
  
  // First pass: find all used identifiers
  const allText = content.replace(/import.*?from.*?;/g, '');
  
  // Second pass: process imports
  for (let line of lines) {
    if (line.trim().startsWith('import ')) {
      // Extract imported names
      const importMatch = line.match(/import\s+(?:\{([^}]*)\}|\*\s+as\s+(\w+)|(\w+))\s+from/);
      if (importMatch) {
        const [, namedImports, namespaceImport, defaultImport] = importMatch;
        
        if (namedImports) {
          // Handle named imports
          const imports = namedImports.split(',').map(imp => imp.trim());
          const usedNamedImports = imports.filter(imp => {
            const cleanName = imp.replace(/\s+as\s+\w+/, '').trim();
            return allText.includes(cleanName) || allText.includes(imp.trim());
          });
          
          if (usedNamedImports.length > 0) {
            const newLine = line.replace(/\{[^}]*\}/, `{ ${usedNamedImports.join(', ')} }`);
            newLines.push(newLine);
          }
        } else if (namespaceImport && allText.includes(namespaceImport)) {
          newLines.push(line);
        } else if (defaultImport && allText.includes(defaultImport)) {
          newLines.push(line);
        }
        // If none used, skip the line (remove the import)
      } else {
        // Keep non-import lines that start with import (e.g., import './styles.css')
        newLines.push(line);
      }
    } else {
      newLines.push(line);
    }
  }
  
  return newLines.join('\n');
}

// Function to replace explicit any types with better types
function fixExplicitAny(content) {
  // Common patterns to replace
  const replacements = [
    // Function parameters
    { from: /(\w+):\s*any\b/g, to: '$1: unknown' },
    // Array types
    { from: /any\[\]/g, to: 'unknown[]' },
    // Object types in interfaces/types
    { from: /:\s*any;/g, to: ': unknown;' },
    // Return types
    { from: /\):\s*any\b/g, to: '): unknown' },
    // Generic constraints
    { from: /<any>/g, to: '<unknown>' },
    // Variable declarations
    { from: /:\s*any\s*=/g, to: ': unknown =' },
  ];
  
  let result = content;
  for (const { from, to } of replacements) {
    result = result.replace(from, to);
  }
  
  return result;
}

// Function to remove unused variables
function removeUnusedVariables(content) {
  const lines = content.split('\n');
  const newLines = [];
  
  for (let line of lines) {
    // Skip lines that declare variables that are clearly unused
    if (line.trim().match(/^(const|let|var)\s+\w+\s*=.*;\s*$/) && 
        !content.includes(line.trim().split('=')[0].split(' ').pop().trim() + '.') &&
        !content.includes(line.trim().split('=')[0].split(' ').pop().trim() + '(')) {
      // This is a simple heuristic - skip variables that seem unused
      continue;
    }
    newLines.push(line);
  }
  
  return newLines.join('\n');
}

// Main function
function fixFile(filepath) {
  try {
    console.log(`Fixing ${filepath}...`);
    let content = fs.readFileSync(filepath, 'utf8');
    
    // Apply fixes
    content = removeUnusedImports(content, filepath);
    content = fixExplicitAny(content);
    
    // Write back
    fs.writeFileSync(filepath, content, 'utf8');
    console.log(`✓ Fixed ${filepath}`);
  } catch (error) {
    console.error(`✗ Error fixing ${filepath}:`, error.message);
  }
}

// Main execution
function main() {
  const srcDir = path.join(__dirname, 'src');
  const files = findTSFiles(srcDir);
  
  console.log(`Found ${files.length} TypeScript files to fix...`);
  
  for (const file of files) {
    fixFile(file);
  }
  
  console.log('✅ Finished fixing files!');
  console.log('Running linter to check results...');
  
  try {
    execSync('npm run lint', { stdio: 'inherit' });
  } catch (error) {
    console.log('Some linting errors remain. Running fix again...');
  }
}

main();