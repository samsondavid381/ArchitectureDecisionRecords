// src/components/ArchitectureMap.tsx
import React, { useEffect, useRef, useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useNavigate } from 'react-router-dom';

// Import D3 modules directly
import * as d3Selection from 'd3-selection';
import * as d3Force from 'd3-force';
import * as d3Drag from 'd3-drag';

interface GraphNode {
  id: string;
  label: string;
  type: 'adr' | 'tag' | 'codeReference';
  status?: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  type: 'related' | 'tag' | 'codeRef';
}

export const ArchitectureMap: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const adrResults = useQuery(api.adrs.getAll);
  const adrs = useMemo(() => adrResults || [], [adrResults]);
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!adrs.length || !svgRef.current) return;
    
    // Clear previous graph
    d3Selection.select(svgRef.current).selectAll("*").remove();
    
    // Create nodes and links
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];
    const tagSet = new Set<string>();
    const codeRefSet = new Set<string>();
    
    // Add ADR nodes
    adrs.forEach(adr => {
      nodes.push({
        id: adr._id.toString(),
        label: adr.title,
        type: 'adr',
        status: adr.status
      });
      
      // Add ADR relationships
      adr.relatedADRs.forEach(related => {
        links.push({
          source: adr._id.toString(),
          target: related,
          type: 'related'
        });
      });
      
      // Collect tags
      adr.tags.forEach(tag => {
        tagSet.add(tag);
        links.push({
          source: adr._id.toString(),
          target: `tag-${tag}`,
          type: 'tag'
        });
      });
      
      // Collect code references
      adr.codeReferences.forEach(ref => {
        const refId = `code-${ref.id}`;
        codeRefSet.add(refId);
        links.push({
          source: adr._id.toString(),
          target: refId,
          type: 'codeRef'
        });
      });
    });
    
    // Add tag nodes
    tagSet.forEach(tag => {
      nodes.push({
        id: `tag-${tag}`,
        label: tag,
        type: 'tag'
      });
    });
    
    // Add code reference nodes
    adrs.forEach(adr => {
      adr.codeReferences.forEach(ref => {
        nodes.push({
          id: `code-${ref.id}`,
          label: ref.path,
          type: 'codeReference'
        });
      });
    });
    
    // Set up SVG and simulation
    const width = 960;
    const height = 600;
    
    const svg = d3Selection.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height]);
    
    // Define arrow markers for directed links
    svg.append("defs").selectAll("marker")
      .data(["related", "tag", "codeRef"])
      .enter().append("marker")
      .attr("id", d => `arrow-${d}`)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 15)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("fill", d => d === "related" ? "#999" : d === "tag" ? "#4c9" : "#69b")
      .attr("d", "M0,-5L10,0L0,5");
    
    // Create the simulation
    const simulation = d3Force.forceSimulation<GraphNode>(nodes)
      .force("link", d3Force.forceLink<GraphNode, GraphLink>(links).id(d => d.id).distance(100))
      .force("charge", d3Force.forceManyBody<GraphNode>().strength(-400))
      .force("center", d3Force.forceCenter<GraphNode>(width / 2, height / 2))
      .force("collide", d3Force.forceCollide<GraphNode>(30));
    
    // Create the links
    const link = svg.append("g")
      .selectAll("path")
      .data(links)
      .enter().append("path")
      .attr("stroke", d => d.type === "related" ? "#999" : d.type === "tag" ? "#4c9" : "#69b")
      .attr("stroke-width", 1.5)
      .attr("marker-end", d => `url(#arrow-${d.type})`)
      .attr("fill", "none");
    
    // Create the nodes
    const node = svg.append("g")
      .selectAll("g")
      .data(nodes)
      .enter().append("g")
      .call(d3Drag.drag<SVGGElement, GraphNode>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));
    
    // Add circles for each node
    node.append("circle")
      .attr("r", d => d.type === 'adr' ? 20 : 12)
      .attr("fill", d => {
        if (d.type === 'adr') {
          // Different colors for different statuses
          switch (d.status) {
            case 'proposed': return "#ffe066";
            case 'accepted': return "#63c7b2";
            case 'rejected': return "#ff6b6b";
            case 'deprecated': return "#d3d3d3";
            case 'superseded': return "#e2b6cf";
            case 'hypothesized': return "#b5c7ed";
            case 'confirmed': return "#75b798";
            default: return "#f8f9fa";
          }
        } else if (d.type === 'tag') {
          return "#4c9";
        } else {
          return "#69b";
        }
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 2);
    
    // Add labels
    node.append("text")
      .attr("dx", 0)
      .attr("dy", d => d.type === 'adr' ? -25 : -15)
      .attr("text-anchor", "middle")
      .text(d => d.label)
      .attr("font-size", d => d.type === 'adr' ? "10px" : "8px")
      .attr("fill", "#333")
      .each(function(d) {
        // Wrap text for long labels
        const text = d3Selection.select(this);
        const words = d.label.split(/\s+/);
        let line: string[] = [];
        let lineNumber = 0;
        const lineHeight = 1.1;
        const y = text.attr("dy");
        const dy = parseFloat(y);
        let tspan = text.text("")
          .append("tspan")
          .attr("x", 0)
          .attr("y", y)
          .attr("dy", `${dy}px`);
        
        for (let i = 0; i < words.length; i++) {
          line.push(words[i]);
          tspan.text(line.join(" "));
          if ((tspan.node() as SVGTextElement).getComputedTextLength() > 100) {
            line.pop();
            tspan.text(line.join(" "));
            line = [words[i]];
            tspan = text.append("tspan")
              .attr("x", 0)
              .attr("y", y)
              .attr("dy", `${++lineNumber * lineHeight + dy}px`)
              .text(words[i]);
          }
        }
      });
    
    // Make ADR nodes clickable to navigate to detail page
    node.on("click", (_, d) => {
      if (d.type === 'adr') {
        navigate(`/adrs/${d.id}`);
      }
    });
    
    // Hover effect
    node
      .on("mouseover", function() {
        d3Selection.select(this).select("circle")
          .attr("stroke", "#333")
          .attr("stroke-width", 3);
      })
      .on("mouseout", function() {
        d3Selection.select(this).select("circle")
          .attr("stroke", "#fff")
          .attr("stroke-width", 2);
      });
    
    // Update positions during simulation
    simulation.on("tick", () => {
      link.attr("d", (d) => {
        const sourceNode = d.source as GraphNode;
        const targetNode = d.target as GraphNode;
        
        if (!sourceNode.x || !sourceNode.y || !targetNode.x || !targetNode.y) return "";
        
        const dx = targetNode.x - sourceNode.x;
        const dy = targetNode.y - sourceNode.y;
        const dr = Math.sqrt(dx * dx + dy * dy);
        
        // Create a slight curve in the links
        return `M${sourceNode.x},${sourceNode.y}A${dr},${dr} 0 0,1 ${targetNode.x},${targetNode.y}`;
      });
      
      node.attr("transform", (d) => {
        if (!d.x || !d.y) return "";
        return `translate(${d.x},${d.y})`;
      });
    });
    
    // Drag functions
    function dragstarted(event: { active: boolean; subject: GraphNode }) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }
    
    function dragged(event: { x: number; y: number; subject: GraphNode }) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }
    
    function dragended(event: { active: boolean; subject: GraphNode }) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }
    
  }, [adrs, navigate]);
  
  return (
    <div className="architecture-map">
      <h2>Architecture Knowledge Map</h2>
      <div className="map-container">
        <svg 
          ref={svgRef} 
          width="100%" 
          height="600px"
          style={{ border: "1px solid #ddd", borderRadius: "4px" }} 
        />
      </div>
      <div className="map-legend">
        <h3>Legend</h3>
        <div className="legend-item">
          <span className="node-dot proposed"></span>
          <span>Proposed ADR</span>
        </div>
        <div className="legend-item">
          <span className="node-dot accepted"></span>
          <span>Accepted ADR</span>
        </div>
        <div className="legend-item">
          <span className="node-dot rejected"></span>
          <span>Rejected ADR</span>
        </div>
        <div className="legend-item">
          <span className="node-dot tag"></span>
          <span>Tag</span>
        </div>
        <div className="legend-item">
          <span className="node-dot code"></span>
          <span>Code Reference</span>
        </div>
      </div>
    </div>
  );
};