const fs = require('fs');
const path = require('path');

const root = process.cwd();
const ignoredDirectories = new Set(['.git', 'node_modules']);
const jsFiles = [];

function collectJsFiles(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        if (ignoredDirectories.has(entry.name)) continue;

        const fullPath = path.join(directory, entry.name);

        if (entry.isDirectory()) {
            collectJsFiles(fullPath);
            continue;
        }

        if (entry.isFile() && entry.name.endsWith('.js')) {
            jsFiles.push(fullPath);
        }
    }
}

collectJsFiles(root);

for (const file of jsFiles) {
    const relativeFile = path.relative(root, file);
    const source = fs.readFileSync(file, 'utf8');

    try {
        new Function(source);
    } catch (error) {
        console.error(`Syntax error in ${relativeFile}`);
        throw error;
    }
}

console.log(`Syntax OK: ${jsFiles.length} fichier(s) JavaScript verifies.`);
