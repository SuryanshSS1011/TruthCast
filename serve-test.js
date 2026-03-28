#!/usr/bin/env node
/**
 * Simple HTTP server for testing Phase 3 audio playback
 * Serves the HTML test page and generated audio file
 */

import { createServer } from 'http';
import { readFile, access } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = 3000;

const server = createServer(async (req, res) => {
  try {
    let filePath;
    let contentType;

    if (req.url === '/' || req.url === '/index.html') {
      filePath = join(__dirname, 'test-audio-playback.html');
      contentType = 'text/html';
    } else if (req.url === '/output-phase3-test.mp3') {
      filePath = join(__dirname, 'output-phase3-test.mp3');
      contentType = 'audio/mpeg';
    } else {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }

    // Check if file exists
    try {
      await access(filePath);
    } catch {
      res.writeHead(404);
      res.end('File not found');
      return;
    }

    const content = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);

  } catch (error) {
    console.error('Error:', error);
    res.writeHead(500);
    res.end('Internal Server Error');
  }
});

server.listen(PORT, () => {
  console.log('\n' + '='.repeat(70));
  console.log('🎧 TruthCast Phase 3 Audio Test Server Running');
  console.log('='.repeat(70));
  console.log(`\n✓ Server running at: http://localhost:${PORT}`);
  console.log('\n📋 Instructions:');
  console.log('   1. Open http://localhost:3000 in your browser');
  console.log('   2. If no audio loads, generate it first:');
  console.log('      npm run test-phase3 --workspace=packages/pipeline');
  console.log('   3. Refresh the page to load the audio\n');
  console.log('Press Ctrl+C to stop the server\n');
});
