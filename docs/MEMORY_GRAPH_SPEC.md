# Memory & Knowledge Graph Engine Specification

> **Deterministic Fruchterman–Reingold Spring-Force Layout, Semantic Topic Extraction, and Zero-Dependency SVG Visualization**

The Zenith Istanbul Memory Graph maps the collective intelligence, operational memories, and communication frequencies of the AKOM autonomous agent swarm into an interactive graph.

---

## 1. Physics Engine: Fruchterman–Reingold Layout

The layout algorithm operates without external graph visualization libraries (e.g. D3 or Cytoscape), computing equilibrium positions in $O(I \cdot (V^2 + E))$ time:

### Mathematical Formulation

Given an area $W \times H$ with $N$ vertices, the optimal node distance $k$ is defined as:

$$k = C \sqrt{\frac{W \times H}{N}}$$

Where $C = 0.75$ serves as the dispersion constant.

#### Repulsive Forces (All node pairs)
Nodes repel one another inversely proportional to their Euclidean distance $d$:

$$F_r(d) = \frac{k^2}{d}$$

To prevent division by zero or infinite acceleration at overlapping initial states, a minimum distance clamp ($\epsilon = 0.01$) is enforced.

#### Attractive Forces (Connected edges)
Edges pull connected nodes together proportional to the square of their distance:

$$F_a(d) = \frac{d^2}{k}$$

#### Cooling Schedule (Simulated Annealing)
At each iteration $t \in [1, \text{iterations}]$, nodal displacement is bounded by temperature $T(t)$:

$$T(t) = \text{initialTemp} \times \left(1 - \frac{t}{\text{iterations}}\right)$$

Nodal displacement $\Delta p$ is constrained to:

$$\Delta p \leftarrow \frac{\Delta p}{|\Delta p|} \times \min(|\Delta p|, T(t))$$

Nodes are clamped to a safety bounding margin ($30\text{px}$) from viewport boundaries to ensure labels remain fully legible.

---

## 2. Topic Extraction & Shared Knowledge

To reveal cross-agent cognitive alignment without sending unredacted context to external embedding models, the engine performs lightweight semantic topic extraction directly from `agents/<id>/memory.md`:

1. **Heading Extraction**: Markdown headings (`#`, `##`, `###`) are isolated and sanitized of punctuation.
2. **Frequency Filtering**: Topics mentioned across $\ge 2$ independent agent memories are recognized as **Shared Knowledge Topics**.
3. **Pseudo-Topic Nodes**: Each shared topic is instantiated as a distinct node in the graph (diamond visual glyph), drawing undirected semantic edges to the agents whose memories reference it.

---

## 3. Communication Edge Aggregation

Directed edges between agent nodes are dynamically weighted by analyzing the swarm event log (`log.jsonl`):

$$\text{Weight}(A \to B) = \sum_{m \in \text{Messages}} \mathbb{I}(m.\text{from} = A \land m.\text{to} = B)$$

Edge stroke widths scale logarithmically with message volume:

$$\text{StrokeWidth} = \min(6, 1.2 + \ln(1 + \text{Weight}))$$

---

## 4. Interactive Client-Side Rendering

The graph renders inside the AKOM Swarm Ops Deck modal as an inline SVG:

- **Agent Nodes**: Circular glowing badges colored by agent role, displaying active status (`STANDBY`, `WORKING`).
- **Topic Nodes**: Cyan diamond badges representing shared architectural knowledge.
- **Interactive Dragging**: Nodes can be pinned to exact coordinates, causing connected edges to update in real time.
- **Edge Highlighting**: Hovering an edge displays message count, last communicative speech act, and delivery timestamp.
