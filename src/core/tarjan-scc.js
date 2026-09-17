/**
 * ZenithIstanbul - Standalone Tarjan SCC Detector
 * Iterative stack-based Strongly Connected Component detection.
 * Heap-allocated call stack prevents V8 call stack overflow on large graphs.
 * Operates in O(V + E) time for arbitrary directed graphs.
 *
 * Extracted from TrafficEngine to enable standalone testing and reuse.
 */

/**
 * Finds all Strongly Connected Components with size > 1 in a directed graph.
 * Uses iterative Tarjan's algorithm with explicit heap stack.
 *
 * @param {Map<string, Set<string>>} adjacencyList - Directed graph: nodeId → Set of target nodeIds.
 * @returns {Array<Array<string>>} Array of SCCs, each an array of node IDs forming a cycle.
 */
export function findSCCs(adjacencyList) {
  let index = 0;
  const indices = new Map();
  const lowlink = new Map();
  const onStack = new Map();
  const stack = [];
  const sccs = [];

  for (const startNode of adjacencyList.keys()) {
    if (indices.has(startNode)) continue;

    const callStack = [{
      v: startNode,
      neighbors: Array.from(adjacencyList.get(startNode) || []),
      neighborIdx: 0
    }];

    indices.set(startNode, index);
    lowlink.set(startNode, index);
    index++;
    stack.push(startNode);
    onStack.set(startNode, true);

    while (callStack.length > 0) {
      const top = callStack[callStack.length - 1];
      const v = top.v;

      if (top.neighborIdx < top.neighbors.length) {
        const w = top.neighbors[top.neighborIdx++];

        if (!indices.has(w)) {
          indices.set(w, index);
          lowlink.set(w, index);
          index++;
          stack.push(w);
          onStack.set(w, true);

          callStack.push({
            v: w,
            neighbors: Array.from(adjacencyList.get(w) || []),
            neighborIdx: 0
          });
        } else if (onStack.get(w)) {
          lowlink.set(v, Math.min(lowlink.get(v), indices.get(w)));
        }
      } else {
        callStack.pop();

        if (callStack.length > 0) {
          const parent = callStack[callStack.length - 1].v;
          lowlink.set(parent, Math.min(lowlink.get(parent), lowlink.get(v)));
        }

        if (lowlink.get(v) === indices.get(v)) {
          const scc = [];
          let w;
          do {
            w = stack.pop();
            onStack.set(w, false);
            scc.push(w);
          } while (w !== v);

          if (scc.length > 1) {
            sccs.push(scc);
          }
        }
      }
    }
  }

  return sccs;
}
