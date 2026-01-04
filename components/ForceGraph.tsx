import React, { useEffect, useMemo, useRef } from 'react';
import * as d3 from 'd3';
import { DiskNode } from '../types';

type GraphNode = {
  id: string;
  name: string;
  type: 'file' | 'directory';
  size: number;
  depth: number;
  path: string;
  extension?: string;
};

type GraphLink = {
  source: string;
  target: string;
};

interface ForceGraphProps {
  data: DiskNode;
  topN?: number;
}

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const truncateMiddle = (value: string, maxLength = 20) => {
  if (value.length <= maxLength) return value;
  const keep = Math.max(4, Math.floor((maxLength - 3) / 2));
  return `${value.slice(0, keep)}...${value.slice(-keep)}`;
};

const collectTopFiles = (root: DiskNode, limit: number) => {
  const files: { path: string; name: string; size: number; extension?: string }[] = [];
  const toExtension = (name: string) => {
    if (name.startsWith('.') || !name.includes('.')) return undefined;
    return name.split('.').pop()?.toLowerCase();
  };

  const walk = (node: DiskNode, parentPath: string) => {
    const currentPath = parentPath ? `${parentPath}/${node.name}` : node.name;
    if (node.type === 'file') {
      files.push({ path: currentPath, name: node.name, size: node.size, extension: toExtension(node.name) });
      return;
    }
    node.children?.forEach((child) => walk(child, currentPath));
  };

  walk(root, '');
  return files.sort((a, b) => b.size - a.size).slice(0, limit);
};

const buildGraph = (root: DiskNode, limit: number) => {
  const topFiles = collectTopFiles(root, limit);
  const nodes = new Map<string, GraphNode>();
  const links: GraphLink[] = [];

  const addDirNode = (path: string, name: string, depth: number) => {
    if (!nodes.has(path)) {
      nodes.set(path, {
        id: path,
        name,
        type: 'directory',
        size: 0,
        depth,
        path,
      });
    }
  };

  topFiles.forEach((file) => {
    const parts = file.path.split('/').filter(Boolean);
    let parentPath = '';
    parts.forEach((part, idx) => {
      const currentPath = parentPath ? `${parentPath}/${part}` : part;
      const isFile = idx === parts.length - 1;
      if (isFile) {
        nodes.set(currentPath, {
          id: currentPath,
          name: part,
          type: 'file',
          size: file.size,
          depth: idx,
          path: currentPath,
          extension: file.extension,
        });
        if (parentPath) {
          links.push({ source: parentPath, target: currentPath });
        }
      } else {
        addDirNode(currentPath, part, idx);
        if (parentPath) {
          links.push({ source: parentPath, target: currentPath });
        }
      }
      parentPath = currentPath;
    });
  });

  return { nodes: Array.from(nodes.values()), links };
};

