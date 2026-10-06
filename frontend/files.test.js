import test from 'node:test';
import assert from 'node:assert/strict';
import { readUploads } from './src/services/files.js';
test('uploads normalize extensions and preserve empty input', async () => {
  const files = await readUploads([new File(['%%\n%%'], 'SCAN.L'), new File([''], 'input.in')]);
  assert.equal(files[0].name, 'SCAN.l'); assert.equal(files[1].content, ''); assert.notEqual(files[0].id, files[1].id);
});
test('uploads reject unsupported, oversized and binary files', async () => {
  for (const file of [new File(['x'], 'code.c'), new File(['x'.repeat(102401)], 'scan.l'), new File(['\0'], 'scan.l')]) await assert.rejects(readUploads([file]));
});
