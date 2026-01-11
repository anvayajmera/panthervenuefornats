const http = require('http');
const fs = require('fs');
const path = require('path');

const port = Number(process.env.PORT || 3000);
const root = process.cwd();

const routeMap = {
  '/': '/index.html',
  '/events': '/event.html',
  '/rent': '/rent.html',
  '/login': '/login.html',
  '/gallery': '/gallery2.html',
  '/viewer': '/viewer.html',
  '/flyer': '/flyer.html',
  '/flyer3': '/flyer3.html',
  '/404': '/404.html'
};

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject'
};

const sendError = (res, statusCode, message) => {
  res.writeHead(statusCode, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(message);
};

const resolvePath = (pathname) => {
  const mapped = routeMap[pathname] || pathname;
  const normalized = path.normalize(mapped);
  const filePath = path.join(root, normalized);
  const relative = path.relative(root, filePath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    return null;
  }
  return filePath;
};

const serveFile = (req, res, filePath, statusCode = 200) => {
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      if (statusCode === 404) {
        return sendError(res, 404, 'Not Found');
      }
      const notFoundPath = resolvePath('/404.html');
      if (notFoundPath) {
        return serveFile(req, res, notFoundPath, 404);
      }
      return sendError(res, 404, 'Not Found');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.writeHead(statusCode, {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Cache-Control': 'no-cache'
    });

    if (req.method === 'HEAD') {
      res.end();
      return;
    }

    const stream = fs.createReadStream(filePath);
    stream.on('error', () => sendError(res, 500, 'Server Error'));
    stream.pipe(res);
  });
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let pathname = decodeURIComponent(url.pathname);

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return sendError(res, 405, 'Method Not Allowed');
  }

  let filePath = resolvePath(pathname);
  if (!filePath) {
    return sendError(res, 403, 'Forbidden');
  }

  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
    serveFile(req, res, filePath);
  });
});

server.listen(port, () => {
  console.log(`Local dev server running at http://localhost:${port}`);
});
