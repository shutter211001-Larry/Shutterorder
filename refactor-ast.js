const { Project, SyntaxKind } = require('ts-morph');
const fs = require('fs');
const path = require('path');

const project = new Project();
project.addSourceFilesAtPaths('packages/adminfront/src/pages/**/*.tsx');
project.addSourceFilesAtPaths('packages/adminfront/src/context/**/*.tsx');
project.addSourceFilesAtPaths('packages/adminfront/src/components/**/*.tsx');

let filesChanged = 0;

project.getSourceFiles().forEach(sourceFile => {
  let fileChanged = false;
  let needsApiImport = false;
  
  // Collect replacements to apply them safely
  const replacements = [];

  const callExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
  
  callExpressions.forEach(callExpr => {
    try {
      const expr = callExpr.getExpression();
      if (expr.getKind() === SyntaxKind.Identifier && expr.getText() === 'fetch') {
        const args = callExpr.getArguments();
        if (args.length === 0) return;

        const urlArg = args[0];
        let urlText = urlArg.getText();
        
        let isApiUrl = urlText.includes('/api/');
        let isWebhookUrl = urlText.includes('/webhook/');
        let isLocationsTableUrl = urlText.includes('/locations/');

        if (!isApiUrl && !isWebhookUrl && !isLocationsTableUrl) {
            return;
        }

        let newUrlText = urlText;
        if (urlText.startsWith("'/api/")) newUrlText = "'" + urlText.substring(6);
        else if (urlText.startsWith('"/api/')) newUrlText = '"' + urlText.substring(6);
        else if (urlText.startsWith('`/api/')) newUrlText = '`' + urlText.substring(6);

        const optionsArg = args[1];
        let method = 'GET';
        let bodyText = null;

        if (optionsArg && optionsArg.getKind() === SyntaxKind.ObjectLiteralExpression) {
          const methodProp = optionsArg.getProperty('method');
          if (methodProp && methodProp.getKind() === SyntaxKind.PropertyAssignment) {
            method = methodProp.getInitializer().getText().replace(/['"]/g, '').toUpperCase();
          }

          const bodyProp = optionsArg.getProperty('body');
          if (bodyProp && bodyProp.getKind() === SyntaxKind.PropertyAssignment) {
            bodyText = bodyProp.getInitializer().getText();
          }
        }

        let replacement = '';
        if (method === 'GET') {
          replacement = `api.get(${newUrlText})`;
        } else if (method === 'POST') {
          replacement = `api.post(${newUrlText}${bodyText ? `, ${bodyText}` : ''})`;
        } else if (method === 'PUT') {
          replacement = `api.put(${newUrlText}${bodyText ? `, ${bodyText}` : ''})`;
        } else if (method === 'PATCH') {
          replacement = `api.patch(${newUrlText}${bodyText ? `, ${bodyText}` : ''})`;
        } else if (method === 'DELETE') {
          replacement = `api.delete(${newUrlText})`;
        }

        if (replacement) {
          replacements.push({
            start: callExpr.getStart(),
            end: callExpr.getEnd(),
            text: replacement
          });
          needsApiImport = true;
          fileChanged = true;
        }
      }
    } catch (e) {
      // ignore
    }
  });

  if (fileChanged) {
    let text = sourceFile.getFullText();
    // Apply replacements from back to front to preserve indices
    replacements.sort((a, b) => b.start - a.start);
    for (const r of replacements) {
      text = text.substring(0, r.start) + r.text + text.substring(r.end);
    }

    // Quick regex to strip .then(res => res.json()) or .then(r => r.json())
    text = text.replace(/\.then\(\s*\w+\s*=>\s*\w+\.json\(\)\s*\)/g, '');
    text = text.replace(/\.then\(\s*\(\s*\w+\s*\)\s*=>\s*\w+\.json\(\)\s*\)/g, '');
    text = text.replace(/\.then\(\s*\([^)]*\)\s*=>\s*\{[^}]*\.json\(\)[^}]*\}\s*\)/g, '');
    // Some are like: .then((res) => { if (!res.ok) throw new Error('...'); return res.json(); })
    // Regex for this: 
    text = text.replace(/\.then\(\s*\([^)]*\)\s*=>\s*\{[\s\S]*?\.json\(\);?\s*\}\s*\)/g, '');

    // Replace the file text
    sourceFile.replaceWithText(text);

    // Add import { api } from '../lib/api.js'; if it doesn't exist
    if (needsApiImport) {
        const imports = sourceFile.getImportDeclarations();
        const hasApiImport = imports.some(imp => {
            const moduleSpecifier = imp.getModuleSpecifierValue();
            return moduleSpecifier.includes('lib/api');
        });
        if (!hasApiImport) {
            let insertPos = 0;
            if (imports.length > 0) {
                insertPos = imports[imports.length - 1].getEnd();
            }
            const filePath = sourceFile.getFilePath();
            const relPath = path.relative(path.dirname(filePath), path.join(process.cwd(), 'packages/adminfront/src/lib/api.js')).replace(/\\/g, '/');
            const importPath = relPath.startsWith('.') ? relPath : './' + relPath;
            sourceFile.insertText(insertPos, `\nimport { api } from '${importPath}';`);
        }
    }

    sourceFile.saveSync();
    console.log('Saved', sourceFile.getFilePath());
    filesChanged++;
  }
});

console.log(`Refactored ${filesChanged} files.`);
