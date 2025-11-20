import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || process.env.FRONTEND_PORT_INTERNAL || 4173;
const BACKEND_PORT = process.env.BACKEND_PORT || 8000;
const API_TARGET = process.env.API_TARGET || 
                   (process.env.FRONTEND_API_URL ? process.env.FRONTEND_API_URL.replace('/api', '') : null) || 
                   `http://backend:${BACKEND_PORT}`;

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const proxyRequest = (req, res) => {
  const targetUrl = new URL(API_TARGET);
  const proxyPath = req.url;
  
  const options = {
    hostname: targetUrl.hostname,
    port: targetUrl.port || BACKEND_PORT,
    path: proxyPath,
    method: req.method,
    headers: {
      ...req.headers,
      host: targetUrl.host,
    },
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    res.writeHead(502);
    res.end('Bad Gateway');
  });

  req.pipe(proxyReq);
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // API Proxy
  if (pathname.startsWith('/api')) {
    return proxyRequest(req, res);
  }

  // Serve static files
  let filePath;
  if (pathname === '/') {
    filePath = path.join(__dirname, 'dist', 'index.html');
  } else {
    filePath = path.join(__dirname, 'dist', pathname);
  }
  
  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        // SPA fallback: serve index.html for all routes
        fs.readFile(path.join(__dirname, 'dist', 'index.html'), (err, content) => {
          if (err) {
            console.error('Error serving index.html:', err);
            res.writeHead(500);
            res.end('Server error');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(content, 'utf-8');
          }
        });
      } else {
        console.error('Error reading file:', error);
        res.writeHead(500);
        res.end('Server error');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});

