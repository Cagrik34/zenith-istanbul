/**
 * ZenithIstanbul - Industrial Myers Diff & Patch Synthesizer
 * Zero external dependencies: Computes true Longest Common Subsequence (LCS) / Myers Diff
 * across entire multi-thousand line files. Produces standard unified git diffs (@@ -l,s +l,s @@)
 * and structured side-by-side matrices for visual code review.
 */

export class DiffEngine {
  /**
   * Computes Myers Diff / LCS edit script between two arrays of lines.
   * Based on Eugene Myers' O(ND) difference algorithm.
   */
  static computeLineDiff(oldLines, newLines) {
    const N = oldLines.length;
    const M = newLines.length;
    const max = N + M;

    if (max === 0) return [];

    const vOffset = max;
    const v = new Int32Array(2 * max + 1);
    const trace = [];

    for (let d = 0; d <= max; d++) {
      const vCopy = new Int32Array(v);
      trace.push(vCopy);

      for (let k = -d; k <= d; k += 2) {
        let x;
        if (k === -d || (k !== d && v[k - 1 + vOffset] < v[k + 1 + vOffset])) {
          x = v[k + 1 + vOffset];
        } else {
          x = v[k - 1 + vOffset] + 1;
        }

        let y = x - k;

        while (x < N && y < M && oldLines[x] === newLines[y]) {
          x++;
          y++;
        }

        v[k + vOffset] = x;

        if (x >= N && y >= M) {
          return this.backtrackDiff(trace, oldLines, newLines, d, k, vOffset);
        }
      }
    }

    // Fallback: If no match found within limit, treat as complete replacement
    const fallback = [];
    for (let i = 0; i < N; i++) fallback.push({ type: 'deletion', oldLineNumber: i + 1, text: oldLines[i] });
    for (let j = 0; j < M; j++) fallback.push({ type: 'addition', newLineNumber: j + 1, text: newLines[j] });
    return fallback;
  }

  /**
   * Backtracks the edit graph to construct the precise diff script.
   */
  static backtrackDiff(trace, oldLines, newLines, d, k, vOffset) {
    const diff = [];
    let x = oldLines.length;
    let y = newLines.length;

    for (let step = d; step > 0; step--) {
      const v = trace[step];
      const prevK = (k === -step || (k !== step && v[k - 1 + vOffset] < v[k + 1 + vOffset]))
        ? k + 1
        : k - 1;

      const prevX = v[prevK + vOffset];
      const prevY = prevX - prevK;

      while (x > prevX && y > prevY) {
        x--;
        y--;
        diff.unshift({
          type: 'unchanged',
          oldLineNumber: x + 1,
          newLineNumber: y + 1,
          text: oldLines[x]
        });
      }

      if (step > 0) {
        if (x === prevX) {
          y--;
          diff.unshift({
            type: 'addition',
            newLineNumber: y + 1,
            text: newLines[y]
          });
        } else {
          x--;
          diff.unshift({
            type: 'deletion',
            oldLineNumber: x + 1,
            text: oldLines[x]
          });
        }
      }

      k = prevK;
    }

    while (x > 0 && y > 0) {
      x--;
      y--;
      diff.unshift({
        type: 'unchanged',
        oldLineNumber: x + 1,
        newLineNumber: y + 1,
        text: oldLines[x]
      });
    }

    return diff;
  }

  /**
   * Clusters a stream of DiffLines into standard Git Unified Diff hunks with context.
   */
  static createHunks(diffLines, contextLines = 3) {
    const hunks = [];
    let currentHunkLines = [];
    let lastChangeIndex = -1;

    for (let i = 0; i < diffLines.length; i++) {
      const line = diffLines[i];
      if (line.type !== 'unchanged') {
        if (currentHunkLines.length === 0) {
          const start = Math.max(0, i - contextLines);
          for (let j = start; j < i; j++) {
            currentHunkLines.push(diffLines[j]);
          }
        }
        currentHunkLines.push(line);
        lastChangeIndex = currentHunkLines.length - 1;
      } else if (currentHunkLines.length > 0) {
        currentHunkLines.push(line);
        if (currentHunkLines.length - 1 - lastChangeIndex >= contextLines) {
          let nextChange = -1;
          for (let k = i + 1; k < Math.min(diffLines.length, i + 1 + 2 * contextLines); k++) {
            if (diffLines[k].type !== 'unchanged') {
              nextChange = k;
              break;
            }
          }

          if (nextChange === -1) {
            const validLen = lastChangeIndex + 1 + contextLines;
            const hunkLines = currentHunkLines.slice(0, validLen);
            hunks.push(this.buildHunkMetadata(hunkLines));
            currentHunkLines = [];
            lastChangeIndex = -1;
          }
        }
      }
    }

    if (currentHunkLines.length > 0 && lastChangeIndex !== -1) {
      const validLen = Math.min(currentHunkLines.length, lastChangeIndex + 1 + contextLines);
      hunks.push(this.buildHunkMetadata(currentHunkLines.slice(0, validLen)));
    }

    return hunks;
  }

