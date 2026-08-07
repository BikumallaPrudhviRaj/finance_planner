'use strict';
const express = require('express');
const path    = require('path');
const fs      = require('fs');

const PORT = process.env.PORT || 8080;
const app  = express();

// In the container: index.html lives in the same dir as server.js (/app)
// When running locally from repo root: index.html is one level up (../)
const STATIC_DIR = fs.existsSync(path.join(__dirname, 'index.html'))
  ? __dirname
  : path.join(__dirname, '..');

app.use(express.static(STATIC_DIR));
app.get('*', (_, res) => res.sendFile(path.join(STATIC_DIR, 'index.html')));
app.get('/health', (_, res) => res.json({ status: 'ok' }));

app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server on :${PORT}  (static: ${STATIC_DIR})`));
