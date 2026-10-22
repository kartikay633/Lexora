import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Code, Eye } from 'lucide-react';
import './ParseTree.css';

/**
 * Layout algorithm for the AST tree.
 * Assigns (x, y) coordinates to each node so they layout cleanly without overlapping.
 */
function layoutTree(node, depth = 0, nextX = { current: 40 }) {
  if (!node) return null;

  const NODE_HEIGHT = 80;
  const NODE_WIDTH = 120;
  const SIBLING_GAP = 30;

  let rawChildren = [];
  switch (node.type) {
    case 'BinaryOp': rawChildren = [node.left, node.right]; break;
    case 'UnaryOp': rawChildren = [node.argument]; break;
    case 'Assignment': case 'Declaration': case 'Return': rawChildren = [node.value]; break;
    case 'Program': case 'Block': rawChildren = node.body; break;
    case 'Function': rawChildren = [...node.params, node.body]; break;
    case 'Call': rawChildren = node.args; break;
    case 'If': rawChildren = [node.condition, node.consequent, node.alternate]; break;
    case 'While': rawChildren = [node.condition, node.body]; break;
    case 'For': rawChildren = [node.init, node.condition, node.update, node.body]; break;
  }
  rawChildren = rawChildren.filter(Boolean);

  const children = [];
  for (const child of rawChildren) {
    const layoutChild = layoutTree(child, depth + 1, nextX);
    if (layoutChild) children.push(layoutChild);
  }

  let x;
  if (children.length === 0) {
    x = nextX.current;
    nextX.current += NODE_WIDTH + SIBLING_GAP;
  } else if (children.length === 1) {
    x = children[0].x;
  } else {
    const firstX = children[0].x;
    const lastX = children[children.length - 1].x;
    x = (firstX + lastX) / 2;
  }

  return {
    node,
    x,
    y: depth * NODE_HEIGHT + 50,
    children,
  };
}

/**
 * Flatten tree layout for SVG rendering
 */
function flattenTree(layoutNode, nodes = [], edges = []) {
  if (!layoutNode) return { nodes, edges };

  nodes.push({
    x: layoutNode.x,
    y: layoutNode.y,
    node: layoutNode.node,
  });

  for (const child of layoutNode.children) {
    edges.push({
      x1: layoutNode.x,
      y1: layoutNode.y + 22,
      x2: child.x,
      y2: child.y - 22,
    });
    flattenTree(child, nodes, edges);
  }

  return { nodes, edges };
}