export const ForceGraph: React.FC<ForceGraphProps> = ({ data, topN = 100 }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const graph = useMemo(() => buildGraph(data, topN), [data, topN]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight || 600;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const viewport = svg.append('g').attr('class', 'viewport');

    const extColor = d3.scaleOrdinal<string, string>()
      .domain(Array.from(new Set(graph.nodes.filter((n) => n.type === 'file').map((n) => n.extension || 'unknown'))))
      .range(d3.schemeTableau10.concat(d3.schemeSet3).concat(d3.schemePaired));

    const sizeScale = d3.scaleSqrt()
      .domain([0, d3.max(graph.nodes, (d) => d.size) || 1])
      .range([4, 18]);

    const simulation = d3.forceSimulation<GraphNode>(graph.nodes)
      .force('charge', d3.forceManyBody().strength(-180))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('link', d3.forceLink<GraphNode, GraphLink>(graph.links).id((d) => d.id).distance(60).strength(0.6))
      .force('collide', d3.forceCollide<GraphNode>().radius((d) => sizeScale(d.size) + 4));

    const link = viewport.append('g')
      .attr('stroke', '#cbd5f5')
      .attr('stroke-opacity', 0.7)
      .selectAll('line')
      .data(graph.links)
      .enter()
      .append('line')
      .attr('stroke-width', 1);

    const node = viewport.append('g')
      .selectAll('g')
      .data(graph.nodes)
      .enter()
      .append('g')
      .call(
        d3.drag<SVGGElement, GraphNode>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.35).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.05);
            d.fx = null;
            d.fy = null;
          })
      );

    node.append('circle')
      .attr('r', (d) => (d.type === 'file' ? sizeScale(d.size) : 6))
      .attr('fill', (d) => (d.type === 'file' ? extColor(d.extension || 'unknown') : '#94a3b8'))
      .attr('stroke', '#0f172a')
      .attr('stroke-width', 0.5)
      .attr('opacity', 0.9);

    node.append('title')
      .text((d) => `${d.path}\n${d.type === 'file' ? formatSize(d.size) : 'directory'}`);

    node.append('text')
      .text((d) => truncateMiddle(d.name, 20))
      .attr('x', 10)
      .attr('y', 4)
      .attr('font-size', '10px')
      .attr('fill', '#334155')
      .attr('pointer-events', 'none');

    const applyHighlight = (path?: string) => {
      const ancestors = new Set<string>();
      if (path) {
        const parts = path.split('/').filter(Boolean);
        let current = '';
        parts.forEach((part) => {
          current = current ? `${current}/${part}` : part;
          ancestors.add(current);
        });
      }

      node.selectAll('circle')
        .attr('stroke', (d) => (ancestors.size === 0 || ancestors.has(d.path) ? '#0f172a' : '#e2e8f0'))
        .attr('stroke-width', (d) => (ancestors.has(d.path) ? 2 : 0.5))
        .attr('opacity', (d) => (ancestors.size === 0 || ancestors.has(d.path) ? 0.95 : 0.25));

      link
        .attr('stroke', (d: any) => {
          if (ancestors.size === 0) return '#cbd5f5';
          const src = (d.source as GraphNode).path || (d.source as any).id;
          const tgt = (d.target as GraphNode).path || (d.target as any).id;
          return ancestors.has(src) && ancestors.has(tgt) ? '#6366f1' : '#e2e8f0';
        })
        .attr('stroke-opacity', (d: any) => {
          if (ancestors.size === 0) return 0.7;
          const src = (d.source as GraphNode).path || (d.source as any).id;
          const tgt = (d.target as GraphNode).path || (d.target as any).id;
          return ancestors.has(src) && ancestors.has(tgt) ? 0.9 : 0.2;
        })
        .attr('stroke-width', (d: any) => {
          if (ancestors.size === 0) return 1;
          const src = (d.source as GraphNode).path || (d.source as any).id;
          const tgt = (d.target as GraphNode).path || (d.target as any).id;
          return ancestors.has(src) && ancestors.has(tgt) ? 2 : 1;
        });
    };

    node.on('click', (event, d) => {
      event.stopPropagation();
      applyHighlight(d.path);
    });

    svg.on('click', () => applyHighlight(undefined));

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d) => `translate(${d.x},${d.y})`);
    });

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.4, 3.5])
      .on('zoom', (event) => {
        viewport.attr('transform', event.transform.toString());
      });

    svg.call(zoom as any);

    return () => {
      simulation.stop();
    };
  }, [graph]);

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Force Graph (Top {topN} Files)</h2>
          <p className="text-xs text-gray-500">Drag a node to see the network jiggle like jelly.</p>
        </div>
        <div className="text-xs text-gray-500">
          Nodes: {graph.nodes.length} · Links: {graph.links.length}
        </div>
      </div>
      <div ref={containerRef} className="flex-1 min-h-[560px] w-full rounded-lg bg-slate-50 border border-slate-100">
        <svg ref={svgRef} className="w-full h-full block" />
      </div>
      <div className="mt-3 text-sm text-gray-500 text-center">
        使用方法：拖拽节点探索网络，滚轮缩放，点击节点高亮其祖先路径。
      </div>
    </div>
  );
};
