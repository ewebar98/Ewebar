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
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(path.join(__dirname, 'src'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Change useApi implementation
  if (file.endsWith('useApi.ts')) {
    content = content.replace(/export function useApi<T>\(fn: \(\) => Promise<T>, deps: unknown\[\] = \[\]\) {/, 'export function useApi<T>(key: string, fn: () => Promise<T>, deps: unknown[] = []) {');
    content = content.replace(/const fnKey = fn\.toString\(\)\.replace\(\/\\s\+\/g, ""\);\n\s*const queryKey = \[fnKey, \.\.\.deps\];/, 'const queryKey = [key, ...deps];');
    changed = true;
  } else {
    // Regex to match useApi(fn, ...) or useApi(() => fn, ...)
    const regex = /useApi\(\s*(\(\)\s*=>\s*)?([a-zA-Z0-9_]+)(\([^)]*\))?\s*(,.*)?\)/g;
    
    content = content.replace(regex, (match, arrow, fnName, fnCallArgs, restArgs) => {
      // If it's an inline function like useApi(() => getCourseById(id), [id])
      // arrow: "() => "
      // fnName: "getCourseById"
      // restArgs: ", [id]"
      
      let keyString = `"${fnName}"`;
      if (fnName === "getCourseById" && !arrow) {
        // if useApi(getCourseById) -> this doesn't match the params well
      }
      
      return `useApi(${keyString}, ${arrow ? arrow : ''}${fnName}${fnCallArgs ? fnCallArgs : ''}${restArgs ? restArgs : ''})`;
    });

    if (content !== fs.readFileSync(file, 'utf8')) {
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated ' + file);
  }
});