export default function ParseTree({ ast, emptyMessage }) {
  const [viewMode, setViewMode] = useState('diagram'); // 'diagram' | 'json'
  const [zoom, setZoom] = useState(1);
  const canvasRef = useRef(null);
  const [canvasWidth, setCanvasWidth] = useState(500);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(entries => setCanvasWidth(Math.max(200, entries[0].contentRect.width - 24)));
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [ast]);
  const [selectedNode, setSelectedNode] = useState(null);

  const treeLayout = useMemo(() => {
    if (!ast) return null;
    const nextX = { current: 60 };
    const root = layoutTree(ast, 0, nextX);
    const { nodes, edges } = flattenTree(root);

    // Compute bounds
    let maxX = 160;
    let maxY = 80;
    nodes.forEach((n) => {
      if (n.x + 160 > maxX) maxX = n.x + 160;
      if (n.y + 120 > maxY) maxY = n.y + 120;
    });

    return { root, nodes, edges, width: maxX + 20, height: maxY + 20 };
  }, [ast]);

  if (!ast) {
    return (
      <div className="empty-state">
        <p className="empty-title">No Syntax Tree Available</p>
        <p className="empty-desc">{emptyMessage || 'Add program input and compile to generate a syntax tree.'}</p>
      </div>
    );
  }

  const getNodeInfo = (n) => {
    if (n.type === 'BinaryOp') return { label: `Op '${n.op}'`, detail: 'Binary Operation', type: 'op' };
    if (n.type === 'UnaryOp') return { label: `Unary '${n.op}'`, detail: 'Unary Operation', type: 'op' };
    if (n.type === 'Number') return { label: n.raw ?? String(n.value), detail: 'Numeric Literal', type: 'num' };
    if (n.type === 'Identifier') return { label: n.name, detail: 'Variable Identifier', type: 'id' };
    if (n.type === 'Assignment') return { label: `${n.variable} =`, detail: 'Assignment Target', type: 'assign' };
    if (n.type === 'Declaration') return { label: `${n.dataType} ${n.variable}`, detail: 'Declaration', type: 'assign' };
    if (n.type === 'Literal') return { label: n.value.length > 14 ? n.value.slice(0, 11) + '…' : n.value, detail: n.dataType, type: 'num' };
    if (n.type === 'Function') return { label: n.name + '()', detail: 'Function', type: 'assign' };
    if (n.type === 'Call') return { label: n.name + '()', detail: 'Call', type: 'assign' };
    if (n.type === 'Block') return { label: 'Block', detail: 'Scope', type: 'program' };
    if (n.type === 'Return') return { label: 'return', detail: 'Return', type: 'op' };
    if (n.type === 'Update') return { label: n.variable + n.op, detail: 'Update', type: 'assign' };
    if (['If', 'While', 'For', 'Break', 'Continue'].includes(n.type)) return { label: n.type.toLowerCase(), detail: 'Control flow', type: 'op' };
    if (n.type === 'Program') return { label: 'Program', detail: `${n.body?.length || 0} statements`, type: 'program' };
    return { label: n.type, detail: '', type: 'default' };
  };

  return (
    <div className="parse-tree-view">
      <div className="tree-toolbar">
        <div className="toolbar-left">
          <span className="tree-title">Abstract Syntax Tree (AST)</span>
          <span className="tree-node-count">{treeLayout?.nodes.length || 0} nodes</span>
        </div>

        <div className="toolbar-right">
          {viewMode === 'diagram' && (
            <div className="zoom-controls">
              <button
                className="tool-btn"
                onClick={() => setZoom((z) => Math.max(0.25, z - 0.5))}
                title="Zoom Out"
              >
                <ZoomOut size={14} />
              </button>
              <button className="tool-btn" onClick={() => setZoom(treeLayout.width / canvasWidth)} title="Show tree at actual size">1:1</button>
              <span className="zoom-level">{Math.round(zoom * canvasWidth / treeLayout.width * 100)}%</span>
              <button
                className="tool-btn"
                onClick={() => setZoom((z) => Math.min(8, z + 0.5))}
                title="Zoom In"
              >
                <ZoomIn size={14} />
              </button>
              <button
                className="tool-btn"
                onClick={() => setZoom(1)}
                title="Fit tree to panel"
              >
                <RotateCcw size={13} />
              </button>
            </div>
          )}

          <div className="view-switch">
            <button
              className={`switch-btn ${viewMode === 'diagram' ? 'active' : ''}`}
              onClick={() => setViewMode('diagram')}
            >
              <Eye size={13} />
              <span>Diagram</span>
            </button>
            <button
              className={`switch-btn ${viewMode === 'json' ? 'active' : ''}`}
              onClick={() => setViewMode('json')}
            >
              <Code size={13} />
              <span>JSON</span>
            </button>
          </div>
        </div>
      </div>

      <div className="tree-canvas-container" ref={canvasRef}>
        {viewMode === 'diagram' ? (
          <div className="diagram-scroll-area">
            <svg
              className="ast-svg-canvas"
              role="img"
              aria-label="Syntax tree of program input"
              viewBox={`0 0 ${treeLayout.width} ${treeLayout.height}`}
              width={canvasWidth * zoom}
              height={treeLayout.height * canvasWidth / treeLayout.width * zoom}

            >
              <defs>
                <linearGradient id="opGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#252936" />
                  <stop offset="100%" stopColor="#1a1c26" />
                </linearGradient>
                <linearGradient id="leafGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#1e2230" />
                  <stop offset="100%" stopColor="#141722" />
                </linearGradient>
                <filter id="nodeShadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.5" />
                </filter>
              </defs>

              {/* Connecting Bézier curves */}
              {treeLayout?.edges.map((edge, idx) => {
                const midY = (edge.y1 + edge.y2) / 2;
                const path = `M ${edge.x1} ${edge.y1} C ${edge.x1} ${midY}, ${edge.x2} ${midY}, ${edge.x2} ${edge.y2}`;
                return (
                  <path
                    key={idx}
                    d={path}
                    className="ast-edge-curve"
                  />
                );
              })}

              {/* Interactive 3D Nodes */}
              {treeLayout?.nodes.map((item, idx) => {
                const info = getNodeInfo(item.node);
                const isSelected = selectedNode === item.node;
                const isOp = info.type === 'op' || info.type === 'program';

                return (
                  <g
                    key={idx}
                    transform={`translate(${item.x}, ${item.y})`}
                    className={`ast-node-group node-type-${info.type} ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedNode(item.node)}
                  >
                    {isOp ? (
                      /* Operator / Internal Node */
                      <g className="node-element">
                        <circle
                          r="24"
                          className="node-circle"
                          filter="url(#nodeShadow)"
                        />
                        <circle
                          r="22"
                          className="node-circle-inner"
                        />
                        <text
                          textAnchor="middle"
                          dy="5"
                          className="node-text op-text"
                        >
                          {info.label}
                        </text>
                      </g>
                    ) : (
                      /* Leaf / Value Node */
                      <g className="node-element">
                        <rect
                          x="-50"
                          y="-20"
                          width="100"
                          height="40"
                          rx="10"
                          className="node-rect"
                          filter="url(#nodeShadow)"
                        />
                        <rect
                          x="-48"
                          y="-18"
                          width="96"
                          height="36"
                          rx="8"
                          className="node-rect-inner"
                        />
                        <text
                          textAnchor="middle"
                          dy="-2"
                          className="node-text leaf-title"
                        >
                          {info.label}
                        </text>
                        <text
                          textAnchor="middle"
                          dy="12"
                          className="node-sub-text"
                        >
                          {info.detail}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        ) : (
          <div className="json-container">
            <pre className="json-ast-display">{JSON.stringify(ast, null, 2)}</pre>
          </div>
        )}

        {/* Selected Node Details Drawer */}
        {selectedNode && viewMode === 'diagram' && (
          <div className="node-inspector-card">
            <div className="inspector-header">
              <span className="inspector-title">Node Properties</span>
              <button className="btn-close-inspector" onClick={() => setSelectedNode(null)}>✕</button>
            </div>
            <div className="inspector-content">
              <div className="inspector-row">
                <span className="prop-name">Type:</span>
                <span className="prop-value">{selectedNode.type}</span>
              </div>
              {selectedNode.op && (
                <div className="inspector-row">
                  <span className="prop-name">Operator:</span>
                  <span className="prop-value">{selectedNode.op}</span>
                </div>
              )}
              {selectedNode.value !== undefined && (
                <div className="inspector-row">
                  <span className="prop-name">Value:</span>
                  <span className="prop-value">{String(selectedNode.value)}</span>
                </div>
              )}
              {selectedNode.variable && (
                <div className="inspector-row">
                  <span className="prop-name">Target:</span>
                  <span className="prop-value">{selectedNode.variable}</span>
                </div>
              )}
              {selectedNode.name && (
                <div className="inspector-row">
                  <span className="prop-name">Identifier:</span>
                  <span className="prop-value">{selectedNode.name}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
