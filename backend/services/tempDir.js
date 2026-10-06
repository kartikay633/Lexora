/**
 * tempDir.js — Temporary directory management for compilation
 * 
 * Each compile request gets a unique temp directory.
 * Files are written there, compilation happens, then cleanup.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { randomUUID: uuidv4 } = require('node:crypto');
const { windowsToWslPath } = require('./wslRunner');

/**
 * Create a unique temporary directory for a compilation run.
 * @returns {{ windowsPath: string, wslPath: string, id: string }}
 */
function createTempDir() {
  const id = uuidv4();
  const dirName = `lexora-${id}`;
  const windowsPath = path.join(os.tmpdir(), dirName);
  fs.mkdirSync(windowsPath, { recursive: true });
  const wslPath = windowsToWslPath(windowsPath);
  return { windowsPath, wslPath, id };
}

/**
 * Write content to a file inside the temp directory.
 * @param {string} dirPath - Windows path to the temp directory
 * @param {string} filename - Name of the file to create
 * @param {string} content - File content
 * @returns {string} Full path to the created file
 */
function writeFile(dirPath, filename, content) {
  const filePath = path.join(dirPath, filename);
  fs.writeFileSync(filePath, filename.endsWith('.l') || filename.endsWith('.y') ? content.replace(/\r\n?/g, '\n') : content, 'utf-8');
  return filePath;
}

/**
 * Clean up a temporary directory.
 * Never throws — logs errors silently.
 * @param {string} windowsPath - Windows path to the temp directory
 */
function cleanupTempDir(windowsPath) {
  try {
    if (windowsPath && fs.existsSync(windowsPath)) {
      fs.rmSync(windowsPath, { recursive: true, force: true });
    }
  } catch (err) {
    console.warn(`[tempDir] Cleanup warning for ${windowsPath}:`, err.message);
  }
}

module.exports = { createTempDir, writeFile, cleanupTempDir };
