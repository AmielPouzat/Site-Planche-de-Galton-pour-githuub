const http = require('http');
const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();
const siteRoot = path.join(projectRoot, 'www');
const threeDRoot = path.join(siteRoot, '3D');
const preferredPort = Number(process.env.PORT || 8000);
const maxPortAttempts = 20;

const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
    '.r': 'text/plain; charset=utf-8',
    '.txt': 'text/plain; charset=utf-8'
};

const server = http.createServer((request, response) => {
    const activePort = server.address()?.port || preferredPort;
    const url = new URL(request.url, `http://localhost:${activePort}`);
    const decodedPath = decodeURIComponent(url.pathname);
    const route = resolveRoute(decodedPath);

    if (!route) {
        response.writeHead(403);
        response.end('Forbidden');
        return;
    }

    fs.readFile(route.filePath, (error, content) => {
        if (error) {
            response.writeHead(404);
            response.end('Not found');
            return;
        }

        response.writeHead(200, {
            'Content-Type': mimeTypes[path.extname(route.filePath).toLowerCase()] || 'application/octet-stream'
        });
        response.end(content);
    });
});

function resolveRoute(urlPath) {
    const aliases = {
        '/atelier': 'outils.html',
        '/atelier/': 'outils.html',
        '/interpolation': 'regression.html',
        '/interpolation/': 'regression.html',
        '/galton': 'galton.html',
        '/galton/': 'galton.html',
        '/coffre': 'coffre.html',
        '/coffre/': 'coffre.html'
    };

    if (aliases[urlPath]) {
        return safeResolve(siteRoot, aliases[urlPath]);
    }

    if (urlPath === '/3D') {
        return { filePath: path.join(threeDRoot, 'index.html') };
    }

    if (urlPath.startsWith('/3D/')) {
        const relativePath = urlPath.slice('/3D/'.length) || 'index.html';
        return safeResolve(threeDRoot, relativePath);
    }

    const relativePath = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
    const route = safeResolve(siteRoot, relativePath);

    if (route && fs.existsSync(route.filePath)) {
        return route;
    }

    if (!path.extname(relativePath)) {
        return safeResolve(siteRoot, `${relativePath}.html`);
    }

    return route;
}

function safeResolve(root, relativePath) {
    const filePath = path.resolve(root, relativePath);

    if (!filePath.startsWith(root + path.sep) && filePath !== root) {
        return null;
    }

    return { filePath };
}

function listenOnAvailablePort(port, attemptsLeft = maxPortAttempts) {
    server.once('error', (error) => {
        if (error.code === 'EADDRINUSE' && attemptsLeft > 0 && !process.env.PORT) {
            listenOnAvailablePort(port + 1, attemptsLeft - 1);
            return;
        }

        if (error.code === 'EADDRINUSE') {
            console.error(`Le port ${port} est déjà utilisé.`);
            console.error('Ferme le serveur déjà lancé ou choisis un autre port avec : $env:PORT=8010; npm run dev');
            process.exit(1);
        }

        throw error;
    });

    server.listen(port, () => {
        console.log(`Site pouzat.fr local disponible sur http://localhost:${port}`);
        console.log(`Espace 3D disponible sur http://localhost:${port}/3D/`);
    });
}

listenOnAvailablePort(preferredPort);
