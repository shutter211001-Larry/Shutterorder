const { Project, SyntaxKind } = require('ts-morph');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const frontend = process.argv[2] || 'adminfront';
const projectDir = path.join(__dirname, '..', 'packages', frontend);
const localesDir = path.join(projectDir, 'src', 'i18n', 'locales');
const localesFiles = ['en.json', 'es.json', 'fr.json', 'de.json', 'it.json', 'ja.json', 'ko.json', 'pt.json', 'th.json', 'tl.json', 'vi.json', 'id.json', 'zh-TW.json'];

const project = new Project();
project.addSourceFilesAtPaths(path.join(projectDir, 'src', '**', '*.{ts,tsx}'));

// Regex to detect Chinese characters
const chineseRegex = /[\u4e00-\u9fa5]/;

function setNestedProperty(obj, keyPath, value) {
  const keys = keyPath.split('.');
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    if (!current[k]) current[k] = {};
    current = current[k];
  }
  const lastKey = keys[keys.length - 1];
  if (current[lastKey] === undefined) {
    current[lastKey] = value;
  }
}

function updateLocales(keyPath, value) {
  for (const locale of localesFiles) {
    const filePath = path.join(localesDir, locale);
    if (!fs.existsSync(filePath)) continue;
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const json = JSON.parse(content);
      setNestedProperty(json, keyPath, value);
      fs.writeFileSync(filePath, JSON.stringify(json, null, 2) + '\n', 'utf8');
    } catch (e) {
      console.error(`Error updating locale ${locale}:`, e);
    }
  }
}

function generateKey(fileName, text) {
  const baseName = path.basename(fileName, path.extname(fileName));
  const hash = crypto.createHash('md5').update(text).digest('hex').substring(0, 6);
  return `${baseName.charAt(0).toLowerCase() + baseName.slice(1)}.${hash}`;
}

const sourceFiles = project.getSourceFiles();

for (const sourceFile of sourceFiles) {
  let fileModified = false;
  let needsImport = false;
  
  // We only care if there's Chinese
  if (!chineseRegex.test(sourceFile.getFullText())) continue;

  const fileName = sourceFile.getBaseName();

  // 1. Find JsxText nodes
  const jsxTexts = sourceFile.getDescendantsOfKind(SyntaxKind.JsxText);
  for (const node of jsxTexts) {
    const text = node.getLiteralText().trim();
    if (text && chineseRegex.test(text)) {
      const key = generateKey(fileName, text);
      updateLocales(key, text);
      try {
        node.replaceWithText(`{t('${key}') || '${text}'}`);
        fileModified = true;
        needsImport = true;
      } catch (e) { console.error(`Failed to replace JsxText in ${fileName}`); }
    }
  }

  // 2. Find StringLiterals
  const stringLiterals = sourceFile.getDescendantsOfKind(SyntaxKind.StringLiteral);
  for (const node of stringLiterals) {
    const text = node.getLiteralValue();
    if (text && chineseRegex.test(text)) {
      const parent = node.getParent();
      if (parent.getKind() === SyntaxKind.ImportDeclaration) continue;
      
      let isJsxAttr = false;
      if (parent.getKind() === SyntaxKind.JsxAttribute) {
        isJsxAttr = true;
      }

      const key = generateKey(fileName, text);
      updateLocales(key, text);

      try {
        if (isJsxAttr) {
          node.replaceWithText(`{t('${key}') || '${text}'}`);
        } else {
          node.replaceWithText(`(t('${key}') || '${text}')`);
        }
        fileModified = true;
        needsImport = true;
      } catch (e) { console.error(`Failed to replace StringLiteral in ${fileName}`); }
    }
  }

  // 3. Find NoSubstitutionTemplateLiteral
  const templateLiterals = sourceFile.getDescendantsOfKind(SyntaxKind.NoSubstitutionTemplateLiteral);
  for (const node of templateLiterals) {
    const text = node.getLiteralValue();
    if (text && chineseRegex.test(text)) {
      const parent = node.getParent();
      let isJsxAttr = false;
      if (parent.getKind() === SyntaxKind.JsxAttribute) {
        isJsxAttr = true;
      }

      const key = generateKey(fileName, text);
      updateLocales(key, text);
      try {
        if (isJsxAttr) {
          node.replaceWithText(`{t('${key}') || '${text}'}`);
        } else {
          node.replaceWithText(`(t('${key}') || '${text}')`);
        }
        fileModified = true;
        needsImport = true;
      } catch (e) { console.error(`Failed to replace NoSubstitutionTemplateLiteral in ${fileName}`); }
    }
  }

  if (fileModified && needsImport) {
    // Check if 'useTranslation' is already imported
    const imports = sourceFile.getImportDeclarations();
    let hasImport = false;
    for (const imp of imports) {
      if (imp.getModuleSpecifierValue() === 'react-i18next') {
        const namedImports = imp.getNamedImports().map(ni => ni.getName());
        if (namedImports.includes('useTranslation')) {
          hasImport = true;
        }
        break;
      }
    }
    if (!hasImport) {
      try {
        sourceFile.addImportDeclaration({
          namedImports: ['useTranslation'],
          moduleSpecifier: 'react-i18next'
        });
      } catch (e) {}
    }

    // Try to inject const { t } = useTranslation();
    const functions = sourceFile.getFunctions();
    for (const func of functions) {
        const body = func.getBody();
        if (body && body.getKind() === SyntaxKind.Block) {
           const text = body.getText();
           if (!text.includes('useTranslation()')) {
               try { func.insertStatements(0, 'const { t } = useTranslation();'); } catch (e) {}
           }
        }
    }
    
    const varDecls = sourceFile.getVariableDeclarations();
    for (const vd of varDecls) {
        const init = vd.getInitializer();
        if (init && init.getKind() === SyntaxKind.ArrowFunction) {
            const body = init.getBody();
            if (body && body.getKind() === SyntaxKind.Block) {
               const text = body.getText();
               if (!text.includes('useTranslation()')) {
                   try { init.insertStatements(0, 'const { t } = useTranslation();'); } catch(e){}
               }
            }
        }
    }

    sourceFile.saveSync();
    console.log(`Updated ${fileName}`);
  }
}
console.log('Finished processing ' + frontend);
