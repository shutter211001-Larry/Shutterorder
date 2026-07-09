import { Project, SyntaxKind, CallExpression, StringLiteral, ObjectLiteralExpression } from 'ts-morph';

const project = new Project();
project.addSourceFilesAtPaths([
  'packages/saasfront/src/pages/**/*.tsx',
  'packages/saasfront/src/components/**/*.tsx',
  'packages/saasfront/src/context/**/*.tsx',
]);

let changedCount = 0;

for (const sourceFile of project.getSourceFiles()) {
  const filePath = sourceFile.getFilePath();
  if (filePath.includes('api.ts') || filePath.includes('sw.ts') || filePath.includes('Login.tsx')) {
    continue;
  }

  let fileChanged = false;

  // Find all fetch calls
  const fetchCalls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression)
    .filter(call => call.getExpression().getText() === 'fetch');

  for (const call of fetchCalls.reverse()) {
    const args = call.getArguments();
    if (args.length === 0) continue;

    const urlArg = args[0].getText();
    let method = 'get';
    let bodyText = '';

    if (args.length > 1) {
      const optionsArg = args[1];
      if (optionsArg.isKind(SyntaxKind.ObjectLiteralExpression)) {
        const methodProp = optionsArg.getProperty('method');
        if (methodProp && methodProp.isKind(SyntaxKind.PropertyAssignment)) {
          const methodVal = methodProp.getInitializer()?.getText().replace(/['"]/g, '').toLowerCase();
          if (methodVal) method = methodVal;
        }

        const bodyProp = optionsArg.getProperty('body');
        if (bodyProp && bodyProp.isKind(SyntaxKind.PropertyAssignment)) {
          const bodyInit = bodyProp.getInitializer();
          if (bodyInit && bodyInit.isKind(SyntaxKind.CallExpression)) {
             // JSON.stringify(body) -> extract body
             if (bodyInit.getExpression().getText() === 'JSON.stringify') {
                bodyText = bodyInit.getArguments()[0]?.getText() || '';
             }
          } else {
             bodyText = bodyInit?.getText() || '';
          }
        }
      }
    }

    // Determine replacement string
    let replacement = `api.${method}<any>(${urlArg}`;
    if (bodyText && method !== 'get' && method !== 'delete') {
      replacement += `, ${bodyText}`;
    }
    replacement += `)`;

    // Check if this fetch is part of an await
    const awaitExpr = call.getFirstAncestorByKind(SyntaxKind.AwaitExpression);
    if (awaitExpr) {
      // Find the parent variable declaration, e.g. const res = await fetch(...)
      const varDecl = awaitExpr.getFirstAncestorByKind(SyntaxKind.VariableDeclaration);
      if (varDecl) {
        // e.g. const res = await fetch(...)
        // replace fetch(...) with api(...)
        call.replaceWithText(replacement);
        
        // Find adjacent res.json() and if (!res.ok) logic and remove them.
        const block = varDecl.getFirstAncestorByKind(SyntaxKind.Block);
        if (block) {
          const statements = block.getStatements();
          const varIndex = statements.findIndex(s => s.getText().includes(varDecl.getText()));
          
          if (varIndex !== -1) {
            // we will replace `const res = await api(...)` with `const data = await api(...)` if possible?
            // Actually, simpler to just textually replace the variable name `res` usages to `data` or similar, 
            // but AST manipulation is safer. Let's just do text replacement for the whole block for simplicity, 
            // or just replace `fetch` and then run a regex pass for the `res.json()` cleanup, which is safer.
          }
        }
      } else {
        call.replaceWithText(replacement);
      }
    } else {
      // It's a .then() chain
      const thenCall = call.getParentIfKind(SyntaxKind.PropertyAccessExpression)?.getParentIfKind(SyntaxKind.CallExpression);
      call.replaceWithText(replacement);
    }
    fileChanged = true;
  }

  if (fileChanged) {
    const text = sourceFile.getFullText();
    let newText = text;
    // Post-process cleanup of common patterns
    newText = newText.replace(/const res = await api\.(get|post|put|patch|delete)<any>\([^;]+?\);[\s\S]*?(?:const|let) ([a-zA-Z0-9_]+) = await res\.json\(\);/g, (match, method, varName) => {
       const callPart = match.substring(match.indexOf('await api.'), match.indexOf(');') + 2);
       return `const ${varName} = ${callPart}`;
    });

    newText = newText.replace(/api\.(get|post|put|patch|delete)<any>\(([^)]+)\)\s*\.then\(\([^)]+\)\s*=>\s*[^.]+\.json\(\)\)/g, (match, method, args) => {
       return `api.${method}<any>(${args})`;
    });

    newText = newText.replace(/if \(!res\.ok\)[^;]+;/g, '');
    newText = newText.replace(/if \(!res\.ok\) \{[^}]+\}/g, '');

    // Import api
    if (!newText.includes('import { api }')) {
       newText = `import { api } from '../lib/api';\n` + newText;
    }

    sourceFile.replaceWithText(newText);
    changedCount++;
  }
}

project.saveSync();
console.log(`Successfully refactored ${changedCount} files in saasfront`);
