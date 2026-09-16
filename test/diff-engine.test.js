import test from 'node:test';
import assert from 'node:assert/strict';
import { DiffEngine } from '../src/agent/diff-engine.js';

test('DiffEngine - Identical text produces zero changes', () => {
  const text = 'const a = 1;\nconst b = 2;\nconsole.log(a + b);';
  const result = DiffEngine.formatUnifiedDiff('test.js', text, text);

  assert.equal(result.stats.changes, 0);
  assert.equal(result.stats.additions, 0);
  assert.equal(result.stats.deletions, 0);
  assert.equal(result.hunks.length, 0);
});

test('DiffEngine - Correctly identifies additions and deletions with standard hunks', () => {
  const oldText = `import { B } from './b';
export const a = 1;
export function run() {
  return B.exec();
}`;

  const newText = `import type { IBContract } from './contracts/b.contract';
export const a = 1;
export function run() {
  return 'ok';
}`;

  const result = DiffEngine.formatUnifiedDiff('src/a.ts', oldText, newText);

  assert.ok(result.stats.changes > 0);
  assert.ok(result.stats.additions > 0);
  assert.ok(result.stats.deletions > 0);
  assert.ok(result.unifiedDiff.includes('--- a/src/a.ts'));
  assert.ok(result.unifiedDiff.includes('+++ b/src/a.ts'));
  assert.ok(result.unifiedDiff.includes('@@ -1,'));
  assert.ok(result.unifiedDiff.includes('-import { B } from \'./b\';'));
  assert.ok(result.unifiedDiff.includes('+import type { IBContract } from \'./contracts/b.contract\';'));
});

test('DiffEngine - New file mode produces correct git header', () => {
  const content = 'export interface IContract {\n  id: string;\n}';
  const result = DiffEngine.formatUnifiedDiff('src/contracts/b.contract.ts', '', content, true);

  assert.ok(result.isNew);
  assert.ok(result.unifiedDiff.includes('new file mode 100644'));
  assert.ok(result.unifiedDiff.includes('--- /dev/null'));
  assert.ok(result.unifiedDiff.includes('+++ b/src/contracts/b.contract.ts'));
  assert.equal(result.stats.additions, 3);
  assert.equal(result.stats.deletions, 0);
});

test('DiffEngine - Generates valid side-by-side comparison matrix', () => {
  const oldText = 'line1\nline2\nline3';
  const newText = 'line1\nline2_modified\nline3\nline4_added';

  const matrix = DiffEngine.generateSideBySideMatrix(oldText, newText);
  assert.ok(Array.isArray(matrix));
  assert.ok(matrix.length >= 4);

  // Line 1 should be unchanged on both sides
  assert.equal(matrix[0].left?.type, 'unchanged');
  assert.equal(matrix[0].right?.type, 'unchanged');
  assert.equal(matrix[0].left?.text, 'line1');

  // Modified row
  assert.equal(matrix[1].left?.type, 'deletion');
  assert.equal(matrix[1].right?.type, 'addition');

  // Added line at end
  const last = matrix[matrix.length - 1];
  assert.equal(last.left, null);
  assert.equal(last.right?.type, 'addition');
  assert.equal(last.right?.text, 'line4_added');
});
