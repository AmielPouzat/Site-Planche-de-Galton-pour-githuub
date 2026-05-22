const http = require('http');
const fs = require('fs');
const path = require('path');

const root = process.cwd();
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
    '.webp': 'image/webp'
};

const server = http.createServer((request, response) => {
    const activePort = server.address()?.port || preferredPort;
    const url = new URL(request.url, `http://localhost:${activePort}`);
    const requestedPath = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname).replace(/^\/+/, '');
    const filePath = path.resolve(root, requestedPath);

    if (!filePath.startsWith(root + path.sep) && filePath !== root) {
        response.writeHead(403);
        response.end('Forbidden');
        return;
    }

    fs.readFile(filePath, (error, content) => {
        if (error) {
            response.writeHead(404);
            response.end('Not found');
            return;
        }

        response.writeHead(200, {
            'Content-Type': mimeTypes[path.extname(filePath)] || 'application/octet-stream'
        });
        response.end(content);
    });
});

function listenOnAvailablePort(port, attemptsLeft = maxPortAttempts) {
    server.once('error', (error) => {
        if (error.code === 'EADDRINUSE' && attemptsLeft > 0 && !process.env.PORT) {
            listenOnAvailablePort(port + 1, attemptsLeft - 1);
            return;
        }

        if (error.code === 'EADDRINUSE') {
            console.error(`Le port ${port} est deja utilise.`);
            console.error('Ferme le serveur deja lance ou choisis un autre port avec : $env:PORT=8010; npm run dev');
            process.exit(1);
        }

        throw error;
    });

    server.listen(port, () => {
        console.log(`Campus 3D disponible sur http://localhost:${port}`);
    });
}

listenOnAvailablePort(preferredPort);
