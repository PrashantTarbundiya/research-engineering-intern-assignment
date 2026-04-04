import { useRef, useEffect, useCallback, useState } from 'react'
import cytoscape from 'cytoscape'

const communityColors = { 0: '#3b82f6', 1: '#f59e0b', 2: '#10b981', 3: '#8b5cf6', 4: '#f43f5e' }

export default function NetworkGraph({ data, height = 400 }) {
  const cyRef = useRef(null)
  const containerRef = useRef(null)
  const tooltipRef = useRef(null)
  const initRef = useRef(false)
  const [removedNodes, setRemovedNodes] = useState(new Set())

  const handleRemoveRoot = () => {
    if (!data?.nodes) return
    let maxNode = null
    let maxVal = -1
    data.nodes.forEach(n => {
      const d = n.data || n
      if (!removedNodes.has(String(d.id)) && (d.size || 0) > maxVal) {
        maxVal = d.size || 0
        maxNode = String(d.id)
      }
    })
    if (maxNode) setRemovedNodes(prev => new Set(prev).add(maxNode))
  }

  const handleReset = () => setRemovedNodes(new Set())

  const initGraph = useCallback(() => {
    if (!data?.nodes?.length || !containerRef.current) return
    if (initRef.current) return
    initRef.current = true

    const container = containerRef.current
    const els = []
    data.nodes.forEach(n => {
      const d = n.data || n
      if (!removedNodes.has(String(d.id))) {
        els.push({ data: { id: String(d.id), label: d.label || '', community: d.community ?? 0, pagerank: d.pagerank || 0, size: d.size || 0 } })
      }
    })
    data.edges.forEach(e => {
      const d = e.data || e
      if (!removedNodes.has(String(d.source)) && !removedNodes.has(String(d.target))) {
        els.push({ data: { source: String(d.source), target: String(d.target), weight: d.weight || 1 } })
      }
    })

    try {
      const cy = cytoscape({
        container,
        elements: els,
        style: [
          {
            selector: 'node',
            style: {
              'background-color': (el) => communityColors[el.data('community')] || '#3b82f6',
              width: (el) => { const s = el.data('size'); return s ? Math.max(16, Math.min(s / 30, 56)) : 32 },
              height: (el) => { const s = el.data('size'); return s ? Math.max(16, Math.min(s / 30, 56)) : 32 },
              label: 'data(label)',
              color: '#e4e4e7',
              'font-size': '10px',
              'font-family': 'Inter, sans-serif',
              'text-valign': 'bottom',
              'text-halign': 'center',
              'text-margin-y': 12,
              'border-width': 2,
              'border-color': (el) => communityColors[el.data('community')] || '#3b82f6',
              'border-opacity': 0.4,
            }
          },
          {
            selector: 'edge',
            style: {
              width: (el) => Math.max(0.8, (el.data('weight') || 1) * 0.5),
              'line-color': '#3f3f46',
              opacity: 0.5,
              'curve-style': 'haystack',
            }
          }
        ],
        layout: { name: 'cose', animate: true, animationDuration: 500, fit: true, padding: 32 },
        minZoom: 0.3,
        maxZoom: 3,
      })

      cyRef.current = cy

      cy.on('mouseover', 'node', (evt) => {
        const n = evt.target
        if (!n || !n.popperRef) return
        const pos = n.renderedPosition()
        if (tooltipRef.current) {
          tooltipRef.current.style.left = (pos.x + 16) + 'px'
          tooltipRef.current.style.top = (pos.y - 10) + 'px'
          tooltipRef.current.innerHTML = `<div style="color:#fff;font-weight:600">${n.data('label')}</div><div style="color:#a1a1aa;font-size:11px;margin-top:2px">Community: ${n.data('community')} · PageRank: ${(n.data('pagerank') || 0).toFixed(4)}</div>`
          tooltipRef.current.style.display = 'block'
        }
      })
      cy.on('mouseout', 'node', () => { if (tooltipRef.current) tooltipRef.current.style.display = 'none' })

      return () => {
        try {
          if (cy && !cy.destroyed()) {
            cy.stop(true, true)
            cy.destroy()
          }
        } catch {}
        cyRef.current = null
        initRef.current = false
      }
    } catch {
      initRef.current = false
    }
  }, [data, removedNodes])

  useEffect(() => {
    initRef.current = false // force re-init
    const cleanup = initGraph()
    return cleanup
  }, [initGraph, removedNodes])

  if (!data?.nodes?.length) return <div className="flex items-center justify-center text-zinc-500 text-sm" style={{ height }}>No network data</div>

  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-zinc-300">Network — {data.nodes.length - removedNodes.size} nodes active</p>
        <div className="flex gap-2">
          <button onClick={handleRemoveRoot} className="text-[10px] bg-red-500/20 text-red-500 px-2 py-1 rounded hover:bg-red-500/30">Remove Root Node</button>
          {removedNodes.size > 0 && <button onClick={handleReset} className="text-[10px] bg-white/10 text-white px-2 py-1 rounded hover:bg-white/20">Reset</button>}
        </div>
      </div>

      <div className="relative">
        <div ref={containerRef} style={{ height, borderRadius: '0.5rem', overflow: 'hidden', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.04)' }} />
        <div ref={tooltipRef} className="absolute pointer-events-none bg-zinc-900 border border-white/15 rounded-lg px-3 py-2 text-xs shadow-xl z-10" style={{ display: 'none' }} />
      </div>

      {removedNodes.size > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-zinc-400">
          <span className="font-medium text-zinc-300">Removed Nodes: </span>
          {Array.from(removedNodes).map((id, i) => {
            const nodeData = data.nodes.find(n => String((n.data || n).id) === id)
            const label = (nodeData?.data || nodeData)?.label || id
            return (
              <span key={id} className="flex items-center gap-1.5">
                <span className="bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-zinc-200">{label}</span>
                {i < removedNodes.size - 1 && <span className="text-zinc-500">→</span>}
              </span>
            )
          })}
        </div>
      )}
    </>
  )
}
