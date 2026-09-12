import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

test('real test runner rejects empty suites and propagates a failed assertion', () => {
  const directory = mkdtempSync(join(tmpdir(), 'ridgemesh-failed-suite-'));
  const childEnv: NodeJS.ProcessEnv = { ...process.env, RIDGEMESH_TEST_DIRECTORY: directory };
  delete childEnv.NODE_TEST_CONTEXT;
  const run = () => spawnSync(process.execPath, ['scripts/run-tests.mjs'], {
    env: childEnv, encoding: 'utf8',
  });
  try {
    const empty = run();
    assert.equal(empty.status, 1);
    assert.match(empty.stderr, /No test suites found/);
    writeFileSync(join(directory, 'fail.test.ts'), 'import {test} from "node:test"; import assert from "node:assert/strict"; test("deliberate failure", () => assert.equal(1, 2));');
    const failed = run();
    assert.equal(failed.status, 1);
    assert.match(failed.stdout, /deliberate failure/);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('owned manifest references existing public icons', () => {
  const manifest = JSON.parse(readFileSync('public/manifest.webmanifest', 'utf8'));
  assert.equal(manifest.start_url, '/');
  assert.ok(manifest.icons.length > 0);
  for (const icon of manifest.icons) assert.ok(readFileSync(`public${icon.src}`).length > 0);
});
