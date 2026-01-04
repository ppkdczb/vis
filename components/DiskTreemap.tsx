import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { DiskNode } from '../types';

interface DiskTreemapProps {
  data: DiskNode;
  groupColors?: Record<string, string>;
}

export const DiskTreemap: React.FC<DiskTreemapProps> = ({ data, groupColors }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredNode, setHoveredNode] = useState<{name: string, value: number, path: string} | null>(null);
  const [focusPath, setFocusPath] = useState<string[]>([]);

  useEffect(() => {
    setFocusPath([]);
  }, [data]);

  const currentRoot = useMemo(() => {
    if (focusPath.length === 0) return data;
    const segments = focusPath[0] === data.name ? focusPath.slice(1) : focusPath;
    let cursor: DiskNode | undefined = data;
    for (const segment of segments) {
      const next = cursor.children?.find((child) => child.name === segment);
      if (!next) return data;
      cursor = next;
    }
    return cursor || data;
  }, [data, focusPath]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !currentRoot) return;

    // Clear previous render
    d3.select(svgRef.current).selectAll("*").remove();

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight || 600;

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .style("font-family", "sans-serif");

    const viewport = svg.append("g").attr("class", "viewport");

    // Create hierarchy
    const root = d3.hierarchy<DiskNode>(currentRoot)
      .sum((d) => {
        if (d.type !== 'file') return 0;
        const normalized = Math.log1p(d.size);
        return Math.max(normalized, Math.log1p(1024 * 1024));
      })
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    // Create treemap layout
    d3.treemap<DiskNode>()
      .size([width, height])
      .paddingTop(28)
      .paddingRight(7)
      .paddingInner(3)
      (root);

    // Cast to HierarchyRectangularNode since treemap layout adds coordinates (x0, y0, x1, y1)
    const rootNode = root as d3.HierarchyRectangularNode<DiskNode>;

    // Color scale
    const color = d3.scaleOrdinal(d3.schemeTableau10);
    const topLevelCount = rootNode.children?.length || 0;

    // Render Nodes
    const nodes = viewport.selectAll("g")
      .data(rootNode.descendants())
      .enter()
      .append("g")
      .attr("transform", (d) => `translate(${d.x0},${d.y0})`);

    // Rectangles
    nodes.append("rect")
      .attr("width", (d) => d.x1 - d.x0)
      .attr("height", (d) => d.y1 - d.y0)
      .attr("fill", (d) => {
        if (d.depth === 0) return "transparent";
        // Color by parent name to group visually
        let parent = d;
        while (parent.depth > 1) parent = parent.parent!;
        let groupName = parent.data.name;
        if (topLevelCount <= 1 && parent.children && parent.children.length > 0) {
          const depthTwo = d.ancestors().find((node) => node.depth === 2);
          if (depthTwo) {
            groupName = depthTwo.data.name;
          }
        }
        return groupColors?.[groupName] || color(groupName);
      })
      .attr("rx", 4)
      .attr("opacity", 0.8)
      .on("mouseover", (event, d) => {
        d3.select(event.currentTarget).attr("opacity", 1).attr("stroke", "#fff").attr("stroke-width", 2);
        const parts = d.ancestors().reverse().map(n => n.data.name);
        const fullParts = focusPath.length > 0 ? focusPath.concat(parts.slice(1)) : parts;
        setHoveredNode({
          name: d.data.name,
          value: d.data.size || 0,
          path: fullParts.join("/")
        });
      })
      .on("mouseout", (event, d) => {
        d3.select(event.currentTarget).attr("opacity", 0.8).attr("stroke", "none");
        setHoveredNode(null);
      })
      .on("click", (event, d) => {
        event.stopPropagation();
        if (d.data.type === 'file') return;
        const parts = d.ancestors().reverse().map(n => n.data.name);
        const fullParts = focusPath.length > 0 ? focusPath.concat(parts.slice(1)) : parts;
        setFocusPath(fullParts);
      });

    // Text labels (Headers for groups)
    nodes.filter(d => d.depth === 1)
      .append("text")
      .attr("x", 4)
      .attr("y", 18)
      .text(d => d.data.name)
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .attr("fill", "#1e293b");
    
    // Text labels (File names if space permits)
    nodes.filter(d => d.depth > 1)
      .append("text")
      .attr("x", 4)
      .attr("y", 14)
      .text(d => {
        const width = d.x1 - d.x0;
        return width > 50 ? d.data.name : ""; // Only show if wide enough
      })
      .attr("font-size", "10px")
      .attr("fill", "white")
      .style("pointer-events", "none")
      .attr("clip-path", "polygon(0 0, 100% 0, 100% 100%, 0 100%)"); // Simple clip

  }, [currentRoot, focusPath, groupColors]);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="mb-4 flex justify-between items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Disk Space Usage Map</h2>
          <div className="text-xs text-gray-500 mt-1">
            {focusPath.length > 0 ? focusPath.join(' / ') : data.name}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFocusPath((prev) => prev.slice(0, -1))}
            disabled={focusPath.length === 0}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
              focusPath.length === 0
                ? 'text-gray-400 border-gray-200 cursor-not-allowed'
                : 'text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            Back
          </button>
          <button
            onClick={() => setFocusPath([])}
            disabled={focusPath.length === 0}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
              focusPath.length === 0
                ? 'text-gray-400 border-gray-200 cursor-not-allowed'
                : 'text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            Reset
          </button>
        </div>
        {hoveredNode ? (
          <div className="text-sm bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
            <span className="font-semibold text-gray-700">{hoveredNode.name}</span>
            <span className="mx-2 text-gray-400">|</span>
            <span className="text-blue-600 font-mono">{formatSize(hoveredNode.value)}</span>
          </div>
        ) : (
          <div className="text-sm text-gray-400 italic">Hover over blocks for details</div>
        )}
      </div>
      <div ref={containerRef} className="flex-1 min-h-[500px] w-full relative overflow-hidden rounded-lg bg-gray-50">
        <svg ref={svgRef} className="w-full h-full block" />
      </div>
      <div className="mt-2 text-xs text-gray-400 text-center">
        Size represents file size on disk. Colors represent top-level directories.
      </div>
      <div className="mt-3 text-sm text-gray-500 text-center">
        使用方法：点击文件夹块进入下一级，使用 Back/Reset 返回；悬停查看完整路径与大小。
      </div>
    </div>
  );
};
