const fs = require('fs');
const path = require('path');

const rnRoot = path.join(__dirname, '..', 'node_modules', 'react-native');

function processDir(dir) {
  if (dir.includes('node_modules') && !dir.endsWith('react-native') && !dir.includes('react-native' + path.sep)) {
    return;
  }
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      processDir(fullPath);
    } else if (entry.isFile() && (fullPath.endsWith('.js') || fullPath.endsWith('.flow'))) {
      let code = fs.readFileSync(fullPath, 'utf8');
      let modified = false;

      if (code.includes('as const')) {
        code = code.replace(/\s+as\s+const\b/g, '');
        modified = true;
      }
      if (code.includes('component(')) {
        code = code.replace(/type\s+[A-Za-z0-9_]+\s*=\s*component\([\s\S]*?\);/g, '');
        code = code.replace(/:\s*component\([\s\S]*?\)\s*=/g, ' =');
        code = code.replace(/:\s*component\([\s\S]*?\)/g, '');
        code = code.replace(/\)\s*as\s*component\([\s\S]*?\)/g, ')');
        code = code.replace(/\}\s*as\s*component\([\s\S]*?\)/g, '}');
        code = code.replace(/\bexport\s+default\s+([A-Za-z0-9_()]+)\s+as\s+component\([\s\S]*?\)/g, 'export default $1');
        modified = true;
      }
      if (code.includes(' as ')) {
        // Strip Flow type assertions like: ) as typeof ReactNativeElement; or as InternalInstanceHandle;
        code = code.replace(/\)\s+as\s+typeof\s+[A-Za-z0-9_]+;/g, ');');
        code = code.replace(/\s+as\s+InternalInstanceHandle;/g, ';');
        modified = true;
      }

      if (modified) {
        console.log('Cleaned Flow syntax in:', fullPath);
        fs.writeFileSync(fullPath, code, 'utf8');
      }
    }
  }
}

processDir(rnRoot);
console.log('Done stripping Flow type annotations from all React Native source files!');