  static buildHunkMetadata(lines) {
    let oldStart = 0;
    let oldLines = 0;
    let newStart = 0;
    let newLines = 0;

    for (const l of lines) {
      if (l.type === 'unchanged') {
        if (!oldStart && l.oldLineNumber) oldStart = l.oldLineNumber;
        if (!newStart && l.newLineNumber) newStart = l.newLineNumber;
        oldLines++;
        newLines++;
      } else if (l.type === 'deletion') {
        if (!oldStart && l.oldLineNumber) oldStart = l.oldLineNumber;
        oldLines++;
      } else if (l.type === 'addition') {
        if (!newStart && l.newLineNumber) newStart = l.newLineNumber;
        newLines++;
      }
    }

    return {
      oldStart: oldStart || 1,
      oldLines,
      newStart: newStart || 1,
      newLines,
      lines
    };
  }

  /**
   * Produces standard Git Unified Diff output between original and modified strings.
   */
  static formatUnifiedDiff(filePath, oldText, newText, isNew = false) {
    const oldLines = oldText ? oldText.split('\n') : [];
    const newLines = newText ? newText.split('\n') : [];

    const diffLines = this.computeLineDiff(oldLines, newLines);
    const hunks = this.createHunks(diffLines, 3);

    let additions = 0;
    let deletions = 0;

    for (const l of diffLines) {
      if (l.type === 'addition') additions++;
      else if (l.type === 'deletion') deletions++;
    }

    let unifiedText = `diff --git a/${filePath} b/${filePath}\n`;
    if (isNew) {
      unifiedText += `new file mode 100644\n`;
      unifiedText += `--- /dev/null\n`;
      unifiedText += `+++ b/${filePath}\n`;
    } else {
      unifiedText += `--- a/${filePath}\n`;
      unifiedText += `+++ b/${filePath}\n`;
    }

    for (const hunk of hunks) {
      unifiedText += `@@ -${hunk.oldStart},${hunk.oldLines} +${hunk.newStart},${hunk.newLines} @@\n`;
      for (const line of hunk.lines) {
        if (line.type === 'unchanged') {
          unifiedText += ` ${line.text}\n`;
        } else if (line.type === 'deletion') {
          unifiedText += `-${line.text}\n`;
        } else if (line.type === 'addition') {
          unifiedText += `+${line.text}\n`;
        }
      }
    }

    return {
      path: filePath,
      isNew,
      isDeleted: false,
      oldContent: oldText,
      newContent: newText,
      hunks,
      unifiedDiff: unifiedText,
      stats: {
        additions,
        deletions,
        changes: additions + deletions
      }
    };
  }

  /**
   * Creates a side-by-side comparison row matrix suitable for visual UI rendering.
   */
  static generateSideBySideMatrix(oldText, newText) {
    const oldLines = oldText ? oldText.split('\n') : [];
    const newLines = newText ? newText.split('\n') : [];
    const diffLines = this.computeLineDiff(oldLines, newLines);

    const rows = [];
    let i = 0;
    while (i < diffLines.length) {
      const line = diffLines[i];
      if (line.type === 'unchanged') {
        rows.push({
          left: { lineNumber: line.oldLineNumber, text: line.text, type: 'unchanged' },
          right: { lineNumber: line.newLineNumber, text: line.text, type: 'unchanged' }
        });
        i++;
      } else if (line.type === 'deletion') {
        const next = diffLines[i + 1];
        if (next && next.type === 'addition') {
          rows.push({
            left: { lineNumber: line.oldLineNumber, text: line.text, type: 'deletion' },
            right: { lineNumber: next.newLineNumber, text: next.text, type: 'addition' }
          });
          i += 2;
        } else {
          rows.push({
            left: { lineNumber: line.oldLineNumber, text: line.text, type: 'deletion' },
            right: null
          });
          i++;
        }
      } else if (line.type === 'addition') {
        rows.push({
          left: null,
          right: { lineNumber: line.newLineNumber, text: line.text, type: 'addition' }
        });
        i++;
      }
    }

    return rows;
  }
}
